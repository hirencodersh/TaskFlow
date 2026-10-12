# TaskFlow

TaskFlow is a modern, full-stack, real-time project management and task tracking platform built as an npm monorepo containing a **React 19 (Vite) client** and a **Node.js (Express) API**.

---

## 🏗️ Architecture & Core Concepts

### 1. Project vs. Task
- **Project**: A high-level organizational container representing an initiative, client engagement, or product release. Projects encapsulate timelines, statuses, member rosters, labels, and an associated set of tasks.
- **Task**: A granular unit of work belonging to a single Project. Tasks track deliverables with independent priorities, due dates, multiple assignees, comments, file attachments, and task dependencies.

### 2. Status Flows
- **Project Statuses**:
  `PLANNING` → `ACTIVE` → `COMPLETED` → `ARCHIVED`
- **Task Statuses**:
  `TODO` → `IN_PROGRESS` → `IN_REVIEW` → `DONE`

### 3. Roles & Permissions (RBAC)
TaskFlow enforces strict role-based access control across `ADMIN`, `PROJECT_MANAGER`, `DEVELOPER`, `DESIGNER`, and `QA` roles, supplemented by per-user permission override toggles.

| Role | User & Team Management | Projects | Tasks & Kanban | Comments & Attachments |
| :--- | :--- | :--- | :--- | :--- |
| **ADMIN** | Full management (create users, toggle status, change roles, permission overrides) | Create, view, update, delete all projects | Create, view, update, delete all tasks & dependencies | Full access |
| **PROJECT_MANAGER** | View users, manage team members within owned projects | Create projects (owner), update/delete owned projects | Create, view, update, delete tasks in owned projects | Full access |
| **DEVELOPER** | View team members | View allowed projects (membership-based) | View assigned tasks, update task status (except `DONE`) | Add comments & upload attachments |
| **DESIGNER** | View team members | View allowed projects (membership-based) | View assigned tasks, update task status (except `DONE`) | Add comments & upload design attachments |
| **QA** | View team members | View allowed projects (membership-based) | View assigned tasks, update task status (including `DONE` / testing review) | Add comments & upload test attachments |

---

## ✨ Key Features & Phases

1. **Product Presentation (Phase 1)**:
   - Professional SaaS landing page at `/` with hero, features, how-it-works, CTA, and responsive navigation.
   - Modern Login and Registration flows with instant session initialization.
2. **Team & Access (Phase 2)**:
   - Expanded roles (`ADMIN`, `PROJECT_MANAGER`, `DEVELOPER`, `DESIGNER`, `QA`).
   - Admin Users management hiding the logged-in admin from listings.
   - User Details pages with profile info, task statistics, project involvement, and per-user permission overrides.
3. **Task Management (Phase 3)**:
   - Interactive Kanban Board with 4 columns (`TODO`, `IN_PROGRESS`, `IN_REVIEW`, `DONE`) and drag-and-drop/quick-move status transitions.
   - Multiple assignees per task with role and project membership validation.
   - Task dependencies ("blocked by" / "blocking") with circular dependency prevention and blocked task validation (preventing tasks from starting if required blockers are incomplete).
4. **Communication & Notifications (Phase 4)**:
   - Persistent in-app notification center in the navbar with unread badge counter.
   - Automated real-time notifications for task assignments, status changes, comments, and dependency events via Socket.IO user rooms.
   - Notification history, unread filtering, mark-as-read, and mark-all-as-read.
5. **Advanced Dashboard & Analytics (Phase 5)**:
   - Role-specific dashboards (Admin, PM, Developer, Designer, QA) calculating real-time metrics from PostgreSQL.
   - Team workload charts, project progress, overdue task tracking, upcoming deadlines, and project filters.
6. **Final Polish & Documentation (Phase 6)**:
   - Comprehensive end-to-end polish, responsive layouts across desktop/tablet/mobile, and robust error/loading/empty states.

---

## ⚡ Real-Time Collaboration (Socket.IO)

TaskFlow uses WebSockets for real-time synchronization. Clients join secure project rooms (`project:${projectId}`) and personal user rooms (`user:${userId}`) to receive instant updates for:
- `task:created`, `task:updated`, `task:deleted`
- `comment:created`, `comment:updated`, `comment:deleted`
- `attachment:uploaded`, `attachment:deleted`
- `notification:new`
- `activity-log-created`

---

## 📁 Monorepo Structure

```
TaskFlow/
├── client/          # React 19 + TypeScript + Vite + Zustand + Lucide
├── server/          # Node.js + Express + TypeScript + Prisma ORM + PostgreSQL + Socket.IO
├── eslint.config.js
├── package.json
└── README.md
```

---

## ⚙️ Environment Variables

### 1. Server (`server/.env`)
```env
PORT=3001
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:5173
DATABASE_URL="postgresql://postgres:password@localhost:5432/taskflow_db?schema=public"
JWT_ACCESS_SECRET=your_access_secret_key_here
JWT_REFRESH_SECRET=your_refresh_secret_key_here
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=user@example.com
SMTP_PASS=password
```

### 2. Client (`client/.env`)
```env
VITE_API_URL=http://localhost:3001/api/v1
```

---

## 🚀 Local Setup & Installation

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy and populate `.env.example` to `.env` in both `client/` and `server/`.

### 3. Database Migration & Prisma Setup
Ensure PostgreSQL is running, then execute:
```bash
cd server
npx prisma migrate dev
npx prisma generate
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

## 🔍 Scripts & Verification

| Command | Description |
| --- | --- |
| `npm run dev:client` | Start Vite dev server |
| `npm run dev:server` | Start Express API server with hot reload |
| `npm run build` | Build both client and server |
| `npm run lint` | Run ESLint across monorepo |
| `npm run format` | Format code with Prettier |

---

## 🛠️ Troubleshooting

- **Database Connection Error**: Ensure PostgreSQL service is active and `DATABASE_URL` credentials are correct in `server/.env`.
- **WebSocket Connection Failure**: Verify `VITE_API_URL` in `client/.env` matches the Express server URL and CORS `CLIENT_ORIGIN` matches the client app URL.
- **Cloudinary Upload Issues**: Ensure Cloudinary API credentials (`CLOUDINARY_CLOUD_NAME`, `KEY`, `SECRET`) are properly configured in `server/.env`.
