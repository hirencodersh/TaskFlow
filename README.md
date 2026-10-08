# TaskFlow

TaskFlow is a modern, full-stack, real-time project management and task tracking application built as a monorepo containing a **React (Vite) client** and a **Node.js (Express) API**.

---

## Architecture & Core Concepts

### 1. Project vs. Task
- **Project**: A high-level organizational container representing an initiative, client engagement, or product release. Projects encapsulate timelines, statuses, member rosters, labels, and an associated set of tasks.
- **Task**: A granular unit of work belonging to a single Project. Tasks track specific deliverables, steps, or issues with independent priorities, due dates, assignees, comments, and file attachments.

### 2. Status Flows
- **Project Statuses**:
  `PLANNING` → `ACTIVE` → `COMPLETED` → `ARCHIVED`
- **Task Statuses**:
  `TODO` → `IN_PROGRESS` → `IN_REVIEW` → `DONE`

### 3. Project Membership vs. Task Assignment
- **Project Member**: A user granted access to a project's workspace (tasks, comments, attachments, activity logs). Managed by the project owner or administrator.
- **Task Assignee**: A project member designated as responsible for executing a specific task.

---

## Role-Based Access Control (RBAC)

TaskFlow implements robust, strict role enforcement across both the frontend UI and the backend API (`401 Unauthorized` / `403 Forbidden` responses for unauthorized requests):

| Role | Users & Admin | Projects | Project Members | Tasks | Task Status (Assigned) | Comments & Attachments |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **ADMIN** | Full management (create users, toggle status, change roles) | Create, view, update, delete all | Manage members on any project | Create, view, update, delete all | Any task | Full access |
| **PROJECT_MANAGER** | View users | Create projects (becomes owner), update/delete owned projects | Add/remove members on owned projects | Create and manage tasks on owned projects | Tasks in owned projects | Full access |
| **DEVELOPER** | View users | View allowed projects (membership-based) | View project members | View assigned / project tasks | **Update status only** on assigned tasks | Create comments and upload attachments on accessible tasks |

---

## Complete E2E User Flow

1. **Administrator Setup**:
   - Admin logs into the system.
   - Admin navigates to Admin Users and creates a new user with the `PROJECT_MANAGER` role.
2. **Project & Task Creation**:
   - Project Manager logs in, creates a new **Project** (status: `PLANNING` or `ACTIVE`), and adds a **Developer** to the project member list.
   - PM creates a **Task** within the project, setting priority and assigning it to the Developer.
3. **Task Execution & Collaboration**:
   - Developer logs in, views the assigned task in their dashboard or project view.
   - Developer updates task status: `TODO` → `IN_PROGRESS` → `IN_REVIEW` → `DONE`.
   - Developer posts a comment and uploads a supporting file attachment.
   - Real-time updates propagate instantly to all active project members via Socket.IO.

---

## Real-Time Behavior (Socket.IO)

TaskFlow uses WebSockets (`socket.io` and `socket.io-client`) for real-time collaboration. When users view a project, their client joins a secure project room (`project:${projectId}`). The following events update clients in real-time without page reloads:
- `task:created` / `task:updated` / `task:deleted`
- `comment:created`
- `attachment:uploaded`
- `activity-log-created`

---

## Monorepo Structure

```
TaskFlow/
├── client/          # React 19 + TypeScript + Vite + Zustand + Lucide
├── server/          # Node.js + Express + TypeScript + Prisma ORM + PostgreSQL + Socket.IO
├── eslint.config.js
├── package.json
└── README.md
```

---

## Prerequisites

- Node.js >= 20
- npm >= 10 (with workspace support)
- PostgreSQL database

---

## Setup & Running

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy example environment files and populate database credentials and secrets:
- `client/.env.example` → `client/.env`
- `server/.env.example` → `server/.env`

### 3. Database Migration & Prisma Setup
```bash
npm run prisma:generate --workspace=server
```

### 4. Run Development Servers

- **Start API Server** (Express, default `http://localhost:3001`):
  ```bash
  npm run dev:server
  ```
- **Start Client App** (Vite, default `http://localhost:5173`):
  ```bash
  npm run dev:client
  ```

---

## Scripts & Verification

| Command | Description |
| --- | --- |
| `npm run dev:client` | Start Vite dev server |
| `npm run dev:server` | Start Express API server with hot reload |
| `npm run build` | Build both client and server |
| `npm run lint` | Run ESLint across monorepo |
| `npm run format` | Format code with Prettier |
