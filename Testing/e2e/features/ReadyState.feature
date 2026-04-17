Feature: Player Ready State
  As two players
  I want to mark myself as ready
  So that the game can start

  Background:
    Given the backend is running
    And a lobby exists with host "Fatima" and guest "Oskar"

  Scenario: Both players become ready
    When the host sends ready
    And the guest sends ready
    Then both players should have IsReady = true
    And the lobby should be in state "WaitingForReady"