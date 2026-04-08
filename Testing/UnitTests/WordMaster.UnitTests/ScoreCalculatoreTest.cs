using WordMaster.Services;
using Xunit;

namespace WordMaster.Tests.Services;

public class ScoreCalculatorTests
{
    [Fact]
    public void CalculateScores_Gives10PointsForUniqueValidWord()
    {
        var submissions = new Dictionary<string, Dictionary<string, ScoreCalculator.CategorySubmission>>
        {
            ["Emil"] = new()
            {
                ["Animal"] = new("Katt", true)
            },
            ["Luis"] = new()
            {
                ["Animal"] = new("Hund", true)
            }
        };

        var result = ScoreCalculator.CalculateScores(submissions);

        Assert.Equal(10, result["Emil"]);
        Assert.Equal(10, result["Luis"]);
    }

    [Fact]
    public void CalculateScores_Gives5PointsForDuplicateValidWord()
    {
        var submissions = new Dictionary<string, Dictionary<string, ScoreCalculator.CategorySubmission>>
        {
            ["Emil"] = new()
            {
                ["Land"] = new("Sverige", true)
            },
            ["Luis"] = new()
            {
                ["Land"] = new("Sverige", true)
            }
        };

        var result = ScoreCalculator.CalculateScores(submissions);

        Assert.Equal(5, result["Emil"]); 
        Assert.Equal(5, result["Luis"]);   
    }

    [Fact]
    public void CalculateScores_GivesLengthBonus_WhenWordIsLongerThan7Characters()
    {
        var submissions = new Dictionary<string, Dictionary<string, ScoreCalculator.CategorySubmission>>
        {
            ["Emil"] = new()
            {
                ["Food"] = new("Cheesecake", true) 
            },
            ["Luis"] = new()
            {
                ["Food"] = new("Lax", true)
            }
        };

        var result = ScoreCalculator.CalculateScores(submissions);

        Assert.Equal(15, result["Emil"]);   // 10 unikt + 5 bonus
        Assert.Equal(10, result["Luis"]);
    }

    [Fact]
    public void CalculateScores_DoesNotGiveLengthBonus_WhenWordHasExactly7Characters()
    {
        var submissions = new Dictionary<string, Dictionary<string, ScoreCalculator.CategorySubmission>>
        {
            ["Emil"] = new()
            {
                ["Land"] = new("Bolivia", true)     // 7 
            },
            ["Luis"] = new()
            {
                ["Land"] = new("Sudan", true)
            }
        };

        var result = ScoreCalculator.CalculateScores(submissions);

        Assert.Equal(10, result["Emil"]);
        Assert.Equal(10, result["Luis"]);
    }


    [Fact]
    public void CalculateScores_Gives50Bonus_WhenExactlyOnePlayerCompletedAllCategories()
    {
        var submissions = new Dictionary<string, Dictionary<string, ScoreCalculator.CategorySubmission>>
        {
            ["Emil"] = new()
            {
                ["Name"] = new("Kalle", true),
                ["Food"] = new("Ris", true),
                ["Land"] = new("Sverige", true),
                ["Animal"] = new("Hund", true),
                ["Colour"] = new("Blå", true),
                ["Job"] = new("Polis", true),
                ["Thing"] = new("Stol", true)
            },
            ["Luis"] = new()
            {
                ["Animal"] = new("Katt", true)
            }
        };

        var result = ScoreCalculator.CalculateScores(submissions);

        Assert.Equal(120, result["Emil"]); 
        Assert.Equal(10, result["Luis"]);   // bara djur ger poäng
    }
}