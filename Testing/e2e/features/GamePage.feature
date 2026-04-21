Feature: Game Page

  Background:
    Given att spelet har startat

  Scenario: Visa spelkomponenter
    Then ska jag se timern
    And ska jag se min poäng
    And ska jag se bokstäverna
    And ska jag se kategorierna

  Scenario: Skriva ett ord i en kategori
    When jag skriver ett giltigt ord i kategorin "Djur"
    Then ska ordet markeras som giltigt

  Scenario: Bokstäver används korrekt
    When jag skriver ett ord i en kategori
    Then ska använda bokstäver markeras som använda

  Scenario: Alla kategorier klara
    When jag fyller i alla kategorier korrekt
    Then ska spelet avslutas automatiskt

  Scenario: Freeze powerup
    When jag använder freeze powerup
    Then ska motståndaren bli fryst

  Scenario: Ink powerup
    When jag använder bläck powerup
    Then ska en bläck-effekt visas

  Scenario: Joker aktiveras
    When jag aktiverar joker
    Then ska en joker-bokstav visas