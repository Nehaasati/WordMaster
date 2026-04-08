Feature: Landing Page

  Scenario: Spelare ser landningssidan med alla element
    Given att jag öppnar startsidan
    Then ska jag se Word Master titeln
    And ska jag se Create a lobby knappen
    And ska jag se Join a lobby knappen

  Scenario: Spelare navigerar till lobby
    Given att jag öppnar startsidan
    When jag klickar på Create a lobby
    Then ska jag se lobby sidan