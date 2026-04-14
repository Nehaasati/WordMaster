# Restart the game on the same lobby

Feature: Restart Game
  As the host
  I want to restart the lobby after a match ends
  So that we can play again

  Background:
    Given the backend is running
    And a match has ended in the lobby

  Scenario: Host restarts the lobby
    When the host restarts the lobby
    Then the lobby should reset for a new round
    And all players should have IsReady = false
    And the lobby state should be "WaitingForReady"