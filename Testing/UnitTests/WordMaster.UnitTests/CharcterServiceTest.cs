using WordMaster.Models;
using WordMaster.Services;
using Xunit;

namespace WordMaster.Tests;

/// <summary>
/// Tests for CharacterService.
/// These cover: GetAll, GetById, CalculateAbilityBonus, IsFreezeImmune.
/// </summary>
public class CharacterServiceTests
{
    private readonly CharacterService _service = new();

    
    // GetAll
    

    [Fact]
    public void GetAll_ReturnsFourCharacters()
    {
        var characters = _service.GetAll();

        Assert.Equal(4, characters.Count);
    }

    [Fact]
    public void GetAll_ContainsExpectedCharacterIds()
    {
        var ids = _service.GetAll().Select(c => c.Id).ToList();

        Assert.Contains("ugglan",   ids);
        Assert.Contains("leopard",  ids);
        Assert.Contains("musen",    ids);
        Assert.Contains("björnen",  ids);
    }

   
    // GetById
    

    [Theory]
    [InlineData("ugglan")]
    [InlineData("leopard")]
    [InlineData("musen")]
    [InlineData("björnen")]
    public void GetById_ReturnsCharacter_WhenIdExists(string id)
    {
        var character = _service.GetById(id);

        Assert.NotNull(character);
        Assert.Equal(id, character!.Id);
    }

    [Fact]
    public void GetById_ReturnsNull_WhenIdDoesNotExist()
    {
        var character = _service.GetById("dragon");

        Assert.Null(character);
    }

    [Fact]
    public void GetById_IsCaseInsensitive()
    {
        // Should work with any casing
        var a = _service.GetById("UGGLAN");
        var b = _service.GetById("Ugglan");
        var c = _service.GetById("ugglan");

        Assert.NotNull(a);
        Assert.NotNull(b);
        Assert.NotNull(c);
    }

    
    // Ugglan — LongWordBonus (+3 for words longer than 8 letters)
    

    [Fact]
    public void Ugglan_EarnsBonus_WhenWordIsLongerThan8Letters()
    {
        // "katastrofal" is 11 letters — qualifies
        var bonus = _service.CalculateAbilityBonus("ugglan", "katastrofal");

        Assert.Equal(3, bonus);
    }

    [Fact]
    public void Ugglan_EarnsNoBonus_WhenWordIs8LettersExactly()
    {
        // Exactly 8 letters — NOT longer than 8, so no bonus
        var bonus = _service.CalculateAbilityBonus("ugglan", "abcdefgh"); // 8 letters

        Assert.Equal(0, bonus);
    }

    [Fact]
    public void Ugglan_EarnsNoBonus_WhenWordIsShorterThan8Letters()
    {
        var bonus = _service.CalculateAbilityBonus("ugglan", "katt"); // 4 letters

        Assert.Equal(0, bonus);
    }

    
    // Leopard — FastAnswerBonus (+3 for words submitted within 10 seconds)
    

    [Fact]
    public void Leopard_EarnsBonus_WhenSubmittedWithin10Seconds()
    {
        var bonus = _service.CalculateAbilityBonus("leopard", "katt", secondsTaken: 7.5);

        Assert.Equal(3, bonus);
    }

    [Fact]
    public void Leopard_EarnsBonus_WhenSubmittedAtExactly10Seconds()
    {
        // Boundary: exactly 10 seconds should still qualify
        var bonus = _service.CalculateAbilityBonus("leopard", "katt", secondsTaken: 10.0);

        Assert.Equal(3, bonus);
    }

    [Fact]
    public void Leopard_EarnsNoBonus_WhenSubmittedAfter10Seconds()
    {
        var bonus = _service.CalculateAbilityBonus("leopard", "katt", secondsTaken: 15.0);

        Assert.Equal(0, bonus);
    }


    // Musen — ShortWordBonus (+1 for words shorter than 4 letters)
    
    [Fact]
    public void Musen_EarnsBonus_WhenWordIsShorterThan4Letters()
    {
        // "bål" is 3 letters — qualifies
        var bonus = _service.CalculateAbilityBonus("musen", "bål");

        Assert.Equal(1, bonus);
    }

    [Fact]
    public void Musen_EarnsNoBonus_WhenWordIs4LettersExactly()
    {
        // Exactly 4 letters — NOT shorter than 4
        var bonus = _service.CalculateAbilityBonus("musen", "katt"); // 4 letters

        Assert.Equal(0, bonus);
    }

    [Fact]
    public void Musen_EarnsNoBonus_WhenWordIsLongerThan4Letters()
    {
        var bonus = _service.CalculateAbilityBonus("musen", "elefant");

        Assert.Equal(0, bonus);
    }

    
    // Björnen — FreezeImmunity (0 bonus points, but immune to freeze)
    

    [Fact]
    public void Björnen_EarnsZeroBonusPoints_Always()
    {
        var bonus = _service.CalculateAbilityBonus("björnen", "elefant");

        Assert.Equal(0, bonus);
    }

    [Fact]
    public void Björnen_IsFreezeImmune_ReturnsTrue()
    {
        var immune = _service.IsFreezeImmune("björnen");

        Assert.True(immune);
    }

    [Fact]
    public void Ugglan_IsFreezeImmune_ReturnsFalse()
    {
        var immune = _service.IsFreezeImmune("ugglan");

        Assert.False(immune);
    }

    [Fact]
    public void Leopard_IsFreezeImmune_ReturnsFalse()
    {
        var immune = _service.IsFreezeImmune("leopard");

        Assert.False(immune);
    }

    [Fact]
    public void Musen_IsFreezeImmune_ReturnsFalse()
    {
        var immune = _service.IsFreezeImmune("musen");

        Assert.False(immune);
    }

    
    // Unknown character — graceful fallback
    

    [Fact]
    public void CalculateAbilityBonus_ReturnsZero_ForUnknownCharacter()
    {
        var bonus = _service.CalculateAbilityBonus("dragon", "katt");

        Assert.Equal(0, bonus);
    }

    [Fact]
    public void IsFreezeImmune_ReturnsFalse_ForUnknownCharacter()
    {
        var immune = _service.IsFreezeImmune("dragon");

        Assert.False(immune);
    }

    
    // Character shape — verify all characters have required data
    

    [Fact]
    public void AllCharacters_HaveNonEmptyNameAndDescription()
    {
        foreach (var c in _service.GetAll())
        {
            Assert.False(string.IsNullOrWhiteSpace(c.Name),
                $"Character '{c.Id}' is missing a Name.");
            Assert.False(string.IsNullOrWhiteSpace(c.Description),
                $"Character '{c.Id}' is missing a Description.");
            Assert.False(string.IsNullOrWhiteSpace(c.Ability.EffectDescription),
                $"Character '{c.Id}' is missing an EffectDescription.");
        }
    }
}