namespace TenYearExplorer.Domain.Models;

public sealed record CompanyIdentity(
    string Symbol,
    string Name,
    string Cik);
