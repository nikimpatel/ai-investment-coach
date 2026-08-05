using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using TenYearExplorer.Application.Abstractions;
using TenYearExplorer.Application.Configuration;
using TenYearExplorer.Application.Services;
using TenYearExplorer.Infrastructure.Caching;
using TenYearExplorer.Infrastructure.Sec;

namespace TenYearExplorer.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddTenYearExplorer(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddOptions<SecOptions>()
            .Bind(configuration.GetSection(SecOptions.SectionName))
            .Validate(o => o.CacheDurationMinutes > 0, "SEC:CacheDurationMinutes must be > 0")
            .Validate(o => o.RequestTimeoutSeconds > 0, "SEC:RequestTimeoutSeconds must be > 0")
            .ValidateOnStart();

        var sec = configuration.GetSection(SecOptions.SectionName).Get<SecOptions>() ?? new SecOptions();

        services.AddSingleton<IFinancialDataCache, MemoryFinancialDataCache>();
        services.AddSingleton<ICompanyFactsCache, MemoryCompanyFactsCache>();
        services.AddSingleton<IFinancialMetricsCalculator, FinancialMetricsCalculator>();
        services.AddSingleton<IXbrlKpiNormalizer, XbrlKpiNormalizer>();
        services.AddScoped<IFinancialFactsProvider, SecFinancialFactsProvider>();
        services.AddScoped<IFinancialHistoryService, FinancialHistoryService>();

        if (sec.UseFixtureData)
        {
            services.AddSingleton<ISecEdgarClient, FixtureSecEdgarClient>();
        }
        else
        {
            services.AddHttpClient<ISecEdgarClient, SecEdgarClient>((sp, client) =>
            {
                var options = sp.GetRequiredService<Microsoft.Extensions.Options.IOptions<SecOptions>>().Value;
                client.BaseAddress = new Uri(options.BaseUrl.TrimEnd('/') + "/");
                client.Timeout = TimeSpan.FromSeconds(Math.Max(1, options.RequestTimeoutSeconds));
            });
        }

        return services;
    }
}
