namespace WordMaster.Services;

public class ClassicGameEngine
{
    private readonly WordValidator _validator;
    private readonly HashSet<string> _dictionary;
    private readonly Dictionary<string, List<string>> _categories;

    private static readonly Random _random = new Random();

    private readonly List<string> _categoryList;
    private int _currentCategoryIndex = 0;

    public static readonly string Alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZÅÄÖ";

    private static readonly Dictionary<char, int> Weights = new()
    {
        { 'A', 5 }, { 'E', 5 }, { 'I', 5 }, { 'O', 5 }, { 'U', 5 }, { 'Y', 5 },
        { 'Å', 2 }, { 'Ä', 2 }, { 'Ö', 2 },
        { 'B', 3 }, { 'C', 1 }, { 'D', 3 }, { 'F', 2 }, { 'G', 3 }, { 'H', 3 },
        { 'J', 2 }, { 'K', 4 }, { 'L', 4 }, { 'M', 4 }, { 'N', 4 }, { 'P', 3 },
        { 'R', 5 }, { 'S', 5 }, { 'T', 5 }, { 'V', 3 }, { 'W', 1 }, { 'X', 1 }, { 'Z', 1 }
    };

    public HashSet<string> UsedWords { get; } = new(StringComparer.OrdinalIgnoreCase);

    public string CurrentCategory => _categoryList[_currentCategoryIndex];
    public char RequiredLetter { get; private set; }

    public ClassicGameEngine(
        WordValidator validator,
        HashSet<string> dictionary,
        Dictionary<string, List<string>> categories)
    {
        _validator = validator;
        _dictionary = dictionary;
        _categories = categories;

        _categoryList = _categories.Keys.ToList();
        if (_categoryList.Count == 0)
            throw new InvalidOperationException("No categories loaded.");

        GenerateRequiredLetter();
    }

    public void AdvanceToNextCategory()
    {
        _currentCategoryIndex++;

        if (_currentCategoryIndex >= _categoryList.Count)
            _currentCategoryIndex = 0;

        GenerateRequiredLetter();
    }

    private void GenerateRequiredLetter()
    {
        // Pick a random word from the current category so the required letter
        // is always guaranteed to have at least one valid word.
        var words = GetPlayableWords(CurrentCategory);
        if (words.Count == 0)
            throw new InvalidOperationException($"No playable words found for category '{CurrentCategory}'.");

        var randomWord = words[_random.Next(words.Count)];
        RequiredLetter = char.ToUpperInvariant(randomWord[0]);
    }

    public List<string> GetPlayableWords(string category)
    {
        if (!_categories.TryGetValue(category, out var words))
            return new List<string>();

        return words
            .Where(IsPlayableWord)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    private bool IsPlayableWord(string word)
    {
        if (string.IsNullOrWhiteSpace(word))
            return false;

        return _validator.IsValidLength(word)
            && _validator.IsValidCharacters(word)
            && _validator.IsInDictionary(word, _dictionary);
    }

    public (bool IsValid, string Message) SubmitWord(string word)
    {
        if (string.IsNullOrWhiteSpace(word))
            return (false, "Invalid request");

        word = word.Trim().ToUpperInvariant();

        if (!_validator.IsValidLength(word))
            return (false, "Too short");

        if (!_validator.IsValidCharacters(word))
            return (false, "Word contains invalid characters");

        if (!_validator.StartsWithCorrectLetter(word, RequiredLetter))
            return (false, "Word does not start with required letter");

        if (!_validator.IsNotUsedBefore(word, UsedWords))
            return (false, "Word already used");

        if (!_validator.IsInDictionary(word, _dictionary))
            return (false, "Word not found in dictionary");

        if (!_validator.IsInCategory(word, CurrentCategory, _categories))
            return (false, "Word not found in category");

        UsedWords.Add(word);
        AdvanceToNextCategory();

        return (true, "Valid word");
    }
}
