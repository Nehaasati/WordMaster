Feature: Lobby Page
  Som spelare
  Vill jag kunna välja karaktär, se andra spelare och bli redo
  Så att spelet kan starta korrekt

  Background:
    Given att en lobby är skapad av värden
    And att jag är inne i lobbyn

  Scenario: Visa grundläggande lobbyinformation
    Then ska jag se lobbytiteln
    And ska jag se mitt namn
    And ska jag se lobby-ID

  Scenario: Bläddra mellan karaktärer
    When jag klickar på nästa karaktär
    Then ska karaktärsbilden ändras

    When jag klickar på föregående karaktär
    Then ska karaktärsbilden ändras igen

  Scenario: Välja spelläge (endast värd)
    When värden väljer Blitz-läge
    Then ska Blitz-läget vara aktivt

  Scenario: Markera mig som redo
    When jag klickar på redo-knappen
    Then ska min status visas som redo

  Scenario: Lägga till bot (endast värd)
    When värden lägger till en bot
    Then ska en bot visas i spelarlistan

  Scenario: Öppna info-rutan
    When jag klickar på info-knappen
    Then ska info-rutan visas

  Scenario: Kopiera inbjudningslänk
    When jag klickar på kopiera-länk-knappen
    Then ska en bekräftelse visas