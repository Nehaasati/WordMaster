using System.Text.RegularExpressions;
namespace WordMaster.Services;

public class WordValidator
{
  // This class is responsible for validating words based on various criteria such as length, characters, dictionary presence, category membership, starting letter, and previous usage.
  public record ValidationResult(bool IsValid, string Message);

  // validates that the word is at least 2 characters long 
  public bool IsValidLength(string word)
  {
    if (string.IsNullOrWhiteSpace(word))
    {
      return false;
    }

    return word.Length >= 2;
  }
  // validates that the word does not contain numbers or symbols or whitespace or anything other than (a-z, å, ä, ö)
  public bool IsValidCharacters(string word)
  {
    if (string.IsNullOrWhiteSpace(word))
      return false;

    return Regex.IsMatch(word, "^[a-zA-ZåäöÅÄÖ]+$");
  }
  // validates that the word exists in the dictionary
  public bool IsInDictionary(string word, HashSet<string> dictionary)
  {
    if (string.IsNullOrWhiteSpace(word))
    {
      return false;
    }

    return dictionary.Contains(word.ToLower());
  }
  // validates that the word exists in the specified category
  public bool IsInCategory(string word, string category, Dictionary<string, List<string>> categories)
  {
    if (string.IsNullOrWhiteSpace(word) || string.IsNullOrWhiteSpace(category))
      return false;

    if (!categories.ContainsKey(category))
      return false;

    return categories[category]
        .Any(w => w.Equals(word, StringComparison.OrdinalIgnoreCase));
  }

  // validates that the word starts with the required letter
  public bool StartsWithCorrectLetter(string word, char requiredLetter)
  {
    if (string.IsNullOrWhiteSpace(word))
      return false;

    return word.StartsWith(requiredLetter.ToString(), StringComparison.OrdinalIgnoreCase);
  }
  // validates that the word has not been used before in the game
  public bool IsNotUsedBefore(string word, HashSet<string> usedWords)
  {
    if (string.IsNullOrWhiteSpace(word))
      return false;

    return !usedWords.Contains(word.ToLower());
  }

  // validates the word against all criteria and returns a ValidationResult indicating whether the word is valid and an accompanying message
  public ValidationResult ValidateWord(
    string word,
    string category,
    char requiredLetter,
    HashSet<string> dictionary,
    Dictionary<string, List<string>> categories,
    HashSet<string> usedWords)
  {
    if (!IsValidLength(word))
      return new ValidationResult(false, "Word is too short.");

    if (!IsValidCharacters(word))
      return new ValidationResult(false, "Word contains invalid characters.");

    if (!IsInDictionary(word, dictionary))
      return new ValidationResult(false, "Word does not exist in dictionary.");

    if (!IsInCategory(word, category, categories))
      return new ValidationResult(false, "Word does not belong to the selected category.");

    if (!StartsWithCorrectLetter(word, requiredLetter))
      return new ValidationResult(false, "Word does not start with the required letter.");

    if (!IsNotUsedBefore(word, usedWords))
      return new ValidationResult(false, "Word has already been used.");

    return new ValidationResult(true, "Valid word.");
  }
}