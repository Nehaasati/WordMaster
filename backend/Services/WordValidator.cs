using System.Text.RegularExpressions;
namespace WordMaster.Services;

public class WordValidator
{
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
}