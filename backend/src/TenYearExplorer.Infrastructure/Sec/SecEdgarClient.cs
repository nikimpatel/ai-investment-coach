using System.Net.Http.Headers;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using TenYearExplorer.Application.Abstractions;
using TenYearExplorer.Application.Configuration;
using TenYearExplorer.Domain.Models;

namespace TenYearExplorer.Infrastructure.Sec;

public sealed class SecEdgarClient : ISecEdgarClient
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    private readonly HttpClient _httpClient;
    private readonly SecOptions _options;
    private readonly ILogger<SecEdgarClient> _logger;

    public SecEdgarClient(
        HttpClient httpClient,
        IOptions<SecOptions> options,
        ILogger<SecEdgarClient> logger)
    {
        _httpClient = httpClient;
        _options = options.Value;
        _logger = logger;
    }

    public Task<SecCompanyFactsDocument> GetCompanyFactsAsync(string cik, CancellationToken cancellationToken) =>
        GetAsync<SecCompanyFactsDocument>($"/api/xbrl/companyfacts/CIK{NormalizeCik(cik)}.json", cancellationToken);

    public Task<SecSubmissionsDocument> GetSubmissionsAsync(string cik, CancellationToken cancellationToken) =>
        GetAsync<SecSubmissionsDocument>($"/submissions/CIK{NormalizeCik(cik)}.json", cancellationToken);

    private async Task<T> GetAsync<T>(string relativePath, CancellationToken cancellationToken)
    {
        if (!_options.IsIdentificationConfigured)
        {
            throw new InvalidOperationException(
                "SEC identification configuration is missing. Set SEC:ApplicationName and SEC:ContactEmail.");
        }

        using var request = new HttpRequestMessage(HttpMethod.Get, relativePath.TrimStart('/'));
        request.Headers.UserAgent.Clear();
        request.Headers.TryAddWithoutValidation("User-Agent", _options.BuildUserAgent());
        request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

        _logger.LogInformation("Requesting SEC resource {Path}", relativePath);
        using var response = await _httpClient.SendAsync(request, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            var body = await response.Content.ReadAsStringAsync(cancellationToken);
            _logger.LogWarning(
                "SEC request failed with {StatusCode}: {Body}",
                (int)response.StatusCode,
                Truncate(body, 300));
            throw new HttpRequestException(
                $"SEC request failed with status {(int)response.StatusCode} ({response.ReasonPhrase}).");
        }

        await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        var document = await JsonSerializer.DeserializeAsync<T>(stream, JsonOptions, cancellationToken);
        if (document is null)
        {
            throw new HttpRequestException("SEC response deserialized to null.");
        }

        return document;
    }

    private static string NormalizeCik(string cik) =>
        cik.Trim().PadLeft(10, '0');

    private static string Truncate(string value, int max) =>
        value.Length <= max ? value : value[..max] + "...";
}
