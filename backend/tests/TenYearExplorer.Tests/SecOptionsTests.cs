using TenYearExplorer.Application.Configuration;

namespace TenYearExplorer.Tests;

public sealed class SecOptionsTests
{
    [Fact]
    public void PlaceholderEmail_IsNotConfigured()
    {
        var options = new SecOptions
        {
            ApplicationName = "Demo App",
            ContactEmail = "your-email@example.com",
        };
        Assert.False(options.IsIdentificationConfigured);
    }

    [Fact]
    public void RealLookingValues_AreConfigured()
    {
        var options = new SecOptions
        {
            ApplicationName = "Nikita TenYearExplorer",
            ContactEmail = "nikita@company.org",
        };
        Assert.True(options.IsIdentificationConfigured);
        Assert.Equal("Nikita TenYearExplorer nikita@company.org", options.BuildUserAgent());
    }

    [Fact]
    public void Blank_IsNotConfigured()
    {
        Assert.False(new SecOptions().IsIdentificationConfigured);
    }
}
