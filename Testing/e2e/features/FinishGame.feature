Feature: Finish Game

  Background:
    And a game is currently running with 2 players

  Scenario: A player finishes all categories
    When player "Fatima" submits CategoriesCompleted = true
    Then the match should end
    And MatchEnded should be true
    And all players should have IsReady = false
   Then the lobby should be in state "WaitingForReady"