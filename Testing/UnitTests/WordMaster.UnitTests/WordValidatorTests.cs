using WordMaster.Services;
using Xunit;

namespace WordMaster.Tests;

public class WordValidatorTests
{
    private readonly WordValidator validator = new();

    // -------------------------------
    // IsValidLength
    // -------------------------------
    // validates that the word is at least 2 characters long
    [Theory]
    [InlineData("h", false)]
    [InlineData("ha", true)]
    [InlineData("hej", true)]

    // validates that empty or whitespace strings are not valid
    public void IsValidLength_WorksCorrectly(string word, bool expected)
    {
        var result = validator.IsValidLength(word);
        Assert.Equal(expected, result);
    }

    // -------------------------------
    // IsValidCharacters
    // -------------------------------

    // validates that the word contains only valid characters (a-z, å, ä, ö)
    [Theory]
    [InlineData("hello!", false)]
    [InlineData("fågel", true)]
    [InlineData("björn1", false)]
    [InlineData("äpple", true)]
    [InlineData("hej då", false)]

    // validates that the word does not contain numbers or symbols or whitespace or anything other than (a-z, å, ä, ö)
    public void IsValidCharacters_WorksCorrectly(string word, bool expected)
    {
        var result = validator.IsValidCharacters(word);
        Assert.Equal(expected, result);
    }

    // -------------------------------
    // IsInDictionary
    // -------------------------------

    // validates that the word exists in the dictionary
    [Fact]
    public void IsInDictionary_ReturnsTrue_WhenWordExists()
    {
        var dictionary = new HashSet<string> { "fågel", "katt", "hund" };

        var result = validator.IsInDictionary("fågel", dictionary);

        Assert.True(result);
    }

    // validates that the word does not exist in the dictionary
    [Fact]
    public void IsInDictionary_ReturnsFalse_WhenWordDoesNotExist()
    {
        var dictionary = new HashSet<string> { "fågel", "katt", "hund" };

        var result = validator.IsInDictionary("bil", dictionary);

        Assert.False(result);
    }

    // -------------------------------
    // IsInCategory
    // -------------------------------

    // validates that the word exists in the specified category
    [Fact]
    public void IsInCategory_ReturnsTrue_WhenWordExistsInCorrectCategory()
    {
        var categories = new Dictionary<string, List<string>>
        {
            { "Animal", new List<string> { "fågel", "katt", "hund" } }
        };

        var result = validator.IsInCategory("fågel", "Animal", categories);

        Assert.True(result);
    }


    // validates that the word exists but in a different category
    [Fact]
    public void IsInCategory_ReturnsFalse_WhenWordExistsButInDifferentCategory()
    {
        var categories = new Dictionary<string, List<string>>
        {
            { "Animal", new List<string> { "fågel" } },
            { "Food", new List<string> { "äpple" } }
        };

        var result = validator.IsInCategory("äpple", "Animal", categories);

        Assert.False(result);
    }

    // validates that the word does not exist in any category

    [Fact]
    public void IsInCategory_ReturnsFalse_WhenWordDoesNotExistAnywhere()
    {
        var categories = new Dictionary<string, List<string>>
        {
            { "Animal", new List<string> { "fågel" } }
        };

        var result = validator.IsInCategory("björn", "Animal", categories);

        Assert.False(result);
    }

    // -------------------------------
    // StartsWithCorrectLetter
    // -------------------------------

    // validates that the word starts with the required letter
    [Theory]
    [InlineData("björn", 'b', true)]
    [InlineData("björn", 'k', false)]
    [InlineData("Älg", 'ä', true)]

    // validates that the method is case-insensitive
    public void StartsWithCorrectLetter_WorksCorrectly(string word, char letter, bool expected)
    {
        var result = validator.StartsWithCorrectLetter(word, letter);
        Assert.Equal(expected, result);
    }

    // -------------------------------
    // IsNotUsedBefore
    // -------------------------------

    // validates that the word has not been used before in the game
    [Theory]
    [InlineData("fågel", new[] { "katt", "hund" }, true)]
    [InlineData("katt", new[] { "katt", "hund" }, false)]
    [InlineData("katt", new[] { "Katt" }, false)]

    // validates that the method is case-insensitive
    public void IsNotUsedBefore_WorksCorrectly(string word, string[] used, bool expected)
    {
        var usedWords = new HashSet<string>(used, StringComparer.OrdinalIgnoreCase);

        var result = validator.IsNotUsedBefore(word, usedWords);

        Assert.Equal(expected, result);
    }

}