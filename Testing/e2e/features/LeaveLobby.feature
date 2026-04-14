#One of the player has left the current lobby

Feature: Leave Lobby
  As a player
  I want to leave the lobby
  So that I can exit the game

  Background:
    Given the backend is running
    And a lobby exists with host "Fatima" and guest "Oskar"

  Scenario: Guest leaves the lobby
    When the guest leaves the lobby
    Then the guest should be removed
    And the host should remain
    And the lobby should allow adding a bot or inviting a new player