Feature: Join Lobby
  As a guest player
  I want to join an existing lobby
  So that I can play with the host

  Background:
    Given the backend is running
    And a lobby exists created by "Fatima" with character "ugglan"

  Scenario: Guest joins successfully
    When the guest joins the lobby with name "Oskar" and character "leopard"
    Then the lobby should contain 2 players
    And the guest should be marked as IsHost = false
    And the lobby should be in state "WaitingForReady"