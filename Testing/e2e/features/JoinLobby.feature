# Gå med i lobby UI-test

Feature: Gå med i en lobby
  Som gästspelare
  Vill jag gå med i en befintlig lobby
  Så att jag kan spela WordMaster tillsammans med värden

  Scenario: Gäst går med i en lobby framgångsrikt
    Given att jag öppnar landningssidan
    And en lobby är redan skapad av värden
    When jag klickar på gå-med-i-lobby knappen
    And jag anger spelarnamn "Omar"
    And jag anger lobbykoden från värden
    And jag klickar på join-lobby bekräfta-knappen
    Then ska jag omdirigeras till lobbyn
    And jag ska se spelaren "Fatima" som värd
    And jag ska se spelaren "Omar" som gäst