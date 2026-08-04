using System.Text.Json.Serialization;

namespace TenYearExplorer.Domain.Models;

/// <summary>
/// Reduced SEC Company Facts shape used for deserialization. Not returned by controllers.
/// </summary>
public sealed class SecCompanyFactsDocument
{
    [JsonPropertyName("cik")]
    public long Cik { get; set; }

    [JsonPropertyName("entityName")]
    public string EntityName { get; set; } = string.Empty;

    [JsonPropertyName("facts")]
    public Dictionary<string, Dictionary<string, SecConceptNode>> Facts { get; set; } = new();
}

public sealed class SecConceptNode
{
    [JsonPropertyName("label")]
    public string? Label { get; set; }

    [JsonPropertyName("units")]
    public Dictionary<string, List<SecUnitFact>> Units { get; set; } = new();
}

public sealed class SecUnitFact
{
    [JsonPropertyName("start")]
    public string? Start { get; set; }

    [JsonPropertyName("end")]
    public string End { get; set; } = string.Empty;

    [JsonPropertyName("val")]
    public decimal Val { get; set; }

    [JsonPropertyName("accn")]
    public string Accn { get; set; } = string.Empty;

    [JsonPropertyName("fy")]
    public int? Fy { get; set; }

    [JsonPropertyName("fp")]
    public string? Fp { get; set; }

    [JsonPropertyName("form")]
    public string Form { get; set; } = string.Empty;

    [JsonPropertyName("filed")]
    public string Filed { get; set; } = string.Empty;

    [JsonPropertyName("frame")]
    public string? Frame { get; set; }
}

public sealed class SecSubmissionsDocument
{
    [JsonPropertyName("cik")]
    public string Cik { get; set; } = string.Empty;

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("tickers")]
    public List<string> Tickers { get; set; } = new();

    [JsonPropertyName("exchanges")]
    public List<string> Exchanges { get; set; } = new();

    [JsonPropertyName("filings")]
    public SecFilingsWrapper? Filings { get; set; }
}

public sealed class SecFilingsWrapper
{
    [JsonPropertyName("recent")]
    public SecRecentFilings? Recent { get; set; }
}

public sealed class SecRecentFilings
{
    [JsonPropertyName("accessionNumber")]
    public List<string> AccessionNumber { get; set; } = new();

    [JsonPropertyName("filingDate")]
    public List<string> FilingDate { get; set; } = new();

    [JsonPropertyName("form")]
    public List<string> Form { get; set; } = new();

    [JsonPropertyName("primaryDocument")]
    public List<string> PrimaryDocument { get; set; } = new();

    [JsonPropertyName("reportDate")]
    public List<string> ReportDate { get; set; } = new();
}
