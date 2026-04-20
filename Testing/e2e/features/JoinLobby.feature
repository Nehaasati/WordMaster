# Gå med i lobby UI-test

Feature: Gå med i en lobby
  Som gästspelare
  Vill jag gå med i en befintlig lobby
  Så att jag kan spela WordMaster tillsammans med värden

  Scenario: Gäst kan öppna join-lobby modal
    Given att jag öppnar landningssidan
    When jag klickar på gå-med-i-lobby knappen
    Then ska join-lobby modalen visas