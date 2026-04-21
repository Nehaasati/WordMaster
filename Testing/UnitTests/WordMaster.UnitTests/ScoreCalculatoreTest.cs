using WordMaster.Services;
using Xunit;

namespace WordMaster.Tests.Services;

public class ScoreCalculatorTests
{
    [Fact]
    public void Calculate_Gives10PointsForUniqueValidWord()
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

        var result = ScoreCalculator.Calculate(submissions);

        Assert.Equal(10, result.TotalScores["Emil"]);
        Assert.Equal(10, result.TotalScores["Luis"]);
    }

    [Fact]
    public void Calculate_Gives5PointsForDuplicateValidWord()
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

        var result = ScoreCalculator.Calculate(submissions);

        Assert.Equal(5, result.TotalScores["Emil"]); 
        Assert.Equal(5, result.TotalScores["Luis"]);   
    }

    [Fact]
    public void Calculate_GivesLengthBonus_WhenWordIsLongerThan7Characters()
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

        var result = ScoreCalculator.Calculate(submissions);

        Assert.Equal(15, result.TotalScores["Emil"]);   // 10 unikt + 5 bonus
        Assert.Equal(10, result.TotalScores["Luis"]);
    }

    [Fact]
    public void Calculate_DoesNotGiveLengthBonus_WhenWordHasExactly7Characters()
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

        var result = ScoreCalculator.Calculate(submissions);

        Assert.Equal(10, result.TotalScores["Emil"]);
        Assert.Equal(10, result.TotalScores["Luis"]);
    }


    [Fact]
    public void Calculate_Gives50Bonus_ToPlayerWhoPressedStopp()
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

        var result = ScoreCalculator.Calculate(submissions, stopperPlayerId: "Emil");

        Assert.Equal(120, result.TotalScores["Emil"]); // 7 unika ord 70 p + 50 p bonus poäng = 120 p
        Assert.Equal(10, result.TotalScores["Luis"]);   //1 unikt ord 10 p


        var result2 = ScoreCalculator.Calculate(submissions, stopperPlayerId: "Luis");

        Assert.Equal(70, result2.TotalScores["Emil"]); // 7 unika ord 70 p
        Assert.Equal(60, result2.TotalScores["Luis"]);   // 1 unikt ord 10 p + 50 p bonus poäng = 60 p
    }
}