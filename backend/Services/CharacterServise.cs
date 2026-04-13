using WordMaster.Models;

namespace WordMaster.Services;

/// <summary>
/// Provides access to all available characters and evaluates
/// whether a character's ability should trigger for a given word/context.
/// </summary>
public class CharacterService
{
    // Static character definitions 

    private static readonly List<Character> _characters = new()
    {
        new Character
        {
            Id   = "ugglan",
            Name = "Ugglan",
            Description = "The wise owl rewards long words.",
            Ability = new CharacterAbility
            {
                Type             = AbilityType.LongWordBonus,
                BonusPoints      = 3,
                ThresholdLength  = 5,        // word must be LONGER than 5 letters
                EffectDescription = "+3 bonus points for words longer than 5 letters"
            }
        },
        new Character
        {
            Id   = "leopard",
            Name = "Leopard",
            Description = "Lightning fast — rewards quick answers.",
            Ability = new CharacterAbility
            {
                Type              = AbilityType.FastAnswerBonus,
                BonusPoints       = 3,
                ThresholdSeconds  = 10,      // word must be submitted within 10 seconds
                EffectDescription = "+3 bonus points for words submitted within 10 seconds"
            }
        },
        new Character
        {
            Id   = "musen",
            Name = "Musen",
            Description = "Small but mighty — loves short words.",
            Ability = new CharacterAbility
            {
                Type             = AbilityType.ShortWordBonus,
                BonusPoints      = 1,
                ThresholdLength  = 4,        // word must be SHORTER than 4 letters
                EffectDescription = "+1 bonus point for words shorter than 4 letters"
            }
        },
        new Character
        {
            Id   = "björnen",
            Name = "Björnen",
            Description = "The bear shrugs off freeze attacks.",
            Ability = new CharacterAbility
            {
                Type              = AbilityType.FreezeImmunity,
                BonusPoints       = 0,
                EffectDescription = "Immune to the Freeze chaos event"
            }
        }
    };

    //  Query methods 

    /// <summary>Returns all available characters.</summary>
    public List<Character> GetAll() => _characters;

    /// <summary>Returns one character by its id (case-insensitive), or null.</summary>
    public Character? GetById(string id) =>
        _characters.FirstOrDefault(c =>
            c.Id.Equals(id.Trim(), StringComparison.OrdinalIgnoreCase));

    // Ability evaluation 

    /// <summary>
    /// Returns the bonus points this character earns for a submitted word.
    /// Call this after the word has already been validated as correct.
    /// </summary>
    /// <param name="characterId">The player's chosen character id.</param>
    /// <param name="word">The validated word that was submitted.</param>
    /// <param name="secondsTaken">How many seconds the player took to submit.</param>
    public int CalculateAbilityBonus(string characterId, string word, double secondsTaken = 0)
    {
        var character = GetById(characterId);
        if (character == null) return 0;

        var ability = character.Ability;

        return ability.Type switch
        {
            // Ugglan: word length strictly greater than 8
            AbilityType.LongWordBonus =>
                word.Length > (ability.ThresholdLength ?? 8) ? ability.BonusPoints : 0,

            // Leopard: submitted within the time threshold
            AbilityType.FastAnswerBonus =>
                secondsTaken <= (ability.ThresholdSeconds ?? 10) ? ability.BonusPoints : 0,

            // Musen: word length strictly less than 4
            AbilityType.ShortWordBonus =>
                word.Length < (ability.ThresholdLength ?? 4) ? ability.BonusPoints : 0,

            // Björnen: no point bonus — immunity is handled by the game loop
            AbilityType.FreezeImmunity => 0,

            _ => 0
        };
    }

    /// <summary>
    /// Returns true if a player with this character is immune to Freeze.
    /// </summary>
    public bool IsFreezeImmune(string characterId)
    {
        var character = GetById(characterId);
        return character?.Ability.Type == AbilityType.FreezeImmunity;
    }
}