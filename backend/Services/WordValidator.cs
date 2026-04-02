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
}