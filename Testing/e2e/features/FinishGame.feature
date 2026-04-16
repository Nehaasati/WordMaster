# When one of the player is done with all categories

Feature: Finish Game
  As a player
  I want the game to end when someone completes all categories
  So that the match can be resolved

  Background:
    Given the backend is running
    And a game is currently running with 2 players

  Scenario: A player finishes all categories
    When player "Fatima" submits CategoriesCompleted = true
    Then the match should end
    And MatchEnded should be true
    And all players should have IsReady = false
    And the lobby state should be "WaitingForReady"