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
    private const string ShopItemTypeLetter = "letter";
    private const string ShopItemTypePowerup = "powerup";
    private readonly object _letterGenerationLock = new();
    private readonly Queue<char> _demoLetterQueue = new(new[]
    {
        'E', 'M', 'I', 'L', 'S', 'K', 'A', 'L', 'B', 'A',
        'G', 'G', 'E', 'V', 'A', 'K', 'T', 'Z', 'I', 'M',
        'B', 'A', 'B', 'W', 'E',
        'G', 'U', 'L', 'H', 'U', 'N', 'D', 'B', 'O', 'R', 'D'
    });

    private static readonly IReadOnlyDictionary<string, ShopCatalogItem> ShopItems = CreateShopCatalog();

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
    public bool StartClassicGame(string lobbyId)
    {
        // Classic mode start (teammate’s logic)
        var lobby = GetLobby(lobbyId);
        if (lobby == null) return false;

        // Classic mode does NOT require host or playerId
        // It simply starts the game for solo mode
        lobby.State = GameState.PlayingRound;
        lobby.GameStartTime = DateTime.UtcNow;
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
    public void SaveSubmittedWord(string lobbyId, string playerId, string category, string word)
    {
        var lobby = GetLobby(lobbyId);
        if (lobby == null) return;

        if (!lobby.SubmittedWords.ContainsKey(playerId))
            lobby.SubmittedWords[playerId] = new Dictionary<string, string>();

        if (!lobby.WordTimestamps.ContainsKey(playerId))
            lobby.WordTimestamps[playerId] = new Dictionary<string, DateTime>();

        lobby.SubmittedWords[playerId][category] = word;
        lobby.WordTimestamps[playerId][category] = DateTime.UtcNow;
    }

    public List<char> GenerateLetters(int count = 25)
    {
        lock (_letterGenerationLock)
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
                letters.Add(_demoLetterQueue.Count > 0
                    ? _demoLetterQueue.Dequeue()
                    : weightedPool[random.Next(weightedPool.Count)]);
            }

            return letters;
        }
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
        lobby.GameStartTime = DateTime.UtcNow;
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

        // Mark the player as finished.
        player.HasFinished = true;

        // End the match immediately on the first player who actually finishes.
        lobby.MatchEnded = true;
        lobby.State = GameState.WaitingForReady;

        return true;
    }

    // A method to allow players to start a new round on the same lobby
    public bool ResetLobbyForNewRound(string lobbyId)
    {
        var lobby = GetLobby(lobbyId);
        if (lobby == null) return false;

        // Reset game state
        lobby.State = GameState.WaitingForReady;
        lobby.GameStarted = false;
        lobby.MatchEnded = false;
        lobby.GameStartTime = null;

        // Generate new letters
        lobby.Letters = GenerateLetters();

        // Reset players
        foreach (var p in lobby.Players)
        {
            p.IsReady = false;
            p.HasFinished = false;
            p.CategoriesCompleted = false;
            p.HasSubmitted = false;
            ResetPlayerShopState(p);
        }

        lobby.SubmittedWords.Clear();
        lobby.WordTimestamps.Clear();

        return true;
    }

    // A method to allow players go out of the lobby and allow a new join
    public bool RemovePlayer(string lobbyId, string playerId, out bool hostChanged)
    {
        hostChanged = false;

        var lobby = GetLobby(lobbyId);
        if (lobby == null) return false;

        var player = lobby.Players.FirstOrDefault(p => p.Id == playerId);
        if (player == null) return false;

        bool wasHost = player.IsHost;

        lobby.Players.Remove(player);

        // If the lobby is empty => remove it
        if (lobby.Players.Count == 0)
        {
            _lobbies.Remove(lobbyId);
            return true;
        }

        // If the removed player is the host => reset the other player as a host
        if (wasHost)
        {
            var newHost = lobby.Players.First();
            newHost.IsHost = true;
            hostChanged = true;
        }

        // Reset players state
        if (lobby.Players.Count == 1)
        {
            lobby.State = GameState.WaitingForPlayers;
            lobby.MatchEnded = false;
            lobby.GameStarted = false;

            var remaining = lobby.Players.First();
            remaining.IsReady = false;
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

    public ShopOperationResult GetShopState(string lobbyId, string playerId)
    {
        var player = FindPlayer(lobbyId, playerId, out var error);
        return player == null
            ? error
            : ShopOperationResult.Ok("Shop state loaded", CreateShopState(player));
    }

    public ShopOperationResult SyncShopScore(string lobbyId, string playerId, int earnedScore)
    {
        if (earnedScore < 0)
        {
            return ShopOperationResult.Fail(
                ShopOperationStatus.InvalidScore,
                "Earned score cannot be negative.");
        }

        var player = FindPlayer(lobbyId, playerId, out var error);
        if (player == null)
            return error;

        player.EarnedScore = earnedScore;
        UpdatePlayerScore(player);

        return ShopOperationResult.Ok("Score synced", CreateShopState(player));
    }

    public ShopOperationResult PurchaseShopItem(string lobbyId, string playerId, string itemId)
    {
        var player = FindPlayer(lobbyId, playerId, out var error);
        if (player == null)
            return error;

        if (string.IsNullOrWhiteSpace(itemId) ||
            !ShopItems.TryGetValue(itemId.Trim(), out var item))
        {
            return ShopOperationResult.Fail(
                ShopOperationStatus.InvalidItem,
                $"Shop item '{itemId}' does not exist.");
        }

        var balance = GetShopBalance(player);
        if (balance < item.Cost)
        {
            return ShopOperationResult.Fail(
                ShopOperationStatus.NotEnoughScore,
                $"Not enough score to buy '{item.Label}'.");
        }

        if (item.Type == ShopItemTypePowerup &&
            player.Powerups.GetValueOrDefault(item.Id) > 0)
        {
            return ShopOperationResult.Fail(
                ShopOperationStatus.AlreadyOwned,
                $"Power-up '{item.Label}' is already owned.");
        }

        player.SpentScore += item.Cost;

        char? purchasedLetter = null;
        if (item.Type == ShopItemTypeLetter)
        {
            purchasedLetter = item.Id[0];
            player.PurchasedLetters.Add(purchasedLetter.Value);
        }
        else
        {
            player.Powerups[item.Id] = player.Powerups.GetValueOrDefault(item.Id) + 1;
        }

        UpdatePlayerScore(player);

        return ShopOperationResult.Ok(
            $"Purchased '{item.Label}'.",
            CreateShopState(player),
            item,
            purchasedLetter);
    }

    public ShopOperationResult ConsumePowerup(string lobbyId, string playerId, string powerupId)
    {
        var player = FindPlayer(lobbyId, playerId, out var error);
        if (player == null)
            return error;

        if (string.IsNullOrWhiteSpace(powerupId) ||
            !ShopItems.TryGetValue(powerupId.Trim(), out var item) ||
            item.Type != ShopItemTypePowerup)
        {
            return ShopOperationResult.Fail(
                ShopOperationStatus.InvalidItem,
                $"Power-up '{powerupId}' does not exist.");
        }

        var ownedCount = player.Powerups.GetValueOrDefault(item.Id);
        if (ownedCount <= 0)
        {
            return ShopOperationResult.Fail(
                ShopOperationStatus.NotOwned,
                $"Power-up '{item.Label}' has not been purchased.");
        }

        if (ownedCount == 1)
            player.Powerups.Remove(item.Id);
        else
            player.Powerups[item.Id] = ownedCount - 1;

        return ShopOperationResult.Ok(
            $"Consumed '{item.Label}'.",
            CreateShopState(player),
            item);
    }

    private static IReadOnlyDictionary<string, ShopCatalogItem> CreateShopCatalog()
    {
        var items = new Dictionary<string, ShopCatalogItem>(StringComparer.OrdinalIgnoreCase);
        foreach (var letter in new[] { 'A', 'E', 'I', 'O', 'U', 'Y', 'Å', 'Ä', 'Ö' })
        {
            var id = letter.ToString();
            items[id] = new ShopCatalogItem(id, id, ShopItemTypeLetter, 5);
        }

        items["freeze"] = new ShopCatalogItem("freeze", "Freeze", ShopItemTypePowerup, 5);
        items["black"] = new ShopCatalogItem("black", "Bläck", ShopItemTypePowerup, 5);
        items["mix"] = new ShopCatalogItem("mix", "Svenska Alphabet", ShopItemTypePowerup, 100);

        return items;
    }

    private Player? FindPlayer(string lobbyId, string playerId, out ShopOperationResult error)
    {
        error = ShopOperationResult.Fail(ShopOperationStatus.PlayerNotFound, "Player not found.");

        var lobby = GetLobby(lobbyId);
        if (lobby == null)
        {
            error = ShopOperationResult.Fail(ShopOperationStatus.LobbyNotFound, "Lobby not found.");
            return null;
        }

        var player = lobby.Players.FirstOrDefault(p => p.Id == playerId);
        return player;
    }

    private static ShopStateResponse CreateShopState(Player player) =>
        new(
            Balance: GetShopBalance(player),
            EarnedScore: player.EarnedScore,
            SpentScore: player.SpentScore,
            PurchasedLetters: player.PurchasedLetters.ToList(),
            Powerups: new Dictionary<string, int>(player.Powerups, StringComparer.OrdinalIgnoreCase),
            Catalog: ShopItems.Values.ToList());

    private static int GetShopBalance(Player player) =>
        Math.Max(0, player.EarnedScore - player.SpentScore);

    private static void UpdatePlayerScore(Player player)
    {
        player.Score = GetShopBalance(player);
    }

    private static void ResetPlayerShopState(Player player)
    {
        player.EarnedScore = 0;
        player.SpentScore = 0;
        player.Score = 0;
        player.PurchasedLetters.Clear();
        player.Powerups.Clear();
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

    public Dictionary<string, Dictionary<string, string>> SubmittedWords { get; set; } = new();
    public Dictionary<string, Dictionary<string, DateTime>> WordTimestamps { get; set; } = new();
    public DateTime? GameStartTime { get; set; }
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

    // Score earned from valid words before shop purchases are deducted.
    public int EarnedScore { get; set; }

    // Total score spent in the shop during the current round.
    public int SpentScore { get; set; }

    public List<char> PurchasedLetters { get; set; } = new();

    public Dictionary<string, int> Powerups { get; set; } = new(StringComparer.OrdinalIgnoreCase);

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

public record ShopCatalogItem(string Id, string Label, string Type, int Cost);

public record ShopStateResponse(
    int Balance,
    int EarnedScore,
    int SpentScore,
    IReadOnlyList<char> PurchasedLetters,
    IReadOnlyDictionary<string, int> Powerups,
    IReadOnlyList<ShopCatalogItem> Catalog);

public enum ShopOperationStatus
{
    Success,
    LobbyNotFound,
    PlayerNotFound,
    InvalidItem,
    InvalidScore,
    NotEnoughScore,
    AlreadyOwned,
    NotOwned
}

public record ShopOperationResult(
    ShopOperationStatus Status,
    string Message,
    ShopStateResponse? State = null,
    ShopCatalogItem? Item = null,
    char? PurchasedLetter = null)
{
    public bool Succeeded => Status == ShopOperationStatus.Success;

    public static ShopOperationResult Ok(
        string message,
        ShopStateResponse state,
        ShopCatalogItem? item = null,
        char? purchasedLetter = null) =>
        new(ShopOperationStatus.Success, message, state, item, purchasedLetter);

    public static ShopOperationResult Fail(ShopOperationStatus status, string message) =>
        new(status, message);
}
