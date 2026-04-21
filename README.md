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
start test
cd testing
ui testing:
npm run test:ui
unit testing:
dotnet test testing\Wordmaster.UnitTests\wordmaster.UnitTests.csproj
system testing
📡 Real-time Events (SignalR)
Event	Description
PlayerJoined	A player joins lobby
PlayerReady	Player marked as ready
GameStarted	Game begins
InkReceived	second Player  hit with ink
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
│ (Unit + API)         │
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
Oskar Gyllenör
Ali Reza Merzai
Arbaz Shah
Neha Asati


