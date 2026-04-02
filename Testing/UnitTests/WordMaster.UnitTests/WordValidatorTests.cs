using WordMaster.Services;
using Xunit;

namespace WordMaster.Tests;

public class WordValidatorTests
{
    // Test for IsValidLength method
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

// Test for IsValidCharacters method
    [Fact]
    public void IsValidCharacters_ReturnsFalse_WhenWordContainsNonSwedishLetters()
    {
        // Arrange
        var validator = new WordValidator();

        // Act
        var result = validator.IsValidCharacters("höna");

        // Assert
        Assert.False(result);
    }
}