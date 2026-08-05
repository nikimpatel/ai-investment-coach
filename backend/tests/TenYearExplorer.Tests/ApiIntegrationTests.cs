using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using TenYearExplorer.Api.Contracts;

namespace TenYearExplorer.Tests;

public sealed class ApiIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    public ApiIntegrationTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.WithWebHostBuilder(_ => { }).CreateClient();
    }

    [Fact]
    public async Task FinancialHistory_Returns_FrontendSafe_Dto()
    {
        var response = await _client.GetAsync("/api/companies/AAPL/financial-history?metric=revenue&period=annual&years=10");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var payload = await response.Content.ReadFromJsonAsync<FinancialHistoryResponse>(JsonOptions);
        Assert.NotNull(payload);
        Assert.Equal("Success", payload!.Status);
        Assert.Equal("AAPL", payload.Symbol);
        Assert.Equal(10, payload.Points.Count);
        Assert.NotNull(payload.Summary);
        Assert.Equal(payload.Points[0].Value, payload.Summary!.StartValue);
        Assert.Equal(payload.Points[^1].Value, payload.Summary.EndValue);

        var raw = await response.Content.ReadAsStringAsync();
        Assert.DoesNotContain("your-email", raw, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("ContactEmail", raw, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("\"facts\"", raw, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Unsupported_Metric_Returns_400()
    {
        var response = await _client.GetAsync("/api/companies/AAPL/financial-history?metric=gross-margin&period=annual&years=10");
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var payload = await response.Content.ReadFromJsonAsync<FinancialHistoryResponse>(JsonOptions);
        Assert.Equal("UnsupportedMetric", payload!.Status);
    }

    [Fact]
    public async Task GrossProfit_Returns_Ten_Points_And_Margins()
    {
        var response = await _client.GetAsync("/api/companies/AAPL/financial-history?metric=gross-profit&period=annual&years=10");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var payload = await response.Content.ReadFromJsonAsync<FinancialHistoryResponse>(JsonOptions);
        Assert.NotNull(payload);
        Assert.Equal("gross-profit", payload!.Metric);
        Assert.Equal("Gross Profit", payload.MetricLabel);
        Assert.Equal(10, payload.Points.Count);
        Assert.NotNull(payload.Margins);
        Assert.NotNull(payload.Margins!.GrossMargin);
        Assert.Equal("USD", payload.ReportingUnit);
    }

    [Fact]
    public async Task DilutedEps_Uses_PerShare_Unit()
    {
        var response = await _client.GetAsync("/api/companies/AAPL/financial-history?metric=diluted-eps&period=annual&years=10");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var payload = await response.Content.ReadFromJsonAsync<FinancialHistoryResponse>(JsonOptions);
        Assert.Equal("diluted-eps", payload!.Metric);
        Assert.Equal("USD/shares", payload.ReportingUnit);
        Assert.Equal("per-share", payload.DisplayFormat);
        Assert.All(payload.Points, p => Assert.Equal("EarningsPerShareDiluted", p.Concept));
    }

    [Fact]
    public async Task Second_Request_Reports_Cache_Hit()
    {
        await _client.GetAsync("/api/companies/AAPL/financial-history?metric=revenue&period=annual&years=10");
        var response = await _client.GetAsync("/api/companies/AAPL/financial-history?metric=revenue&period=annual&years=10");
        var payload = await response.Content.ReadFromJsonAsync<FinancialHistoryResponse>(JsonOptions);
        Assert.Equal("Hit", payload!.CacheStatus);
    }

    [Fact]
    public async Task Different_Metric_Is_Separate_Cache_Miss()
    {
        await _client.GetAsync("/api/companies/AAPL/financial-history?metric=revenue&period=annual&years=10");
        var response = await _client.GetAsync("/api/companies/AAPL/financial-history?metric=net-income&period=annual&years=10");
        var payload = await response.Content.ReadFromJsonAsync<FinancialHistoryResponse>(JsonOptions);
        Assert.Equal("Miss", payload!.CacheStatus);
        Assert.Equal("net-income", payload.Metric);
    }

    [Fact]
    public async Task Health_Ok()
    {
        var response = await _client.GetAsync("/api/health");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }
}
