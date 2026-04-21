Feature: Full multiplayer flow

  Scenario: Komplett spelcykel
    Given att värden skapar en lobby
    And en gäst går med via kod
    When båda spelarna är redo
    And värden startar spelet
    Then ska spelet börja

    When spelet avslutas
    Then ska resultatsidan visas

    When spelarna väljer att spela igen
    Then ska de återvända till samma lobby