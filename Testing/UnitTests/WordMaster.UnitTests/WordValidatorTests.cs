using WordMaster.Services;
using Xunit;

namespace WordMaster.Tests;

public class WordValidatorTests
{
    [Fact]
    public void IsValidLength_ReturnsFalse_WhenWordIsTooShort()
    {
        // Arrange
        var validator = new WordValidator();

        // Act
        var result = validator.IsValidLength("h");

        // Assert
        Assert.False(result);
    }
}