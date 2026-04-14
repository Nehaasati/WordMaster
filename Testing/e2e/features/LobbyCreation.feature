// Lobby creation Gherkin

Feature: Create Lobby
  As a host player
  I want to create a new lobby
  So that I can start a multiplayer WordMaster match

  Background:
    Given the backend is running

  Scenario: Host successfully creates a lobby
    When the host creates a lobby with name "Fatima" and character "ugglan"
    Then the response should contain a lobbyId
    And the response should contain a playerId
    And the host should be marked as IsHost = true
    And the lobby should be in state "WaitingForPlayers"