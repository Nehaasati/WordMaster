# Skapa Lobby UI-test

Feature: Skapa en lobby
  Som värdspelare
  Vill jag skapa en ny lobby
  Så att jag kan starta ett WordMaster-spel

  Scenario: Värden skapar en lobby framgångsrikt
    Given att jag öppnar landningssidan
    When jag klickar på skapa-lobby knappen
    And jag anger spelarnamn "Fatima"
    And jag klickar på skapa-lobby bekräfta-knappen
    Then ska jag omdirigeras till lobbyn
    And jag ska se texten "VÄLJ EN KARAKTÄR"
    And jag ska se spelaren "Fatima" som värd