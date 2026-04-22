## WORD MASTER

# Word Master är ett realtids multiplayer ordspel där spelare tävlar om att hitta giltiga ord inom olika kategorier med hjälp av ett gemensamt set bokstäver.

## Funktioner
Multiplayer lobby-system
Slumpmässig bokstavsgenerering
Ordvalidering (ordbok, kategori och bokstavsregler)
Poängsystem med bonusar
In-game shop (bokstäver och power-ups)
Karaktärer med unika förmågor
Realtidsspel med SignalR
Hur spelet fungerar
Lobby skapelse

En spelare skapar en ny lobby.
Systemet genererar ett lobby-ID och en inbjudningskod.

## Karaktärsval

Varje spelare väljer en av fyra karaktärer:

# Ugglan – +3 bonuspoäng för ord längre än 5 bokstäver
# Leopard – +3 bonuspoäng för ord skickade inom 60 sekunder
# Musen – +1 bonuspoäng för ord kortare än 4 bokstäver
# Björnen – Immun mot Freeze-effekten

## Gå med i spelet

# Den andra spelaren ansluter via:

# Inbjudningslänk, eller
# Lobbykod

# Båda spelare väljer karaktär.

# Start av spelet

# Hosten startar spelet när båda spelare är redo.

### Gameplay

# Spelare får ett gemensamt set slumpmässiga bokstäver.

Målet är att:

# Hitta giltiga ord
# Matcha kategorier
# Skicka in så många korrekta ord som möjligt

## Shop och power-ups

# Spelare kan använda poäng i shoppen:

# Köpa vokala bokstäver (inklusive Å, Ä, Ö)
# Frysa motståndaren temporärt
# Jokerkort:
# Ger en slumpmässig bokstav: Om det används i ett ord dubbleras poängen

## Spelinteraktion

### Spelare kan:

# Använda power-ups mot motståndaren
# Få fördelar via shop-items
# Använda jokerkort strategiskt
# Spelets slut

### Spelet avslutas när:

# En spelare klarar alla kategorier, eller
# Rundans tid tar slut

# Slutpoängen beräknas baserat på:

## Grundpoäng
### Karaktärsbonusar
### Shop-effekter
### Teknikstack

## Frontend: React, TypeScript, Vite
## Backend: .NET Minimal API
## Realtid: SignalR
## Testning: Enhets-, integrations -API-tester, e2e, K6 prestandatester, mutation testing, load testing.
## CI/CD: GitHub Actions och Render deployment
## Säkerhet: Statisk kodanalys och beroendeskanning

## Arkitektur

Frontend (React + TypeScript)
|
| HTTP (REST API)
v
Backend (.NET Minimal API)
|
| SignalR (realtid)
v
In-memory lagring

Backend består av:

Controllers
Services
Models
SignalR Hub
API-översikt

Frontend: http://localhost:5173

Backend: http://localhost:5024

Format: JSON
Realtid: /lobbyHub (SignalR)

Teststrategi

Projektet innehåller:

Enhetstester (logik)
Integrationstester (flöden)
API-tester (REST endpoints)

Testområden:

Lobby skapande och anslutning
Ordvalidering
Poängberäkning
Shop-transaktioner
CI/CD-pipeline

Implementerad med GitHub Actions.

Steg i pipelinen:

Installera beroenden
Bygga applikation
Köra tester (unit, API, UI)
Säkerhetskontroller (dependency scanning)
Deploy till Render
DevSecOps

Säkerhet är integrerad i pipelinen:

Statisk kodanalys
Skanning av sårbara beroenden
Validering av API-input
Felhanteringsstrategier
Installation
git clone <https://github.com/Nehaasati/WordMaste>
cd wordmaster
Frontend
cd frontend
npm install
npm run dev
Backend
cd backend
dotnet build
dotnet run
Testning
cd testing

API-test:

npm run test:api

UI-test:

npm run test:ui

Enhetstest:

npm run test:unit
Realtidshändelser (SignalR)
PlayerJoined – En spelare ansluter till lobbyn
PlayerReady – Spelaren markerar redo
GameStarted – Spelet startar
InkReceived – Spelaren träffas av ink
FreezeReceived – Spelaren fryses
Poängsystem
Unikt ord: +10
Delat ord: +5
Långt ord: +5
Alla kategorier klara: +50
CI/CD-flöde

Push / Pull Request
→ Installera beroenden
→ Bygg applikation
→ Kör tester (unit, API, UI)
→ Säkerhetskontroller
→ Deploy till Render

Team

Neha Asati
GitHub: https://github.com/Nehaasati

LinkedIn: https://www.linkedin.com/in/neha-asati-28aab959/

Fatima Al-Murtadha
GitHub: https://github.com/FatimaAlMurtadha

LinkedIn: https://www.linkedin.com/in/fatima-al-murtadha-8a19b9294/

Oskar Gyllenör
GitHub: https://github.com/OskarUNLEASHED

LinkedIn: https://www.linkedin.com/in/oskar-gyllenör-40778a291

Ali Reza Merzai
GitHub: https://github.com/alireza8850

LinkedIn: https://www.linkedin.com/in/ali-reza-merzai-235960190/

Arbaz Shah
GitHub: https://github.com/arbazshah52

LinkedIn: https://linkedin.com/in/syed-arbaz-hussain-shah-788921100