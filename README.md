██╗    ██╗ ██████╗ ██████╗ ██████╗ ███╗   ███╗ █████╗ ███████╗████████╗███████╗██████╗
██║    ██║██╔═══██╗██╔══██╗██╔══██╗████╗ ████║██╔══██╗██╔════╝╚══██╔══╝██╔════╝██╔══██╗
██║ █╗ ██║██║   ██║██████╔╝██║  ██║██╔████╔██║███████║███████╗   ██║   █████╗  ██████╔╝
██║███╗██║██║   ██║██╔══██╗██║  ██║██║╚██╔╝██║██╔══██║╚════██║   ██║   ██╔══╝  ██╔══██╗
╚███╔███╔╝╚██████╔╝██║  ██║██████╔╝██║ ╚═╝ ██║██║  ██║███████║   ██║   ███████╗██║  ██║
 ╚══╝╚══╝  ╚═════╝ ╚═╝  ╚═╝╚═════╝ ╚═╝     ╚═╝╚═╝  ╚═╝╚══════╝   ╚═╝   ╚══════╝╚═╝  ╚═╝

🎮 WORD MASTER   is a real-time multiplayer word game where players compete to find words across categories using a shared set of letters.



🚀 Features
🎮 Multiplayer lobby system 
🔤 Random letter generation
✅ Word validation (dictionary + category + letters)
🧮 Scoring system with bonuses
🛒 In-game shop (letters & power-ups)
🎭 Characters with abilities
⚡ Real-time gameplay using SignalR


🕹️ How the Game Works
Host Creates Lobby
A player (host) creates a new lobby.
The system generates a lobby ID / invite code.

Choose Character
The host selects one of four characters:
🦉 Ugglan – +3 bonus points for words longer than 5 letters
🐆 Leopard – +3 bonus points for words submitted within 60 seconds
🐭 Musen – +1 bonus point for words shorter than 4 letters
🐻 Björnen – Immune to the Freeze chaos event

Second Player Joins
The second player joins using:
Invite link or
Lobby code
The player also selects a character.
Game Start
The host starts the game when both players are ready.

🔤 Gameplay
Players receive a shared set of random letters.
The goal is to:
Find valid words
Match categories
Submit as many correct words as possible

🛒 Shop & Power-ups
During the game, players can use points in the shop:
🔤 Buy extra letters (including Swedish vowels like Å, Ä, Ö)
❄️ Freeze – temporarily blocks the opponent
🎴 Joker Card
Gives a random letter
If used in a word → double points

⚔️ Player Interaction
Players can:
Attack each other using power-ups (e.g. Freeze)
Gain advantages through shop items
Strategically use Joker cards

🏁 Game End
The game ends when:
A player finishes all categories or
The round is completed
Final scores are calculated:
Base points
Bonus points (character abilities)
Shop effects

🧰 Tech Stack
Layer	Technology
Frontend	React + TypeScript + Vite
Backend	.NET Minimal API
Real-time	SignalR
Testing	Unit, Integration & API Testing
CI/CD	GitHub Actions + Render Deployment
Security	Static analysis & dependency checks


🏗️ Architecture
┌──────────────────────────────────────┐
│              Frontend                │
│        React + TypeScript (Vite)     │
└──────────────────┬───────────────────┘
                   │ HTTP (REST API)
┌──────────────────▼───────────────────┐
│              Backend                 │
│          .NET Minimal API            │
│                                     │
│  Controllers   Services   Models     │
│                                     │
│     SignalR (Real-time Hub)          │
└──────────────────┬───────────────────┘
                   │
┌──────────────────▼───────────────────┐
│          In-Memory Storage           │
└──────────────────────────────────────┘
🔌 API Overview
Property	Value
Frontend	http://localhost:5173

Backend	http://localhost:5024

Format	JSON
Real-time	/lobbyHub (SignalR)
🧪 Testing Strategy

This project includes:
✅ Unit Testing (core logic)
🔗 Integration Testing (services & flows)
🌐 API Testing (REST endpoints)


Example areas tested:
Lobby creation & joining
Word validation
Score calculation
Shop transactions


⚙️ CI/CD Pipeline

Implemented using GitHub Actions:

Pipeline steps:
Build project
Run automated tests
Perform static code analysis
Security checks (dependencies)
Deploy to Render

🔐 DevSecOps

Security integrated into the pipeline:

Static code analysis
Dependency vulnerability scanning
Validation of API inputs
Error handling strategies


📦 Installation
git clone <https://github.com/Nehaasati/WordMaste>
cd wordmaster
Start frontend
cd frondend
npm install
npm run dev

Start backend
cd backend
dotnet build
dotnet run

start test:
cd testing
ui testing:
npm run test:ui
unit testing:
npm run test:unit
system testing
npm run test:api


📡 Real-time Events (SignalR)
Event	Description
PlayerJoined	A player joins lobby
PlayerReady	Player marked as ready
GameStarted	Game begins
InkReceived	Player  hit with ink
FreezeReceived	Player frozen


🧮 Scoring Rules
Rule	Points
Unique Word	+10
Shared Word	+5
Long Word	+5
All Categories	+50


This project demonstrates:

Test automation (unit, integration, API)
CI/CD pipeline implementation
Push / Pull Request
        │
        ▼
┌─────────────────────┐
│  Install Dependencies│
└─────────┬───────────┘
          ▼
┌─────────────────────┐
│     Build App        │
└─────────┬───────────┘
          ▼
┌─────────────────────┐
│   Run Tests          │
│ (Unit + API+ui)         │
└─────────┬───────────┘
          ▼
┌─────────────────────┐
│ Security Checks      │
│ (Dependencies scan)  │
└─────────┬───────────┘
          ▼
┌─────────────────────┐
│ Deploy to Render     │
└─────────────────────┘

DevSecOps integration
Analysis of test results and system quality



👥 Team
Neha Asati : https://github.com/Nehaasati / https://www.linkedin.com/in/neha-asati-28aab959/
Fatima Al-Murtadha : https://github.com/FatimaAlMurtadha / https://www.linkedin.com/in/fatima-al-murtadha-8a19b9294/
Oskar Gyllenör: https://github.com/OskarUNLEASHED / www.linkedin.com/in/oskar-gyllenör-40778a291
Ali Reza Merzai: https://github.com/alireza8850 / https://www.linkedin.com/in/ali-reza-merzai-235960190/
Arbaz Shah: https://github.com/arbazshah52 / http://linkedin.com/in/syed-arbaz-hussain-shah-788921100 



