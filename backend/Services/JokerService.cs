using WordMaster.Models;
 
namespace WordMaster.Services;
 
/// <summary>
/// Manages Joker Cards for all active lobbies.
/// Each player can hold one active joker at a time.
/// </summary>
public class JokerService
{
    // Key: "{lobbyId}:{playerId}"  Value: JokerCard
    private readonly Dictionary<string, JokerCard> _activeJokers = new();
 
    private static readonly string[] SwedishLetters =
    {
        "A","B","D","E","F","G","H","I","K","L",
        "M","N","O","R","S","T","U","Å","Ä","Ö"
    };
 
    // ── Activate ─────────────────────────────────────────────
 
    /// <summary>
    /// Activates a new Joker Card for a player.
    /// Returns null if the player already has an active joker.
    /// </summary>
    public JokerCard? ActivateJoker(string lobbyId, string playerId)
    {
        var key = MakeKey(lobbyId, playerId);
 
        // Player already has an active joker
        if (_activeJokers.TryGetValue(key, out var existing) && !existing.IsUsed)
            return null;
 
        // Pick a random letter
        var rng = new Random();
        var jokerLetter = SwedishLetters[rng.Next(SwedishLetters.Length)];
 
        var joker = new JokerCard
        {
            LobbyId     = lobbyId,
            PlayerId    = playerId,
            JokerLetter = jokerLetter,
            IsUsed      = false,
            ActivatedAt = DateTime.UtcNow
        };
 
        _activeJokers[key] = joker;
        return joker;
    }
 
    // ── Query ─────────────────────────────────────────────────
 
    /// <summary>
    /// Returns the active (unused) joker for a player, or null.
    /// </summary>
    public JokerCard? GetActiveJoker(string lobbyId, string playerId)
    {
        var key = MakeKey(lobbyId, playerId);
        if (_activeJokers.TryGetValue(key, out var joker) && !joker.IsUsed)
            return joker;
        return null;
    }
 
    // ── Apply ─────────────────────────────────────────────────
 
    /// <summary>
    /// Checks if the word triggers the joker bonus.
    /// If yes — marks the joker as used and returns the multiplier (2).
    /// If no  — returns multiplier 1.
    /// </summary>
    public int ApplyJoker(string lobbyId, string playerId, string word, bool usedWildcard = false)
    {
        var joker = GetActiveJoker(lobbyId, playerId);
        if (joker == null) return 1;
 
        bool wordUsesJoker = word
            .ToUpperInvariant()
            .Contains(joker.JokerLetter.ToUpperInvariant());
 
        if (!wordUsesJoker && !usedWildcard) return 1;
 
        // Consume the joker
        joker.IsUsed = true;
        return 2; // double points
    }
 
    // ── Helper ────────────────────────────────────────────────
 
    private static string MakeKey(string lobbyId, string playerId)
        => $"{lobbyId}:{playerId}";
}