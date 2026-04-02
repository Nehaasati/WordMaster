namespace WordMaster.Services;

using System.Collections.Generic;

public static class WordDictionaryLoader
{
  public static HashSet<string> LoadFromFiles(params string[] filePaths)
  {
    var words = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

    foreach (var path in filePaths)
    {
      if (!File.Exists(path))
        continue;

      foreach (var line in File.ReadLines(path))
      {
        var cleaned = CleanWord(line);

        if (!string.IsNullOrWhiteSpace(cleaned))
          words.Add(cleaned);
      }
    }

    return words;
  }

  private static string CleanWord(string word)
  {
    if (string.IsNullOrWhiteSpace(word))
      return string.Empty;

    return word.Trim().ToLower();
  }
}