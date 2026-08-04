using TenYearExplorer.Application.Configuration;
using TenYearExplorer.Infrastructure.Sec;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

namespace TenYearExplorer.Tests;

/// <summary>
/// Opt-in live SEC verification. Skipped unless SEC__ApplicationName and SEC__ContactEmail
/// are configured and SEC__UseFixtureData is not true.
/// </summary>
public sealed class LiveSecIntegrationTests
{
    private static bool LiveEnabled()
    {
        var app = Environment.GetEnvironmentVariable("SEC__ApplicationName");
        var email = Environment.GetEnvironmentVariable("SEC__ContactEmail");
        var fixture = Environment.GetEnvironmentVariable("SEC__UseFixtureData");
        if (string.Equals(fixture, "true", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        var options = new SecOptions
        {
            ApplicationName = app ?? "",
            ContactEmail = email ?? "",
        };
        return options.IsIdentificationConfigured;
    }

    [Fact]
    public async Task Live_CompanyFacts_Reachable_For_Apple()
    {
        if (!LiveEnabled())
        {
            // Documented skip: configure SEC__ApplicationName and SEC__ContactEmail to enable.
            return;
        }

        var options = Options.Create(new SecOptions
        {
            ApplicationName = Environment.GetEnvironmentVariable("SEC__ApplicationName")!,
            ContactEmail = Environment.GetEnvironmentVariable("SEC__ContactEmail")!,
            BaseUrl = "https://data.sec.gov",
            RequestTimeoutSeconds = 30,
            UseFixtureData = false,
        });

        using var http = new HttpClient
        {
            BaseAddress = new Uri("https://data.sec.gov/"),
            Timeout = TimeSpan.FromSeconds(30),
        };
        var client = new SecEdgarClient(http, options, NullLogger<SecEdgarClient>.Instance);
        var facts = await client.GetCompanyFactsAsync("0000320193", CancellationToken.None);
        Assert.Equal("Apple Inc.", facts.EntityName);
        Assert.True(facts.Facts.ContainsKey("us-gaap"));
    }
}
