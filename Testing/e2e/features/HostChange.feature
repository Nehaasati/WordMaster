# If the one who left the lobby is the host => change the guest to be the host because he is alone inside the lobby ==> so this player can invite someone else or play with the AI-bot

Feature: Host Change
  As a guest
  I want to become the host if the original host leaves
  So that the lobby can continue

  Background:
    Given the backend is running
    And a lobby exists with host "Fatima" and guest "Oskar"

  Scenario: Host leaves the lobby
    When the host leaves the lobby
    Then the guest should become the new host
    And the lobby should allow adding a bot or inviting a new player