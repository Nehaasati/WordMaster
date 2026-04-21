namespace WordMaster.Services;

public static class ScoreCalculator
{
    public sealed record CategorySubmission(string Word, bool IsValid);
    public sealed record PlayerContext(string CharacterId, Dictionary<string, double> SecondsTakenPerCategory);

    public sealed record ScoreResult(
        Dictionary<string, int> TotalScores,
        Dictionary<string, Dictionary<string, int>> CategoryPoints
    );

    public static ScoreResult Calculate(
        IDictionary<string, Dictionary<string, CategorySubmission>> submissions,
        string? stopperPlayerId = null,
        IDictionary<string, PlayerContext>? playerContexts = null,
        CharacterService? characterService = null,
        IDictionary<string, Dictionary<string, int>>? categoryMultipliers = null)
    {
        var totalScores = new Dictionary<string, int>();
        var categoryPoints = new Dictionary<string, Dictionary<string, int>>();

        foreach (var player in submissions.Keys)
        {
            totalScores[player] = 0;
            categoryPoints[player] = new Dictionary<string, int>();
        }

        var categories = submissions.Values
            .SelectMany(p => p.Keys)
            .Distinct()
            .ToList();

        foreach (var category in categories)
        {
            var validAnswers = new List<(string PlayerId, string Word)>();
            foreach (var player in submissions)
            {
                if (player.Value.TryGetValue(category, out var sub) &&
                    sub.IsValid &&
                    !string.IsNullOrWhiteSpace(sub.Word))
                {
                    validAnswers.Add((player.Key, NormalizeWord(sub.Word)));
                }
            }

            foreach (var (pid, word) in validAnswers)
            {
                int sameCount = validAnswers.Count(a => a.Word == word);
                int wordPoints = sameCount > 1 ? 5 : 10;

                if (word.Length > 7)
                    wordPoints += 5;

                if (characterService != null && playerContexts != null &&
                    playerContexts.TryGetValue(pid, out var ctx))
                {
                    double secondsTaken = ctx.SecondsTakenPerCategory.TryGetValue(category, out var s) ? s : 0;
                    wordPoints += characterService.CalculateAbilityBonus(ctx.CharacterId, word, secondsTaken);
                }

                int multiplier = 1;
                if (categoryMultipliers != null &&
                    categoryMultipliers.TryGetValue(pid, out var playerMultipliers) &&
                    playerMultipliers.TryGetValue(category, out var configuredMultiplier))
                {
                    multiplier = Math.Max(1, configuredMultiplier);
                }

                int categoryPts = wordPoints * multiplier;
                categoryPoints[pid][category] = categoryPts;
                totalScores[pid] += categoryPts;
            }
        }

        if (stopperPlayerId != null && totalScores.ContainsKey(stopperPlayerId))
            totalScores[stopperPlayerId] += 50;

        return new ScoreResult(totalScores, categoryPoints);
    }

    private static string NormalizeWord(string word) => word.Trim().ToUpperInvariant();
}
