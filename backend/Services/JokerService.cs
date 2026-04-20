
app.MapPost("/api/lobby/{lobbyId}/joker/{playerId}/activate", (
    string lobbyId,
    string playerId,
    JokerActivateRequest request,
    JokerService jokerService,
    GameEngine engine) =>
    
{
    var lobby = engine.GetLobby(lobbyId);
    if (lobby == null)
        return Results.NotFound(new { error = "Lobby not found" });

    var player = lobby.Players.FirstOrDefault(p => p.Id == playerId);
    if (player == null)
        return Results.NotFound(new { error = "Player not found" });

    // FREE — no point check, no deduction
    var joker = jokerService.ActivateJoker(lobbyId, playerId);
    if (joker == null)
        return Results.BadRequest(new { error = "Du har redan en aktiv Joker." });

    Console.WriteLine($"[Joker] Player {player.Name} activated Joker: {joker.JokerLetter}");

    return Results.Ok(new
    {
        jokerLetter = joker.JokerLetter,
        cost        = 0,               // FREE
        newScore    = player.Score,    // score unchanged
        message     = $"Bokstaven {joker.JokerLetter} är nu din Joker! Ord med denna bokstav ger dubbla poäng."
    });
});


// GET /api/lobby/{lobbyId}/joker/{playerId}
// Returns current active joker for a player
app.MapGet("/api/lobby/{lobbyId}/joker/{playerId}", (
    string lobbyId,
    string playerId,
    JokerService jokerService) =>
{
    var joker = jokerService.GetActiveJoker(lobbyId, playerId);
    if (joker == null)
        return Results.Ok(new { hasJoker = false, jokerLetter = (string?)null });

    return Results.Ok(new
    {
        hasJoker    = true,
        jokerLetter = joker.JokerLetter,
        isUsed      = joker.IsUsed
    });
});


// POST /api/lobby/{lobbyId}/joker/{playerId}/apply
// Called after word is validated as correct
// Returns multiplier: 1 = no bonus, 2 = double points
app.MapPost("/api/lobby/{lobbyId}/joker/{playerId}/apply", (
    string lobbyId,
    string playerId,
    ApplyJokerRequest request,
    JokerService jokerService) =>
{
    var multiplier = jokerService.ApplyJoker(lobbyId, playerId, request.Word);
    bool triggered = multiplier > 1;

    return Results.Ok(new
    {
        multiplier     = multiplier,
        jokerTriggered = triggered,
        word           = request.Word,
        message        = triggered
            ? $"🃏 JOKER! Dubbla poäng för \"{request.Word}\"!"
            : "No joker bonus."
    });
});


