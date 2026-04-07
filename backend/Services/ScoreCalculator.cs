namespace WordMaster.Services;

public static class ScoreCalculator
{
    public sealed record CategorySubmission(string Word, bool IsValid);

    public static Dictionary<string, int> CalculateScores (IDictionary<string, Dictionary<string, CategorySubmission>> submissions)
    {
        var scores = new Dictionary<string, int>();

        foreach (var player in submissions.Keys)
        {
            scores[player] = 0;
        }

                                                        // en Dictionary har en KEY och en Value
        var categories = submissions.Values
        .SelectMany(playerCategories => playerCategories.Keys)  // hämta keys för varje element och ge en lista/platta ut
        .Distinct()                                             // ta bort dubletter
        .ToList();                                              // ge en lista

        foreach (var category in categories)
        {
            var validAnswers = new List<(string Player, string Word)>();
            foreach (var player in submissions)
            {
                if (player.Value.TryGetValue(category, out var submission))
                {
                    if (submission.IsValid && !string.IsNullOrWhiteSpace(submission.Word))
                    {
                        var normalizedWord = NormalizeWord(submission.Word);
                        validAnswers.Add((player.Key, normalizedWord));
                    }
                }
            }
            foreach (var answer in validAnswers)
            {
                int sameWordCount = validAnswers.Count(a => a.Word == answer.Word);
                if (sameWordCount > 1)
                {
                    scores[answer.Player] += 5;
                }
                else
                {
                    scores[answer.Player] += 10;
                }
                if (answer.Word.Length > 7)
                {
                    scores[answer.Player] += 5;
                }
                
            }
        }

        var completedPlayers = new List<string>();

        foreach (var player in submissions)
        {
            bool hasCompletedAll = true;

            foreach (var category in categories)
            {
                if (!player.Value.TryGetValue(category, out var submission) ||
                    !submission.IsValid ||
                    string.IsNullOrWhiteSpace(submission.Word))
                {
                    hasCompletedAll = false;
                    break;
                }
            }

            if (hasCompletedAll)
            {
                completedPlayers.Add(player.Key);
            }
        }

        if (completedPlayers.Count == 1)
        {
            scores[completedPlayers[0]] += 50;
        }

        return scores;
    }
    private static string NormalizeWord(string word)
    {
        return word.Trim().ToUpperInvariant();
    }
}