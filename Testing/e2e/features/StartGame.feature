// Only the host can start the game

Feature: Start Game
  As the host
  I want to start the game when both players are ready
  So that the match can begin

  Background:
    Given the backend is running
    And a lobby exists with 2 ready players

  Scenario: Host starts the game
    When the host starts the game
    Then the game should start successfully
    And the lobby state should be "PlayingRound"
    And GameStarted should be true