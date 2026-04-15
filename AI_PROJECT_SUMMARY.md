# Mind Recharge - AI Project Summary

## 1. Project purpose

`Mind Recharge` is a mental-health/self-recovery app focused on emotional healing after difficult events such as breakups, attachment issues, or recurring emotional triggers.

The app is split into:

- `mind-recharge-fe`: React + Vite + TypeScript frontend, also packaged as Android app via Capacitor
- `mind-recharge-be`: Spring Boot backend with JWT auth, SQL Server, Flyway migrations

Core user-facing features:

- Authentication and profile management
- Daily emotional check-in
- Journal entries
- Unsent messages
- No-contact journey tracker
- Emotional trigger cooldown session
- Daily self-care tasks
- Healing timeline / trend view
- Bootstrap content payload for quotes, microcopy, reminders, milestone text, and daily task templates

---

## 2. High-level architecture

### Frontend

Frontend is a single-page app with:

- React 18
- React Router
- TanStack Query for server state
- Tailwind + shadcn/ui-style components
- Capacitor Android wrapper

Main app shell:

- [`mind-recharge-fe/src/App.tsx`](/D:/reminer-app/mind-recharge/mind-recharge-fe/src/App.tsx)

Key frontend directories:

- [`mind-recharge-fe/src/pages`](/D:/reminer-app/mind-recharge/mind-recharge-fe/src/pages): screen-level pages
- [`mind-recharge-fe/src/services`](/D:/reminer-app/mind-recharge/mind-recharge-fe/src/services): API wrappers
- [`mind-recharge-fe/src/contexts`](/D:/reminer-app/mind-recharge/mind-recharge-fe/src/contexts): auth and bootstrap state
- [`mind-recharge-fe/src/lib`](/D:/reminer-app/mind-recharge/mind-recharge-fe/src/lib): API client, native config, security session helpers
- [`mind-recharge-fe/src/components`](/D:/reminer-app/mind-recharge/mind-recharge-fe/src/components): reusable UI pieces

### Backend

Backend follows a standard modular Spring structure:

- `controller`
- `service`
- `repository`
- `dto`
- `entity`
- `mapper`

Common/shared backend code lives under:

- [`mind-recharge-be/src/main/java/com/sba302/reminer/common`](/D:/reminer-app/mind-recharge/mind-recharge-be/src/main/java/com/sba302/reminer/common)

Feature modules live under:

- [`mind-recharge-be/src/main/java/com/sba302/reminer/module`](/D:/reminer-app/mind-recharge/mind-recharge-be/src/main/java/com/sba302/reminer/module)

Current modules:

- `admin`
- `auth`
- `bootstrap`
- `checkin`
- `content`
- `dailytask`
- `healing`
- `home`
- `journal`
- `nocontact`
- `trigger`
- `unsent`
- `user`

---

## 3. Frontend route map

Defined in [`mind-recharge-fe/src/App.tsx`](/D:/reminer-app/mind-recharge/mind-recharge-fe/src/App.tsx).

Public route:

- `/login`

Protected routes:

- `/` -> home / dashboard
- `/journal`
- `/unsent`
- `/tracker`
- `/trigger`
- `/tasks`
- `/profile`

All protected routes are wrapped by:

- [`mind-recharge-fe/src/components/ProtectedRoute.tsx`](/D:/reminer-app/mind-recharge/mind-recharge-fe/src/components/ProtectedRoute.tsx)

Global layout pieces:

- [`mind-recharge-fe/src/components/TopHeader.tsx`](/D:/reminer-app/mind-recharge/mind-recharge-fe/src/components/TopHeader.tsx)
- [`mind-recharge-fe/src/components/BottomNav.tsx`](/D:/reminer-app/mind-recharge/mind-recharge-fe/src/components/BottomNav.tsx)

---

## 4. Frontend feature map

### Authentication

- Auth state is managed in [`mind-recharge-fe/src/contexts/AuthContext.tsx`](/D:/reminer-app/mind-recharge/mind-recharge-fe/src/contexts/AuthContext.tsx)
- API calls are in [`mind-recharge-fe/src/services/authApi.ts`](/D:/reminer-app/mind-recharge/mind-recharge-fe/src/services/authApi.ts)
- Login/register UI is in [`mind-recharge-fe/src/pages/Login.tsx`](/D:/reminer-app/mind-recharge/mind-recharge-fe/src/pages/Login.tsx)

Important detail:

- Access token and refresh token are stored in `localStorage`
- `apiClient.ts` auto-refreshes access token on `401`

Relevant file:

- [`mind-recharge-fe/src/lib/apiClient.ts`](/D:/reminer-app/mind-recharge/mind-recharge-fe/src/lib/apiClient.ts)

### Bootstrap content

The app fetches one initial payload after login containing quotes, mood responses, milestone text, reminders, and task templates.

- Context: [`mind-recharge-fe/src/contexts/BootstrapContext.tsx`](/D:/reminer-app/mind-recharge/mind-recharge-fe/src/contexts/BootstrapContext.tsx)
- API: [`mind-recharge-fe/src/services/bootstrapApi.ts`](/D:/reminer-app/mind-recharge/mind-recharge-fe/src/services/bootstrapApi.ts)

If bootstrap fails, frontend falls back to hardcoded quotes and mood response strings.

### Home

Home page combines:

- daily mood check-in
- summary data
- random quote
- healing timeline component

Files:

- [`mind-recharge-fe/src/pages/Index.tsx`](/D:/reminer-app/mind-recharge/mind-recharge-fe/src/pages/Index.tsx)
- [`mind-recharge-fe/src/components/HealingTimeline.tsx`](/D:/reminer-app/mind-recharge/mind-recharge-fe/src/components/HealingTimeline.tsx)
- [`mind-recharge-fe/src/services/homeApi.ts`](/D:/reminer-app/mind-recharge/mind-recharge-fe/src/services/homeApi.ts)
- [`mind-recharge-fe/src/services/healingApi.ts`](/D:/reminer-app/mind-recharge/mind-recharge-fe/src/services/healingApi.ts)

### Journal

- UI: [`mind-recharge-fe/src/pages/Journal.tsx`](/D:/reminer-app/mind-recharge/mind-recharge-fe/src/pages/Journal.tsx)
- API: [`mind-recharge-fe/src/services/journalApi.ts`](/D:/reminer-app/mind-recharge/mind-recharge-fe/src/services/journalApi.ts)

### Unsent messages

This is one of the most security-sensitive frontend flows.

Behavior:

- Page starts in guard/cooldown mode
- Then requires a 4-digit security password to unlock
- Backend returns a temporary unlock token
- Unlock token is stored in a separate short-lived local storage session
- Listing messages requires `X-Unlock-Token`

Files:

- UI: [`mind-recharge-fe/src/pages/UnsentMessages.tsx`](/D:/reminer-app/mind-recharge/mind-recharge-fe/src/pages/UnsentMessages.tsx)
- Session helper: [`mind-recharge-fe/src/lib/securitySession.ts`](/D:/reminer-app/mind-recharge/mind-recharge-fe/src/lib/securitySession.ts)
- API: [`mind-recharge-fe/src/services/unsentMessageApi.ts`](/D:/reminer-app/mind-recharge/mind-recharge-fe/src/services/unsentMessageApi.ts)

### No-contact tracker

- UI: [`mind-recharge-fe/src/pages/NoContactTracker.tsx`](/D:/reminer-app/mind-recharge/mind-recharge-fe/src/pages/NoContactTracker.tsx)
- API: [`mind-recharge-fe/src/services/noContactApi.ts`](/D:/reminer-app/mind-recharge/mind-recharge-fe/src/services/noContactApi.ts)

### Emotional trigger session

The emotional trigger page creates a timed cooldown session before the user acts impulsively.

- UI: [`mind-recharge-fe/src/pages/EmotionalTrigger.tsx`](/D:/reminer-app/mind-recharge/mind-recharge-fe/src/pages/EmotionalTrigger.tsx)
- API: [`mind-recharge-fe/src/services/emotionalTriggerApi.ts`](/D:/reminer-app/mind-recharge/mind-recharge-fe/src/services/emotionalTriggerApi.ts)

### Daily tasks

- UI: [`mind-recharge-fe/src/pages/DailyTasks.tsx`](/D:/reminer-app/mind-recharge/mind-recharge-fe/src/pages/DailyTasks.tsx)
- API: [`mind-recharge-fe/src/services/dailyTaskApi.ts`](/D:/reminer-app/mind-recharge/mind-recharge-fe/src/services/dailyTaskApi.ts)

### Profile

Profile manages:

- user profile update
- security password setup/change
- logout

Files:

- [`mind-recharge-fe/src/pages/Profile.tsx`](/D:/reminer-app/mind-recharge/mind-recharge-fe/src/pages/Profile.tsx)
- [`mind-recharge-fe/src/services/userApi.ts`](/D:/reminer-app/mind-recharge/mind-recharge-fe/src/services/userApi.ts)

---

## 5. Backend API surface

Main REST controllers:

- Auth: [`mind-recharge-be/src/main/java/com/sba302/reminer/module/auth/controller/AuthController.java`](/D:/reminer-app/mind-recharge/mind-recharge-be/src/main/java/com/sba302/reminer/module/auth/controller/AuthController.java)
- Bootstrap: [`mind-recharge-be/src/main/java/com/sba302/reminer/module/bootstrap/controller/BootstrapController.java`](/D:/reminer-app/mind-recharge/mind-recharge-be/src/main/java/com/sba302/reminer/module/bootstrap/controller/BootstrapController.java)
- Check-ins: [`mind-recharge-be/src/main/java/com/sba302/reminer/module/checkin/controller/CheckinController.java`](/D:/reminer-app/mind-recharge/mind-recharge-be/src/main/java/com/sba302/reminer/module/checkin/controller/CheckinController.java)
- Daily tasks: [`mind-recharge-be/src/main/java/com/sba302/reminer/module/dailytask/controller/DailyTaskController.java`](/D:/reminer-app/mind-recharge/mind-recharge-be/src/main/java/com/sba302/reminer/module/dailytask/controller/DailyTaskController.java)
- Home: [`mind-recharge-be/src/main/java/com/sba302/reminer/module/home/controller/HomeController.java`](/D:/reminer-app/mind-recharge/mind-recharge-be/src/main/java/com/sba302/reminer/module/home/controller/HomeController.java)
- Healing timeline: [`mind-recharge-be/src/main/java/com/sba302/reminer/module/healing/controller/HealingController.java`](/D:/reminer-app/mind-recharge/mind-recharge-be/src/main/java/com/sba302/reminer/module/healing/controller/HealingController.java)
- Journal: [`mind-recharge-be/src/main/java/com/sba302/reminer/module/journal/controller/JournalController.java`](/D:/reminer-app/mind-recharge/mind-recharge-be/src/main/java/com/sba302/reminer/module/journal/controller/JournalController.java)
- No-contact: [`mind-recharge-be/src/main/java/com/sba302/reminer/module/nocontact/controller/NoContactController.java`](/D:/reminer-app/mind-recharge/mind-recharge-be/src/main/java/com/sba302/reminer/module/nocontact/controller/NoContactController.java)
- Trigger sessions: [`mind-recharge-be/src/main/java/com/sba302/reminer/module/trigger/controller/TriggerSessionController.java`](/D:/reminer-app/mind-recharge/mind-recharge-be/src/main/java/com/sba302/reminer/module/trigger/controller/TriggerSessionController.java)
- Unsent messages: [`mind-recharge-be/src/main/java/com/sba302/reminer/module/unsent/controller/UnsentMessageController.java`](/D:/reminer-app/mind-recharge/mind-recharge-be/src/main/java/com/sba302/reminer/module/unsent/controller/UnsentMessageController.java)
- Users: [`mind-recharge-be/src/main/java/com/sba302/reminer/module/user/controller/UserController.java`](/D:/reminer-app/mind-recharge/mind-recharge-be/src/main/java/com/sba302/reminer/module/user/controller/UserController.java)
- Admin examples / role-protected examples: [`mind-recharge-be/src/main/java/com/sba302/reminer/module/admin/controller/AdminController.java`](/D:/reminer-app/mind-recharge/mind-recharge-be/src/main/java/com/sba302/reminer/module/admin/controller/AdminController.java)

Important public endpoints:

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `GET /api/v1/bootstrap`
- `GET /api/v1/daily-tasks/today`

Most other endpoints require JWT bearer authentication.

Swagger/OpenAPI:

- `/swagger-ui.html`
- `/api-docs`

---

## 6. Security model

### JWT auth

Backend uses stateless JWT access tokens and refresh tokens.

Relevant backend classes:

- [`mind-recharge-be/src/main/java/com/sba302/reminer/common/security/JwtAuthenticationFilter.java`](/D:/reminer-app/mind-recharge/mind-recharge-be/src/main/java/com/sba302/reminer/common/security/JwtAuthenticationFilter.java)
- [`mind-recharge-be/src/main/java/com/sba302/reminer/common/security/JwtTokenProvider.java`](/D:/reminer-app/mind-recharge/mind-recharge-be/src/main/java/com/sba302/reminer/common/security/JwtTokenProvider.java)
- [`mind-recharge-be/src/main/java/com/sba302/reminer/common/config/SecurityConfig.java`](/D:/reminer-app/mind-recharge/mind-recharge-be/src/main/java/com/sba302/reminer/common/config/SecurityConfig.java)

Frontend refresh behavior:

- Access token expiry triggers refresh flow in `apiClient.ts`
- On refresh failure, tokens are cleared and user is redirected to `/login`

### Role-based access

Backend supports at least `ADMIN` and `USER`.

Method-level auth is enabled with:

- `@EnableMethodSecurity`

Several controllers expose `/user/{userId}` or admin-protected endpoints using `@PreAuthorize`.

### Security password for unsent messages

There is a second security layer specifically for unsent messages:

- User sets a security password
- Backend verifies it
- Backend issues a short-lived unlock token
- FE stores unlock token separately
- Message listing requires `X-Unlock-Token`

This flow is implemented across:

- [`mind-recharge-be/src/main/java/com/sba302/reminer/module/user/controller/UserController.java`](/D:/reminer-app/mind-recharge/mind-recharge-be/src/main/java/com/sba302/reminer/module/user/controller/UserController.java)
- [`mind-recharge-be/src/main/java/com/sba302/reminer/module/unsent/controller/UnsentMessageController.java`](/D:/reminer-app/mind-recharge/mind-recharge-be/src/main/java/com/sba302/reminer/module/unsent/controller/UnsentMessageController.java)
- [`mind-recharge-fe/src/pages/UnsentMessages.tsx`](/D:/reminer-app/mind-recharge/mind-recharge-fe/src/pages/UnsentMessages.tsx)

---

## 7. Data model and migrations

Database is currently SQL Server, not PostgreSQL.

Current schema evolution is tracked by Flyway migrations in:

- [`mind-recharge-be/src/main/resources/db/migration`](/D:/reminer-app/mind-recharge/mind-recharge-be/src/main/resources/db/migration)

Migration intent:

- `V1`: users + refresh tokens
- `V2`: check-ins + journal
- `V3`: unsent messages + no-contact
- `V4`: daily tasks + trigger sessions
- `V5`: content items
- `V6`, `V9`: seed daily task templates
- `V7`: seed content items
- `V8`: roles table
- `V10`: mock history/admin-related seed data

Common enum/domain types live in:

- [`mind-recharge-be/src/main/java/com/sba302/reminer/common/enums`](/D:/reminer-app/mind-recharge/mind-recharge-be/src/main/java/com/sba302/reminer/common/enums)

Examples:

- `MoodLevel`
- `JournalMoodCode`
- `JourneyStatus`
- `TriggerSessionStatus`
- `UnsentMessageStatus`
- `HealingTrend`
- `UserStatus`

---

## 8. Android / Capacitor notes

The frontend is also packaged as an Android app using Capacitor.

Important files:

- [`mind-recharge-fe/capacitor.config.ts`](/D:/reminer-app/mind-recharge/mind-recharge-fe/capacitor.config.ts)
- [`mind-recharge-fe/android/app/src/main/AndroidManifest.xml`](/D:/reminer-app/mind-recharge/mind-recharge-fe/android/app/src/main/AndroidManifest.xml)
- [`mind-recharge-fe/src/lib/config.ts`](/D:/reminer-app/mind-recharge/mind-recharge-fe/src/lib/config.ts)

Important current behavior:

- Web frontend default base URL: `VITE_API_BASE_URL`
- Native Android base URL: `VITE_NATIVE_API_BASE_URL`, with fallback logic that rewrites `localhost` to `10.0.2.2`
- Capacitor Android is currently configured for `http` and cleartext because this repo is actively used in local/dev Android testing

Important warning:

- The current Capacitor settings are dev-friendly, not production-friendly
- `androidScheme: "http"`, `cleartext: true`, and `allowMixedContent: true` should be reviewed before shipping production builds

---

## 9. Environment and configuration

### Frontend

Frontend env file:

- [`mind-recharge-fe/.env`](/D:/reminer-app/mind-recharge/mind-recharge-fe/.env)

Important variables:

- `VITE_API_BASE_URL`
- `VITE_NATIVE_API_BASE_URL`

### Backend

Backend config:

- [`mind-recharge-be/src/main/resources/application.yml`](/D:/reminer-app/mind-recharge/mind-recharge-be/src/main/resources/application.yml)
- [`mind-recharge-be/.env`](/D:/reminer-app/mind-recharge/mind-recharge-be/.env)
- [`mind-recharge-be/.env.example`](/D:/reminer-app/mind-recharge/mind-recharge-be/.env.example)

Important backend runtime settings:

- `SERVER_PORT`
- `DB_USER`
- `DB_PASS`
- `JWT_SECRET`
- `JWT_ACCESS_EXPIRY_MS`
- `JWT_REFRESH_EXPIRY_DAYS`
- `CORS_ORIGINS`
- admin seed credentials

Default local assumptions:

- Backend on `http://localhost:8080`
- SQL Server on `localhost:1433`

---

## 10. How the app works end-to-end

Typical user flow:

1. User logs in or registers
2. Frontend stores access + refresh tokens
3. After authentication, frontend loads bootstrap content
4. User interacts with healing tools:
   - mood check-ins
   - journal
   - no-contact streak
   - unsent messages
   - trigger cooldown session
   - daily tasks
5. Home page aggregates progress and summary metrics
6. Healing timeline builds a broader emotional trend view from user activity/history

---

## 11. Places AI agents should start reading first

If an AI needs the fastest understanding of the codebase, start here:

1. [`mind-recharge-fe/src/App.tsx`](/D:/reminer-app/mind-recharge/mind-recharge-fe/src/App.tsx)
2. [`mind-recharge-fe/src/contexts/AuthContext.tsx`](/D:/reminer-app/mind-recharge/mind-recharge-fe/src/contexts/AuthContext.tsx)
3. [`mind-recharge-fe/src/lib/apiClient.ts`](/D:/reminer-app/mind-recharge/mind-recharge-fe/src/lib/apiClient.ts)
4. [`mind-recharge-fe/src/contexts/BootstrapContext.tsx`](/D:/reminer-app/mind-recharge/mind-recharge-fe/src/contexts/BootstrapContext.tsx)
5. [`mind-recharge-be/src/main/resources/application.yml`](/D:/reminer-app/mind-recharge/mind-recharge-be/src/main/resources/application.yml)
6. [`mind-recharge-be/src/main/java/com/sba302/reminer/common/config/SecurityConfig.java`](/D:/reminer-app/mind-recharge/mind-recharge-be/src/main/java/com/sba302/reminer/common/config/SecurityConfig.java)
7. Auth, bootstrap, unsent, user, and home controllers

If the task is feature-specific, then read:

- frontend page
- corresponding frontend service file
- backend controller
- backend service/repository under the matching module

---

## 12. Known caveats and project reality

- `project_context.txt` is partially outdated: it still mentions PostgreSQL, while current runtime config uses SQL Server
- Several admin/user cross-access endpoints appear to be examples or scaffolding, not all are fully business-complete
- Backend test coverage is minimal right now; only a basic application test is present under [`mind-recharge-be/src/test/java`](/D:/reminer-app/mind-recharge/mind-recharge-be/src/test/java)
- Frontend also has very light test coverage under [`mind-recharge-fe/src/test`](/D:/reminer-app/mind-recharge/mind-recharge-fe/src/test)
- Android native config currently prioritizes local testing convenience

---

## 13. Recommended description for future AI agents

If another AI needs a one-paragraph brief:

> Mind Recharge is a full-stack emotional recovery app with a React/TypeScript + Capacitor Android frontend and a Spring Boot + SQL Server backend. It supports JWT auth, user profiles, daily mood check-ins, journaling, unsent messages protected by a secondary security password and unlock token, no-contact streak tracking, emotional trigger cooldown sessions, daily tasks, bootstrap content delivery, and a healing timeline. The frontend is organized by page/service/context, while the backend is organized by Spring feature modules with controller/service/repository layering. Local development assumes backend on port 8080 and Android native testing may use `10.0.2.2` or LAN IP depending on environment.

