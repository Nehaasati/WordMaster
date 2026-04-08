# 🎮 WordMaster API Contract
 WordMaster multiplayer word game.
Includes REST endpoints, SignalR real-time communication, and data models.
------------------------------------------------------------------------


## 📸 Overview Diagram

![System Overview](images/api-overview.png)

------------------------------------------------------------------------


## 📌 API Overview

| Property            | Value                       |
| ------------------- | --------------------------- |
| **Base URL (dev)**  | `http://127.0.0.1:5024`     |
|   **API Version**   | `1.0.0`                     |
| **Format**          | JSON (UTF-8)                |
| **Real-time**       | SignalR `/lobbyHub`         |



## 📡 Common Headers

| Header         | Value              | Description       |
| -------------- | ------------------ | ----------------- |
| `Content-Type` | `application/json` | Required for POST |
| `Accept`       | `application/json` | Preferred         |


------------------------------------------------------------------------
## ⚠️ Response Format

### Error

```json
{ "error": "Human readable message." }
```

### Status Codes

| Code | Meaning     |
| ---- | ----------- |
| 200  | OK          |
| 201  | Created     |
| 400  | Bad Request |
| 404  | Not Found   |
| 409  | Conflict    |

---

# 🧩 Data Models

## Character

```json
{
  "id": "ugglan",
  "name": "Ugglan",
  "description": "The wise owl rewards long words.",
  "ability": {
    "type": "LongWordBonus",
    "bonusPoints": 3,
    "thresholdLength": 8
  }
}
```

---

## Player

```json
{
  "id": "guid",
  "name": "Leopard",
  "isHost": true,
  "score": 0,
  "isReady": false
}
```


## Lobby

```json
{
  "id": "A3F9C1",
  "inviteCode": "b3f9c1a2d4e6",
  "letters": ["K","A","T"],
  "players": []
}
```

------------------------------------------------------------------------

# 🎭 Character Endpoints

## GET `/api/character`

Returns all characters.

### ✅ Response

```json
[
  { "id": "ugglan", "name": "Ugglan" }
]
```

---

## GET `/api/character/ugglan

{
  "id": "ugglan",
  "name": "Ugglan",
  "description": "The wise owl rewards long words.",
  "ability": {
    "type": "LongWordBonus",
    "bonusPoints": 3,
    "thresholdLength": 8
  }
}

| Param | Type   | Description  |
| ----- | ------ | ------------ |
| id    | string | Character ID |

---

## POST `/api/character/ability`

Calculate bonus points.

### 📥 Request

```json
{
  "characterId": "ugglan",
  "word": "katastrofal",
  "secondsTaken": 7.3
}
```

### 📤 Response

```json
{
  "bonusPoints": 3,
  "abilityTriggered": true
}
```

---

# 🏠 Lobby Endpoints

## POST `/api/lobby`

Create a lobby.

### 📤 Response

```json
{
  "lobbyId": "A3F9C1",
  "inviteCode": "abc123"
}
```

---

## POST `/api/lobby/{id}/join`

Join a lobby.

| Field  | Type   | Required |
| ------ | ------ | -------- |
| name   | string | ✅        |
| isHost | bool   | ✅        |

---

## POST `/api/lobby/{id}/ready/{playerId}`

Marks player as ready.

---

## POST `/api/lobby/{id}/start`

Starts the game.

---

# 🎮 Game Endpoint

## POST `/api/game/{lobbyId}/validate`

### 📥 Request

```json
{
  "word": "katter",
  "category": "djur"
}
```

### 📤 Response

```json
{
  "isValid": true,
  "message": "Word found"
}
```

---

# 🧮 Score Calculation

## POST `/api/score/calculate`

### 📥 Request

```json
{
  "submissions": {}
}
```

### 📤 Response

```json
{
  "player1": 50,
  "player2": 30
}
```
------------------------------------------------------------------------

## 🧾 Rules

| Rule           | Points |
| -------------- | ------ |
| Unique word    | +10    |
| Shared word    | +5     |
| Long word      | +5     |
| All categories | +50    |

---

# ⚡ Real-time (SignalR)

## Hub URL

```
/lobbyHub
```

---

## Events

### PlayerJoined

```js
connection.on("PlayerJoined", (player) => {});
```

### PlayerReady

```js
connection.on("PlayerReady", (id) => {});
```

### GameStarted

```js
connection.on("GameStarted", (lobbyId) => {});
```

---

# 🔄 Core Flow

```
Create Lobby → Join → Ready → Start → Play → Score
```

------------------------------------------------------------------------

# 🔐 Notes

* No authentication required
* Max 2 players per lobby
* In-memory storage
* Requires CORS config

------------------------------------------------------------------------

# 🚀 Future Improvements

* Authentication (JWT)
* Persistent database
* Match history
* Rankings

------------------------------------------------------------------------