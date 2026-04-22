# WORD MASTER

Word Master är ett realtids multiplayer ordspel där spelare tävlar om att hitta giltiga ord inom olika kategorier med
hjälp av ett gemensamt set bokstäver.

---

## Features

* Multiplayer lobby-system
* Slumpmässig bokstavsgenerering
* Ordvalidering (ordbok, kategori och bokstavsregler)
* Poängsystem med bonusar
* In-game shop (bokstäver och power-ups)
* Karaktärer med unika förmågor
* Realtidsspel med SignalR

---

## Hur spelet fungerar

### 1. Lobby skapelse

* En spelare skapar en ny lobby
* Systemet genererar ett lobby-ID och en inbjudningskod

---

### 2. Karaktärsval

Varje spelare väljer en av fyra karaktärer:

* Ugglan – +3 bonuspoäng för ord längre än 5 bokstäver
* Leopard – +3 bonuspoäng för ord skickade inom 60 sekunder
* Musen – +1 bonuspoäng för ord kortare än 4 bokstäver
* Björnen – Immun mot Freeze-effekten

---

### 3. Gå med i spelet

Den andra spelaren ansluter via:

* Inbjudningslänk
* Lobbykod

Båda spelare väljer karaktär.

---

### 4. Start av spelet

* Hosten startar spelet när båda spelare är redo

---

## Gameplay

* Spelare får ett gemensamt set slumpmässiga bokstäver

Målet är att:

* Hitta giltiga ord
* Matcha kategorier
* Skicka in så många korrekta ord som möjligt

---

## Shop och power-ups

Spelare kan använda poäng i shoppen:

* Köpa vokala bokstäver (inklusive Å, Ä, Ö)
* Frysa motståndaren temporärt
* Jokerkort:

    * Ger en slumpmässig bokstav
    * Om det används i ett ord dubbleras poängen

---

## Spelinteraktion

Spelare kan:

* Använda power-ups mot motståndaren
* Få fördelar via shop-items
* Använda jokerkort strategiskt

---

## Spelets slut

Spelet avslutas när:

* En spelare klarar alla kategorier, eller
* Rundans tid tar slut

### Poängberäkning

* Grundpoäng
* Karaktärsbonusar
* Shop-effekter

Detaljer:

* Unikt ord: +10
* Delat ord: +5
* Långt ord: +5
* Alla kategorier klara: +50

---

## Teknikstack

### Frontend

* React
* TypeScript
* Vite

### Backend

* .NET Minimal API

### Realtid

* SignalR

### Testning

* Enhetstester
* Integrationstester
* API-tester
* E2E-tester
* K6 prestandatester
* Mutation testing
* Load testing

### CI/CD

* GitHub Actions
* Render deployment

### Säkerhet

* Statisk kodanalys
* Beroendeskanning
* API-input validering
* Felhanteringsstrategier

---

## Arkitektur

```
Frontend (React + TypeScript)
        |
        | HTTP (REST API)
        v
Backend (.NET Minimal API)
        |
        | SignalR (realtid)
        v
In-memory lagring
```
````
WordMaster/
│
├── backend/                 # .NET 8 Minimal API
│   ├── Data/
│   │   ├── categories.json  # Kategorier + ord
│   │   ├── SAOL13_*.txt     # Svenska ordlistor
│   ├── Services/
│   │   ├── GameEngine.cs    # Spelmotorn (huvudlogik)
│   │   ├── WordValidator.cs # SAOL‑validering
│   │   ├── WordDictionaryLoader.cs
│   ├── Program.cs           # API‑endpoints
│
├── frontend/                # React + Vite + TypeScript
│   ├── pages/
│   │   ├── GamePage.tsx     # Huvudsidan
│   ├── css/
│   ├── tests/               # Playwright‑tester
│
└── README.md
````
### Backend består av:

* Controllers
* Services
* Models
* SignalR Hub (/lobbyHub)

---

## API och endpoints

* Frontend: http://localhost:5173
* Backend: http://localhost:5024

---

## Teststrategi

### Projektet innehåller:

* Enhetstester (logik)
* Integrationstester (flöden)
* API-tester (REST endpoints)

### Testområden:

* Lobby skapande och anslutning
* Ordvalidering
* Poängberäkning
* Shop-transaktioner

---

## CI/CD Pipeline

### Steg i pipelinen:

1. Installera beroenden
2. Bygga applikation
3. Köra tester (unit, API, UI)
4. Säkerhetskontroller
5. Deploy till Render

---

## DevSecOps

Säkerhet är integrerad i pipelinen:

* Statisk kodanalys
* Skanning av sårbara beroenden
* Validering av API-input
* Felhanteringsstrategier

---

## Installation

```bash
git clone https://github.com/Nehaasati/WordMaste
cd wordmaster
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
dotnet build
dotnet run
```

---

## Testning

```bash
cd Testing
```

### API-test

```bash
npm run test:api
```

### UI-test

```bash
npm run test:ui
```

### Enhetstest

```bash
npm run test:unit
```

---

## Realtidshändelser (SignalR)

* PlayerJoined – En spelare ansluter till lobbyn
* PlayerReady – Spelaren markerar redo
* GameStarted – Spelet startar
* InkReceived – Spelaren träffas av ink
* FreezeReceived – Spelaren fryses

---

## CI/CD-flöde

```
Push / Pull Request
        ->
Installera beroenden
        ->
Bygg applikation
        ->
Kör tester (unit, API, UI)
        ->
Säkerhetskontroller
        ->
Deploy till Render
```

---

## Team

### Neha Asati

GitHub: https://github.com/Nehaasati
LinkedIn: https://www.linkedin.com/in/neha-asati-28aab959/

### Fatima Al-Murtadha

GitHub: https://github.com/FatimaAlMurtadha
LinkedIn: https://www.linkedin.com/in/fatima-al-murtadha-8a19b9294/

### Oskar Gyllenör

GitHub: https://github.com/OskarUNLEASHED
LinkedIn: https://www.linkedin.com/in/oskar-gyllenör-40778a291

### Ali Reza Merzai

GitHub: https://github.com/alireza8850
LinkedIn: https://www.linkedin.com/in/ali-reza-merzai-235960190/

### Arbaz Shah

GitHub: https://github.com/arbazshah52
LinkedIn: https://linkedin.com/in/syed-arbaz-hussain-shah-788921100