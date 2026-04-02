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

    // Test for IsValidCharacters method NOT passed
    [Fact]
    public void IsValidCharacters_ReturnsFalse_WhenWordContainsNonSwedishLetters()
    {
        // Arrange
        var validator = new WordValidator();

        // Act
        var result = validator.IsValidCharacters("hello!");

        // Assert
        Assert.False(result);
    }
    // Test for IsValidCharacters method passed
    [Fact]
    public void IsValidCharacters_ReturnsTrue_WhenWordContainsOnlySwedishLetters()
    {
        var validator = new WordValidator();

        var result = validator.IsValidCharacters("fågel");

        Assert.True(result);
    }
    // Test for IsInDictionary method found passed
    [Fact]
    public void IsInDictionary_ReturnsTrue_WhenWordExistsInDictionary()
    {
        // Arrange
        var dictionary = new HashSet<string> { "fågel", "katt", "hund" };
        var validator = new WordValidator();

        // Act
        var result = validator.IsInDictionary("fågel", dictionary);

        // Assert
        Assert.True(result);
    }

    // Test for IsInDictionary method not found
    [Fact]  
    public void IsInDictionary_ReturnsFalse_WhenWordDoesNotExistInDictionary()
    {
        // Arrange
        var dictionary = new HashSet<string> { "fågel", "katt", "hund" };
        var validator = new WordValidator();

        // Act
        var result = validator.IsInDictionary("bil", dictionary);

        // Assert
        Assert.False(result);
    }
}