# Landing Page UI Test

Feature: Landing Page
  Som spelare
  Vill jag kunna välja att skapa eller gå med i en lobby
  Så att jag kan starta eller delta i ett WordMaster-spel

  Scenario: Öppna landningssidan och visa huvudknapparna
    Given att jag öppnar landningssidan
    Then ska jag se knappen "SKAPA EN LOBBY"
    And ska jag se knappen "GÅ MED I EN LOBBY"

  Scenario: Öppna skapa-lobby fönstret
    Given att jag öppnar landningssidan
    When jag klickar på skapa-lobby knappen
    Then ska skapa-lobby modalen visas

  Scenario: Öppna gå-med-i-lobby fönstret
    Given att jag öppnar landningssidan
    When jag klickar på gå-med-i-lobby knappen
    Then ska join-lobby modalen visas