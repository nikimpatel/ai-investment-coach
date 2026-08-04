namespace TenYearExplorer.Application.Configuration;

public sealed class SecOptions
{
    public const string SectionName = "SEC";

    /// <summary>Application name used in the SEC User-Agent header.</summary>
    public string ApplicationName { get; set; } = string.Empty;

    /// <summary>Contact email used in the SEC User-Agent header. Never returned to clients.</summary>
    public string ContactEmail { get; set; } = string.Empty;

    public string BaseUrl { get; set; } = "https://data.sec.gov";

    public int CacheDurationMinutes { get; set; } = 60;

    public int RequestTimeoutSeconds { get; set; } = 30;

    /// <summary>
    /// When true, load Apple facts from local fixtures instead of live SEC.
    /// Intended for offline tests and local demos without SEC identity.
    /// </summary>
    public bool UseFixtureData { get; set; }

    public string FixtureCompanyFactsPath { get; set; } = "fixtures/apple-company-facts-reduced.json";

    public string FixtureSubmissionsPath { get; set; } = "fixtures/apple-submissions-reduced.json";

    public bool IsIdentificationConfigured =>
        !string.IsNullOrWhiteSpace(ApplicationName)
        && !string.IsNullOrWhiteSpace(ContactEmail)
        && !IsPlaceholder(ApplicationName)
        && !IsPlaceholder(ContactEmail);

    public string BuildUserAgent() =>
        $"{ApplicationName.Trim()} {ContactEmail.Trim()}";

    private static bool IsPlaceholder(string value)
    {
        var normalized = value.Trim().ToLowerInvariant();
        if (normalized is "changeme" or "todo" or "your-email@example.com" or "example@example.com")
        {
            return true;
        }

        return normalized.Contains("your-email", StringComparison.Ordinal)
            || normalized.Contains("example.com", StringComparison.Ordinal)
            || normalized.Contains("placeholder", StringComparison.Ordinal)
            || normalized.Contains("your_name", StringComparison.Ordinal);
    }
}
