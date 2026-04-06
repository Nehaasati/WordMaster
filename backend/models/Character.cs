namespace WordMaster.Models;

/// <summary>
/// Represents a playable character with a unique ability.
/// </summary>
public class Character
{
    public string Id { get; set; } = "";           // e.g. "ugglan"
    public string Name { get; set; } = "";         // e.g. "Ugglan"
    public string Description { get; set; } = "";  // shown in lobby UI
    public CharacterAbility Ability { get; set; } = new();
}

/// <summary>
/// Defines what bonus/effect a character provides.
/// </summary>
public class CharacterAbility
{
    public AbilityType Type { get; set; }
    public int BonusPoints { get; set; }
    public int? ThresholdLength { get; set; }   // used for word-length conditions
    public int? ThresholdSeconds { get; set; }  // used for speed conditions
    public string EffectDescription { get; set; } = "";
}

public enum AbilityType
{
    LongWordBonus,      // Ugglan  — +3 pts for words longer than 8 letters
    FastAnswerBonus,    // Leopard — +3 pts for words submitted within 10 seconds
    ShortWordBonus,     // Musen   — +1 pt  for words shorter than 4 letters
    FreezeImmunity      // Björnen — immune to the Freeze chaos event
}