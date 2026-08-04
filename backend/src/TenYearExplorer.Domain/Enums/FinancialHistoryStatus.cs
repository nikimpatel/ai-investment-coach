namespace TenYearExplorer.Domain.Enums;

public enum FinancialHistoryStatus
{
    Success = 0,
    PartiallySupported = 1,
    UnsupportedMetric = 2,
    InsufficientHistory = 3,
    ProviderUnavailable = 4,
    InvalidConfiguration = 5,
}
