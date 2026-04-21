# 🎮 WordMaster API Contract

WordMaster is a multiplayer word game where players compete to find words in different categories using a shared set of letters.
This document defines the REST endpoints, SignalR real-time communication, and data models for the WordMaster backend.

---

## 📌 API Overview

| Property         | Value                        |
| ---------------- | ---------------------------- |
| **Frontend**     | `http://localhost:5173`      |
| **Backend**      | `http://localhost:5024`      |
| **API Version**  | `1.1.0`                      |
| **Format**       | JSON (UTF-8)                 |
| **Real-time**    | SignalR `/lobbyHub`          |

### 📡 Common Headers

| Header         | Value              | Description       |
| -------------- | ------------------ | ----------------- |
| `Content-Type` | `application/json` | Required for POST |
| `Accept`       | `application/json` | Recommended       |

---

## ⚠️ Response Formats

### Error Response
```json
{
  "error": "Detailed error message here."
}
```

### Common Status Codes
| Code | Meaning      | Description                                      |
| ---- | ------------ | ------------------------------------------------ |
| 200  | OK           | Request succeeded.                               |
| 201  | Created      | Resource created successfully.                   |
| 400  | Bad Request  | Validation error or invalid state (e.g. not ready).|
| 404  | Not Found    | Lobby, Player, or Character not found.           |
| 409  | Conflict     | Player already in lobby or lobby full.           |

---

# 🏠 Lobby & Game Setup

## POST `/api/lobby`
Creates a new game lobby.

### 📤 Response (200 OK)
```json
{
  "lobbyId": "85E689",
  "inviteCode": "fe6ffc4c1dff"
}
```

---

## GET `/api/lobby/{lobbyId}`
Retrieves lobby details. `{lobbyId}` can be the 6-char ID or the 12-char invite code.

### 📤 Response (200 OK)
```json
{
  "id": "85E689",
  "inviteCode": "fe6ffc4c1dff",
  "letters": ["N", "H", "Ö", "Z", "A", ...],
  "players": [
    {
      "id": "uuid-string",
      "name": "Fatima",
      "isHost": true,
      "connectionId": "signalr-id",
      "score": 0,
      "isReady": true,
      "joinedAt": "2026-04-09T09:04:15Z"
    }
  ]
}
```

---

## POST `/api/lobby/{lobbyId}/join`
Join a lobby.

### 📥 Request
```json
{
  "id": "optional-uuid",
  "name": "Oskar",
  "isHost": false
}
```

### 📤 Response (200 OK)
```json
{
  "message": "Player joined successfully",
  "lobbyId": "85E689",
  "player": {
    "id": "uuid",
    "name": "Oskar",
    "isHost": false,
    "connectionId": "signalr-id",
    "score": 0,
    "isReady": false,
    "joinedAt": "2026-04-10T12:00:00Z"
  }
}
```

---

## POST `/api/lobby/{lobbyId}/ready/{playerId}`
Marks a player as ready.

### 📤 Response (200 OK)
Returns empty body. Triggers `PlayerReady` SignalR event.

---

## POST `/api/lobby/{lobbyId}/start`
Starts the game if all players (max 2) are ready.

### 📤 Response
- **200 OK**: Game starting. Triggers `GameStarted` SignalR event.
- **400 Bad Request**: "Players not ready" or "Lobby not full".

---

# 🎮 In-Game Endpoints

## GET `/api/game/letters?count={count}`
Generates a list of random weighted letters. Default count is 25.

### 📤 Response (200 OK)
```json
["A", "E", "S", "K", "L", ...]
```

---

## POST `/api/word/validate`
Validates if a word exists in the dictionary, belongs to the category, and can be formed with the letters.

### 📥 Request
```json
{
  "word": "KATT",
  "category": "Animal",
  "letters": ["K", "A", "T", "T", "B", "R", "U"]
}
```

### 📤 Response (200 OK)
```json
{
  "isValid": true,
  "message": "Word found"
}
```

---

## POST `/api/game/calculate-score`
Calculates score for a single player's submissions.

### 📥 Request
```json
{
  "categories": [
    { "id": "Animal", "word": "KATT", "isValid": true },
    { "id": "Food", "word": "PASTA", "isValid": true }
  ]
}
```

### 📤 Response (200 OK)
```json
{
  "score": 15
}
```

---

# Shop Endpoints

Shop state is stored per player inside the current lobby round. `earnedScore` is the score from valid words before purchases, `spentScore` is the amount spent in the shop, and `balance` is the current spendable score.

## GET `/api/lobby/{lobbyId}/shop/{playerId}`
Returns the player's shop state and catalog.

### 📤 Response (200 OK)
```json
{
  "message": "Shop state loaded",
  "state": {
    "balance": 5,
    "earnedScore": 10,
    "spentScore": 5,
    "purchasedLetters": ["A"],
    "powerups": {
      "freeze": 1
    },
    "catalog": [
      { "id": "A", "label": "A", "type": "letter", "cost": 5 },
      { "id": "freeze", "label": "Freeze", "type": "powerup", "cost": 5 }
    ]
  }
}
```

---

## POST `/api/lobby/{lobbyId}/shop/{playerId}/sync-score`
Synchronizes the player's earned score before the backend applies shop spending.

### 📥 Request
```json
{
  "earnedScore": 20
}
```

### 📤 Response (200 OK)
Returns the same response shape as `GET /shop/{playerId}`.

---

## POST `/api/lobby/{lobbyId}/shop/{playerId}/purchase`
Purchases a shop item if the player has enough backend-tracked balance.

### 📥 Request
```json
{
  "itemId": "A"
}
```

### 📤 Response (200 OK)
```json
{
  "message": "Purchased 'A'.",
  "purchasedLetter": "A",
  "item": { "id": "A", "label": "A", "type": "letter", "cost": 5 },
  "state": {
    "balance": 15,
    "earnedScore": 20,
    "spentScore": 5,
    "purchasedLetters": ["A"],
    "powerups": {},
    "catalog": [
      { "id": "A", "label": "A", "type": "letter", "cost": 5 }
    ]
  }
}
```

### Errors
- **400 Bad Request**: Unknown item.
- **404 Not Found**: Lobby or player not found.
- **409 Conflict**: Not enough score, or the one-slot power-up is already owned.

---

## POST `/api/lobby/{lobbyId}/shop/{playerId}/consume-powerup`
Consumes one owned power-up before applying its effect through the game UI or SignalR.

### 📥 Request
```json
{
  "powerupId": "freeze"
}
```

### 📤 Response (200 OK)
Returns the updated shop state.

### Errors
- **400 Bad Request**: Unknown power-up.
- **404 Not Found**: Lobby or player not found.
- **409 Conflict**: Power-up has not been purchased.

---

# 🎭 Characters & Abilities

## GET `/api/character`
Returns all available characters.

### 📤 Response (200 OK)
```json
[
  {
    "id": "ugglan",
    "name": "Ugglan",
    "description": "The wise owl rewards long words.",
    "ability": {
      "type": 0,
      "bonusPoints": 3,
      "thresholdLength": 8,
      "effectDescription": "+3 bonus points for words longer than 8 letters"
    }
  },
  ...
]
```
*Note: Ability types are 0: LongWord, 1: FastAnswer, 2: ShortWord, 3: FreezeImmunity.*

---

## GET `/api/character/{id}`
Returns a single character by id.

### 📤 Response (200 OK)
```json
{
  "id": "ugglan",
  "name": "Ugglan",
  "description": "The wise owl rewards long words.",
  "ability": {
    "type": 0,
    "bonusPoints": 3,
    "thresholdLength": 8,
    "effectDescription": "+3 bonus points for words longer than 8 letters"
  }
}
```

---

## POST `/api/character/ability`
Calculates bonus points for a specific character ability.

### 📥 Request
```json
{
  "characterId": "leopard",
  "word": "HEJ",
  "secondsTaken": 4.5
}
```

### 📤 Response (200 OK)
```json
{
  "characterId": "leopard",
  "word": "HEJ",
  "bonusPoints": 3,
  "abilityTriggered": true
}
```

---

## GET `/api/character/{id}/freeze-immune`
Checks if a character is immune to freeze attacks.

### 📤 Response (200 OK)
```json
{
  "characterId": "björnen",
  "isFreezeImmune": true
}
```

---

# ⚡ Real-time (SignalR)

**Hub URL:** `http://localhost:5024/lobbyHub`

### 📞 Client Methods (Invocations)
| Method | Arguments | Description |
| :--- | :--- | :--- |
| `JoinLobbyGroup` | `lobbyId` (string) | Subscribes the client to updates for a specific lobby. |
| `UseInk` | `lobbyId` (string) | Sends an "Ink" attack to others in the lobby. |
| `UseFreeze` | `lobbyId` (string) | Sends a "Freeze" attack to others in the lobby. |

### 🔔 Server Events (On-Receive)
| Event | Payload | Description |
| :--- | :--- | :--- |
| `PlayerJoined` | `Player` (object) | A new player has joined the lobby. |
| `PlayerReady` | `playerId` (string) | A player has clicked "Ready". |
| `GameStarted` | `lobbyId` (string) | The host has started the game. |
| `InkReceived` | - | You have been hit with an ink attack! |
| `FreezeReceived` | - | You have been frozen! |
| `NotifyPlayerJoined` | `Player` (object) | Alternate event for player joining. |

---

# 🧮 Scoring Rules

| Rule | Points | Description |
| :--- | :--- | :--- |
| **Unique Word** | +10 | Word not found by any other player. |
| **Shared Word** | +5 | Word found by at least one other player. |
| **Long Word** | +5 | Bonus for words longer than 7 characters. |
| **All Categories** | +50 | Bonus for filling all categories with valid words. |

---

# 🛠️ Development Notes
* **CORS**: Must allow `http://localhost:5173`.
* **Storage**: In-memory. Data is lost on server restart.
* **Lobby Limit**: Maximum 2 players.
* **Health Check**: `GET /api/health` returns "OK".
