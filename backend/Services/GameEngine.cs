using WordMaster.Services;


namespace WordMaster.Services;

public class GameEngine
{
    private readonly WordValidator _validator;
    private readonly HashSet<string> _dictionary;
    private readonly Dictionary<string, List<string>> _categories;
    private readonly Dictionary<string, Lobby> _lobbies = new(StringComparer.OrdinalIgnoreCase);
    private readonly Dictionary<string, string> _inviteCodesToId = new(StringComparer.OrdinalIgnoreCase);
    private static readonly string Alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZÅÄÖ";

    // Weighted randomizer weights (trying to mirror frontend randomizeer here)
    private static readonly Dictionary<char, int> Weights = new()
    {
        { 'A', 5 }, { 'E', 5 }, { 'I', 5 }, { 'O', 5 }, { 'U', 5 }, { 'Y', 5 }, { 'Å', 2 }, { 'Ä', 2 }, { 'Ö', 2 },
        { 'B', 3 }, { 'C', 1 }, { 'D', 3 }, { 'F', 2 }, { 'G', 3 }, { 'H', 3 }, { 'J', 2 }, { 'K', 4 }, { 'L', 4 },
        { 'M', 4 }, { 'N', 4 }, { 'P', 3 }, { 'R', 5 }, { 'S', 5 }, { 'T', 5 }, { 'V', 3 }, { 'W', 1 }, { 'X', 1 }, { 'Z', 1 }
    };

    public GameEngine(WordValidator validator, HashSet<string> dictionary, Dictionary<string, List<string>> categories)
    {
        _validator = validator;
        _dictionary = dictionary;
        _categories = categories;
    }

    public Lobby CreateLobby()
    {
        var lobbyId = Guid.NewGuid().ToString("N")[..6].ToUpper();
        var inviteCode = Guid.NewGuid().ToString("N")[..12]; // 12-char longer string
        
        var lobby = new Lobby { 
            Id = lobbyId, 
            InviteCode = inviteCode, 
            Letters = GenerateLetters() 
        };
        
        _lobbies[lobbyId] = lobby;
        _inviteCodesToId[inviteCode] = lobbyId;
        
        return lobby;
    }

    public Lobby? GetLobby(string idOrCode)
    {
        if (string.IsNullOrEmpty(idOrCode)) return null;

        // Check by short ID
        if (_lobbies.TryGetValue(idOrCode, out var lobby))
            return lobby;

        // Check by long invite code
        if (_inviteCodesToId.TryGetValue(idOrCode, out var lobbyId))
        {
            if (_lobbies.TryGetValue(lobbyId, out var inviteLobby))
                return inviteLobby;
        }

        return null;
    }

    // Check if the game can be started (e.g., all players are ready and there are enough players)
    public bool CanStartGame(string lobbyId)
    {
        var lobby = GetLobby(lobbyId);
        if (lobby == null) return false;

        if (lobby.Players.Count != 2)
            return false;

        return lobby.Players.All(p => p.IsReady);
    }

    // Start the game by setting the lobby state to PlayingRound, initializing round number, and resetting player states as needed.
    public bool StartGame(string lobbyId)
    {
        var lobby = GetLobby(lobbyId);
        if (lobby == null) return false;

        if (!CanStartGame(lobbyId))
            return false;

        lobby.State = GameState.PlayingRound;
        lobby.CurrentRound = 1;
        lobby.RoundStartTime = DateTime.UtcNow;

        foreach (var player in lobby.Players)
        {
            player.HasSubmitted = false;
            player.Score = 0;
        }

        return true;
    }

    // End the current round by setting the lobby state to RoundFinished.
    public void EndRound(string lobbyId)
    {
        var lobby = GetLobby(lobbyId);
        if (lobby == null) return;

        lobby.State = GameState.RoundFinished;
    }

    // Start the next round by incrementing the round number, generating new letters, resetting player states, and setting the lobby state to PlayingRound again. If the max number of rounds has been reached, transition to GameFinished state instead.
    public void StartNextRound(string lobbyId)
    {
        var lobby = GetLobby(lobbyId);
        if (lobby == null) return;

        if (lobby.CurrentRound >= lobby.MaxRounds)
        {
            lobby.State = GameState.GameFinished;
            return;
        }

        lobby.CurrentRound++;

        lobby.Letters = GenerateLetters();

        lobby.RoundStartTime = DateTime.UtcNow;

        foreach (var player in lobby.Players)
        {
            player.HasSubmitted = false;
        }

        lobby.State = GameState.PlayingRound;
    }

    // Check if the round time is over by comparing the current time with the round start time and the round duration. This can be called by the client to check if they should show a "Round Over" message or trigger the end of the round in case the timer runs out.
    public bool IsRoundTimeOver(string lobbyId)
    {
        var lobby = GetLobby(lobbyId);
        if (lobby == null) return false;

        return (DateTime.UtcNow - lobby.RoundStartTime)
            .TotalSeconds >= lobby.RoundDurationSeconds;
    }


    // Set a player as ready in the lobby. This can be called by the client when they click a "Ready" button.
    public void SetPlayerReady(string lobbyId, string playerId)
    {
        var lobby = GetLobby(lobbyId);
        if (lobby == null) return;

        var player = lobby.Players.FirstOrDefault(p => p.Id == playerId);

        if (player != null)
            player.IsReady = true;
    }

    public List<char> GenerateLetters(int count = 25)
    {
        var random = new Random();
        var letters = new List<char>();
        
        var weightedPool = new List<char>();
        foreach (var c in Alphabet)
        {
            int w = Weights.TryGetValue(c, out int weight) ? weight : 2;
            for (int i = 0; i < w; i++) weightedPool.Add(c);
        }

        for (int i = 0; i < count; i++)
        {
            letters.Add(weightedPool[random.Next(weightedPool.Count)]);
        }
        return letters;
    }

    public (bool IsValid, string Message) ValidateWord(string word, string category, List<char> availableLetters)
    {
        if (string.IsNullOrWhiteSpace(word))
            return (false, "Invalid request");

        if (!_validator.IsValidLength(word))
            return (false, "Too short");

        if (!_validator.IsValidCharacters(word))
            return (false, "Word contains invalid characters");

        // Check if word can be formed with available letters or nah
        if (!CanFormWord(word, availableLetters))
            return (false, "Word uses unavailable letters");

        bool inDictionary = _validator.IsInDictionary(word, _dictionary);
        bool inCategory = _validator.IsInCategory(word, category, _categories);

        if (!inDictionary || !inCategory)
            return (false, "Word not found");

        return (true, "Word found");
    }

    private bool CanFormWord(string word, List<char> availableLetters)
    {
        var tempLetters = new List<char>(availableLetters);
        foreach (var c in word.ToUpper())
        {
            if (!tempLetters.Contains(c))
                return false;
            tempLetters.Remove(c);
        }
        return true;
    }

    // Try to join a lobby by ID or invite code. Returns true if successful, false if lobby not found, full, or player already in lobby.
    public bool TryJoinLobby(string lobbyId, Player player, out string error)
    {
        error = string.Empty;

        var lobby = GetLobby(lobbyId);

        if (lobby is null)
        {
            error = "Lobby not found";
            return false;
        }

        // Prevent joining if game already started
        if (lobby.State != GameState.WaitingForPlayers &&
            lobby.State != GameState.WaitingForReady)
        {
            error = "Game already started";
            return false;
        }

        // Max 2 players
        if (lobby.Players.Count >= 2)
        {
            error = "Tyvärr är Lobbyn full och kan inte ta emot fler spelare.";
            return false;
        }

        // Player already in lobby
        if (lobby.Players.Any(p => p.Id == player.Id))
        {
            error = "Player already in lobby";
            return false;
        }

        lobby.Players.Add(player);

        // When the second player joins => move to ready phase
        if (lobby.Players.Count == 2)
        {
            lobby.State = GameState.WaitingForReady;
        }

        return true;
    }

    // Method to handle player submitting their word for the round. This checks if the submission is valid and if both players have submitted, it ends the round.
    public bool SubmitRound(string lobbyId, string playerId)
    {
        var lobby = GetLobby(lobbyId);
        if (lobby == null) return false;

        if (lobby.State != GameState.PlayingRound)
            return false;

        var player = lobby.Players.FirstOrDefault(p => p.Id == playerId);
        if (player == null) return false;

        if (player.HasSubmitted)
            return false;

        player.HasSubmitted = true;

        // If both players submitted → end round
        if (lobby.Players.All(p => p.HasSubmitted))
        {
            EndRound(lobbyId);
        }

        return true;
    }
}

public class Lobby
{
    public string Id { get; set; } = string.Empty;
    public string InviteCode { get; set; } = string.Empty;
    public List<char> Letters { get; set; } = new();

    // 2 players max for now, but we can easily expand this to support more players in the future if we want to make it more of a party game or add an AI player.
    // We can add more properties here as needed, like current game state, scores, etc.
    public List<Player> Players { get; set; } = new();

    // Game state can be used to track the current phase of the game 
    public GameState State { get; set; } = GameState.WaitingForPlayers;

    // Current round number, can be used to track how many rounds have been played and when to end the game based on MaxRounds
    public int CurrentRound { get; set; } = 0;

    // Max rounds can be used to determine when the game should end. Once CurrentRound reaches MaxRounds, we can transition to GameFinished state and show final scores.
    public int MaxRounds { get; set; } = 5;

    // Timestamp for when the current round started, can be used to implement round timers and show countdowns on the client side.
    public DateTime RoundStartTime { get; set; }

    // Duration of each round in seconds, can be used to determine when a round should end and transition to RoundFinished state.
    public int RoundDurationSeconds { get; set; } = 60;
}

// Player class to represent a player in the lobby. This can be expanded with more properties as needed.
public class Player
{
    // For simplicity, we're using a string ID here. In a real application, you might want to use a more robust IDENTIFIER.
    public string Id { get; set; } = Guid.NewGuid().ToString();

    // PLAYER NAME, can be set by the client when they join the lobby
    public string Name { get; set; } = string.Empty;

    // Indicates if this player is the HOST of the lobby (the one who created it)
    public bool IsHost { get; set; }

    // ConnectionId can be used to track the player's connection for REAL-TIME updates (e.g., via SignalR)
    public string? ConnectionId { get; set; }

    // Player's CURRENT score in the game, can be updated as they submit valid words
    public int Score { get; set; }

    // Indicates if the player is READY to start the game. This can be used to ensure all players are ready before starting.
    public bool IsReady { get; set; }

    // TIMESTAMP for when the player joined the lobby, can be useful for sorting players or handling timeouts
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;

    // Indicates if the player has submitted a word for the current round.
    public bool HasSubmitted { get; set; }

    // we can add more player-specific properties here later, like avatar, language preference, etc.
    // public string PreferredLanguage { get; set; } = "sv, en, etc.";
    // public string Language { get; set; } = "sv";
    // public string AvatarColor { get; set; } = "#c300ff";
}

// Enum to represent the different states of the game. 
public enum GameState
{
    WaitingForPlayers,
    WaitingForReady,
    PlayingRound,
    RoundFinished,
    GameFinished
}