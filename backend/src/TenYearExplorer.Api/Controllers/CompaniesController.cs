using Microsoft.AspNetCore.Mvc;
using TenYearExplorer.Api.Mapping;
using TenYearExplorer.Application.Abstractions;

namespace TenYearExplorer.Api.Controllers;

[ApiController]
[Route("api/companies")]
public sealed class CompaniesController : ControllerBase
{
    private readonly IFinancialHistoryService _historyService;

    public CompaniesController(IFinancialHistoryService historyService)
    {
        _historyService = historyService;
    }

    /// <summary>
    /// Sprint 2: Apple Inc. annual financial history for an allowlisted metric
    /// (revenue, gross-profit, operating-income, net-income, diluted-eps).
    /// </summary>
    [HttpGet("{symbol}/financial-history")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
    public async Task<IActionResult> GetFinancialHistory(
        [FromRoute] string symbol,
        [FromQuery] string metric = "revenue",
        [FromQuery] string period = "annual",
        [FromQuery] int years = 10,
        CancellationToken cancellationToken = default)
    {
        var result = await _historyService.GetHistoryAsync(symbol, metric, period, years, cancellationToken);
        var response = FinancialHistoryMapper.ToResponse(result);
        return StatusCode(FinancialHistoryMapper.ToHttpStatusCode(result.Status), response);
    }
}
