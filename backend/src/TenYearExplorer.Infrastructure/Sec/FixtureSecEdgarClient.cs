using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using TenYearExplorer.Application.Abstractions;
using TenYearExplorer.Application.Configuration;
using TenYearExplorer.Domain.Models;

namespace TenYearExplorer.Infrastructure.Sec;

/// <summary>
/// Loads reduced Apple SEC payloads from local fixture files (offline / tests).
/// </summary>
public sealed class FixtureSecEdgarClient : ISecEdgarClient
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    private readonly SecOptions _options;
    private readonly ILogger<FixtureSecEdgarClient> _logger;

    public FixtureSecEdgarClient(IOptions<SecOptions> options, ILogger<FixtureSecEdgarClient> logger)
    {
        _options = options.Value;
        _logger = logger;
    }

    public async Task<SecCompanyFactsDocument> GetCompanyFactsAsync(string cik, CancellationToken cancellationToken)
    {
        var path = ResolvePath(_options.FixtureCompanyFactsPath);
        _logger.LogInformation("Loading company facts fixture from {Path}", path);
        await using var stream = File.OpenRead(path);
        var doc = await JsonSerializer.DeserializeAsync<SecCompanyFactsDocument>(stream, JsonOptions, cancellationToken)
                  ?? throw new InvalidOperationException("Company facts fixture deserialized to null.");
        return doc;
    }

    public async Task<SecSubmissionsDocument> GetSubmissionsAsync(string cik, CancellationToken cancellationToken)
    {
        var path = ResolvePath(_options.FixtureSubmissionsPath);
        _logger.LogInformation("Loading submissions fixture from {Path}", path);
        await using var stream = File.OpenRead(path);
        var doc = await JsonSerializer.DeserializeAsync<SecSubmissionsDocument>(stream, JsonOptions, cancellationToken)
                  ?? throw new InvalidOperationException("Submissions fixture deserialized to null.");
        return doc;
    }

    private static string ResolvePath(string configured)
    {
        if (Path.IsPathRooted(configured) && File.Exists(configured))
        {
            return configured;
        }

        var candidates = new[]
        {
            Path.GetFullPath(configured),
            Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, configured)),
            Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", configured)),
            Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), configured)),
            Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), "..", configured)),
        };

        foreach (var candidate in candidates.Distinct())
        {
            if (File.Exists(candidate))
            {
                return candidate;
            }
        }

        throw new FileNotFoundException($"SEC fixture not found: {configured}");
    }
}
