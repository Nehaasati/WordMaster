Feature: Spela WordMaster-rundan
  Som spelare
  Vill jag kunna skriva ord, använda powerups och avsluta spelet
  Så att jag kan spela en full runda korrekt

  Background:
    Given att spelet är startat

  Scenario: Visa grundläggande UI-element
    Then ska jag se timern
    And ska jag se poängen
    And ska jag se kategorierna
    And ska jag se bokstäverna

  Scenario: Skriva ett ord i en kategori
    When jag skriver "äpple" i kategori "frukt"
    Then ska feedback visas för kategori "frukt"

  Scenario: Använda Freeze powerup
    When jag klickar på freeze-knappen
    Then ska freeze-meddelandet visas

  Scenario: Använda Mix powerup
    When jag klickar på mix-knappen
    Then ska bokstäverna blandas

  Scenario: Använda Ink powerup
    When jag klickar på ink-knappen
    Then ska bläck-animationen visas

  Scenario: Avsluta spelet
    When jag klickar på avsluta-knappen
    Then ska stopp-overlay visas

  Scenario: Starta ny runda (endast värd)
    Given att jag är värden
    When jag klickar på starta-ny-runda-knappen
    Then ska en ny runda startas