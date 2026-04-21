Feature: Starta om spel i samma lobby

  Scenario: Alla spelare röstar för att spela igen
    Given att spelare är på resultatsidan
    When alla spelare klickar på spela igen
    Then ska lobbyn återställas
    And spelarna ska omdirigeras till lobbyn

  Scenario: En spelare väntar på andra
    Given att jag är på resultatsidan
    When jag klickar på spela igen
    Then ska jag se att jag väntar på andra spelare