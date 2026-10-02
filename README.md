# TaskFlow

Monorepo for TaskFlow: a React (Vite) client and a Node.js (Express) API.

## Structure

```
TaskFlow/
├── client/          # React + TypeScript + Vite
├── server/          # Node.js + Express + TypeScript
├── eslint.config.js
├── package.json
└── README.md
```

## Prerequisites

- Node.js 20 or later
- npm 10 or later (workspaces)

## Setup

```bash
npm install
```

Copy environment files:

```bash
copy client\.env.example client\.env
copy server\.env.example server\.env
```

On macOS/Linux:

```bash
cp client/.env.example client/.env
cp server/.env.example server/.env
```

## Run

Client (Vite, default http://localhost:5173):

```bash
npm run dev:client
```

Server (Express, default http://localhost:3001):

```bash
npm run dev:server
```

Health check:

```bash
curl http://localhost:3001/api/health
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev:client` | Start the Vite dev server |
| `npm run dev:server` | Start the API with hot reload |
| `npm run build` | Build client and server |
| `npm run lint` | Run ESLint |
| `npm run format` | Format files with Prettier |
