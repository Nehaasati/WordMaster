Feature: Gå med i en lobby
  Som gästspelare
  Vill jag gå med i en befintlig lobby
  Så att jag kan spela WordMaster tillsammans med värden

  Scenario: Gäst går med i en lobby med kod
    Given att jag öppnar landningssidan
    When jag klickar på gå-med-i-lobby knappen
    And jag anger spelarnamn "Oskar"
    And jag anger lobbykod "ABC123"
    And jag klickar på fortsätt-knappen
    Then ska jag omdirigeras till lobbyn
    And jag ska se spelaren "Oskar" i spelarlistan

  Scenario: Gäst försöker gå med med tom kod
    Given att jag öppnar join-lobby modalen
    When jag anger spelarnamn "Oskar"
    And jag lämnar lobbykoden tom
    Then ska fortsätt-knappen vara inaktiverad

  Scenario: Gäst går med via inbjudningslänk
    Given att jag öppnar en inbjudningslänk till en lobby
    Then ska namn-modalen visas
    When jag anger spelarnamn "Oskar"
    And jag klickar på fortsätt-knappen
    Then ska jag komma in i lobbyn