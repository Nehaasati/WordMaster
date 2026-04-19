Feature: Resultatsidan
  Som spelare
  Vill jag se resultatet efter rundan
  Så att jag kan veta vem som vann och välja att spela igen

  Background:
    Given att jag är på resultatsidan

  Scenario: Visa grundläggande UI-element
    Then ska jag se resultat-titeln
    And ska jag se scoreboarden

  Scenario: Visa vinnaren
    Then ska vinnarrutan visas

  Scenario: Visa oavgjort resultat
    Given att resultatet är oavgjort
    Then ska oavgjort-texten visas

  Scenario: Visa mina poäng i scoreboarden
    Then ska mitt namn markeras som mig själv

  Scenario: Rösta för att spela igen
    When jag klickar på spela-igen-knappen
    Then ska min röst registreras

  Scenario: Gå tillbaka till menyn
    When jag klickar på tillbaka-knappen
    Then ska jag hamna på menyn