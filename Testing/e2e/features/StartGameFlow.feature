Feature: Starta spel från lobby

  Background:
    Given att två spelare är i lobbyn

  Scenario: Värden startar spelet när alla är redo
    Given att båda spelarna är redo
    When värden klickar på starta spelet
    Then ska spelet starta
    And ska spelarna omdirigeras till game-sidan

  Scenario: Värden försöker starta utan tillräckligt antal spelare
    Given att endast en spelare finns i lobbyn
    When värden klickar på starta spelet
    Then ska ett felmeddelande visas