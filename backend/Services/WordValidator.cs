namespace WordMaster.Services;

public class WordValidator
{
  public bool IsValidLength(string word)
  {
    if (string.IsNullOrWhiteSpace(word))
      return false;

    return word.Length >= 2;
  }
}