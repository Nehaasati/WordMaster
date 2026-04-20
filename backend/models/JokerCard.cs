namespace WordMaster.Models;
 
/// <summary>
/// Represents a Joker Card assigned to a player in a lobby.
/// One random letter becomes the Joker — any valid word using
/// that letter earns double points. Consumed after one use.
/// </summary>
public class JokerCard
{
    // The lobby this joker belongs to
    public string LobbyId { get; set; } = string.Empty;
 
    // The player this joker belongs to
    public string PlayerId { get; set; } = string.Empty;
 
    // The gold letter (e.g. "K")
    public string JokerLetter { get; set; } = string.Empty;
 
    // Has this joker been used yet?
    public bool IsUsed { get; set; } = false;
 
    // When was the joker activated?
    public DateTime ActivatedAt { get; set; } = DateTime.UtcNow;
}