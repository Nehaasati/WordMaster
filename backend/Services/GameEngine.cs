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

    public Lobby CreateLobby(Player host)
    {
        var lobbyId = Guid.NewGuid().ToString("N")[..6].ToUpper();
        var inviteCode = Guid.NewGuid().ToString("N")[..12];

        // The player who creates the lobby is automatically the host.
        host.IsHost = true;

        var lobby = new Lobby
        {
            Id = lobbyId,
            InviteCode = inviteCode,
            Letters = GenerateLetters(),
            Players = new List<Player> { host }
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

    public bool StartGame(string lobbyId, string playerId)
    {
        var lobby = GetLobby(lobbyId);
        if (lobby == null)
            return false;

        var player = lobby.Players.FirstOrDefault(p => p.Id == playerId);
        if (player == null)
            return false;

        if (!player.IsHost)
            return false;
        if (lobby.Players.Count != 2)
            return false;

        if (!lobby.Players.All(p => p.IsReady))
            return false;

        lobby.GameStarted = true;
        InitializeRounds(lobby);

        return true;
    }

    // OSKAR's new method in order to fix the conflict // fatima
    public bool StartGame(string lobbyId)
    {
        // Classic mode start (teammate’s logic)
        var lobby = GetLobby(lobbyId);
        if (lobby == null) return false;

        // Classic mode does NOT require host or playerId
        // It simply starts the game for solo mode
        lobby.State = GameState.PlayingRound;
        return true;
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

    private void InitializeRounds(Lobby lobby)
    {
        lobby.State = GameState.PlayingRound;
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

        // If player with same name already exists, reuse existing player
        var existing = lobby.Players.FirstOrDefault(p => p.Name == player.Name);
        if (existing != null)
        {
            player.Id = existing.Id;
            player.IsHost = existing.IsHost;
            player.IsReady = existing.IsReady;
            return true;
        }

        // Max 2 players
        if (lobby.Players.Count >= 2)
        {
            error = "Tyvärr är Lobbyn full och kan inte ta emot fler spelare.";
            return false;
        }

        // Add new player
        lobby.Players.Add(player);

        // When the second player joins => move to ready phase
        if (lobby.Players.Count == 2)
        {
            lobby.State = GameState.WaitingForReady;
        }

        return true;
    }

    public bool PlayerFinished(string lobbyId, string playerId)
    {
        var lobby = GetLobby(lobbyId);
        if (lobby == null)
            return false;

        var player = lobby.Players.FirstOrDefault(p => p.Id == playerId);
        if (player == null)
            return false;
        if (!player.CategoriesCompleted)
            return false;
        player.HasFinished = true;

        lobby.MatchEnded = true;

        // Reset players state
        foreach (var p in lobby.Players)
            {
                p.IsReady = false;
                p.HasFinished = false;
                p.CategoriesCompleted = false;
            }

        return true;
    }
    public Player? AddBot(string lobbyId)
    {
        var lobby = GetLobby(lobbyId);
        if (lobby == null) return null;
        if (lobby.Players.Count >= 2) return null;
        if (lobby.State != GameState.WaitingForPlayers && lobby.State != GameState.WaitingForReady)
            return null;

        var bot = new Player
        {
            Name = "Easy Bot",
            IsBot = true,
            IsReady = true,
            CharacterId = "ugglan"
        };

        lobby.Players.Add(bot);
        if (lobby.Players.Count == 2)
            lobby.State = GameState.WaitingForReady;

        return bot;
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

    // Indicates if the game has started
    public bool GameStarted { get; set; }

    // Indicates if the match has ended
    public bool MatchEnded { get; set; }
}

// Player class to represent a player in the lobby. This can be expanded with more properties as needed.
public class Player
{
    // For simplicity, we're using a string ID here. In a real application, you might want to use a more robust IDENTIFIER.
    public string Id { get; set; } = Guid.NewGuid().ToString();

    // PLAYER NAME, can be set by the client when they join the lobby
    public string Name { get; set; } = string.Empty;
    //indicate character
     public string CharacterId { get; set; } = "";

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

    public bool CategoriesCompleted { get; internal set; }

    // Indicates if the player has finished the game.
    public bool HasFinished { get; set; }
    public bool IsBot { get; set; }
}

// Enum to represent the different states of the game. 
public enum GameState
{
    WaitingForPlayers,
    WaitingForReady,
    PlayingRound,
    GameFinished
}