# GYMSETU — Project Context File
> Read this file at the start of every new session to get fully up to speed.

---

## What Are We Building?

**GymSetu** — A multi-tenant gym management mobile app.

A platform that allows multiple gym businesses to operate their own independent workspaces inside a single system. Each gym manages its members, payments, attendance, staff, and communication from one place. Designed for small and mid-sized gyms that currently rely on manual registers or spreadsheets.

---

## Key Decisions Made

### Platform
- **Mobile App only** — No web version for now
- Covers all user types (Owner, Staff, Member) inside the same app
- Cross-platform: iOS + Android

### Tech Stack (FIXED)
| Layer | Technology |
|---|---|
| Mobile App | React Native + Expo |
| Language | TypeScript |
| Backend | Supabase |
| Database | PostgreSQL (via Supabase) |
| Auth | Supabase Auth |
| File Storage | Supabase Storage |
| Navigation | Expo Router |
| State Management | Zustand |

### Why These Choices?
- **React Native + Expo** — Single codebase for iOS and Android. Expo's EAS Build removes the need for a Mac to publish to iOS.
- **Supabase** — Handles multi-tenancy via Row Level Security (RLS), has built-in Auth, Storage, and PostgreSQL which is perfect for relational gym data.
- **No Firebase** — Firestore is NoSQL, bad for complex relational queries like reports and financial data.

---

## User Roles

### 1. Gym Owner (Administrator)
- Full control over the gym workspace
- Manage members, plans, payments, staff, reports, settings

### 2. Staff / Trainers
- Limited access based on permissions
- View members, mark attendance, add progress notes
- Cannot access financial settings unless permitted

### 3. Gym Members (Customers)
- View their own data only
- Membership validity, attendance history, assigned plans, progress

---

## App Screen Structure

### Gym Owner Screens
| Screen | Purpose |
|---|---|
| Dashboard | Overview — members, revenue, renewals, attendance |
| Members List | Search, filter, add new member |
| Member Profile | Full details, payments, attendance, plans |
| Membership Plans | Create & manage plans |
| Payments | Record payments, view overdue |
| Attendance | Mark & view attendance |
| Staff Management | Add staff, assign roles |
| Reports | Revenue, attendance trends |
| Gym Settings | Gym name, logo, contact details |

### Staff Screens
| Screen | Purpose |
|---|---|
| Dashboard (limited) | Quick actions only |
| Members List | View & search |
| Attendance | Mark daily check-ins |
| Member Profile | View details, add notes |

### Member Screens
| Screen | Purpose |
|---|---|
| My Membership | Plan, validity, status |
| My Attendance | Personal history |
| My Payments | Payment history |
| My Progress | Trainer notes, metrics |

---

## Build Phases

### Phase 1 — Core MVP (Build This First)
- [ ] Database schema design (Supabase)
- [ ] Project setup (React Native + Expo)
- [ ] Auth flow (login, registration, role-based routing)
- [ ] Gym owner registration + gym workspace creation
- [ ] Member management (add, view, edit, search)
- [ ] Membership plans (create, assign to members)
- [ ] Payment recording (offline, manual entry)
- [ ] Attendance marking & history
- [ ] Basic owner dashboard

### Phase 2
- [ ] Receipt generation (viewable, printable, shareable)
- [ ] Membership expiry alerts & renewal reminders
- [ ] Reports (revenue, attendance trends)
- [ ] Trainer tools (workout plans, diet plans, progress notes)

### Phase 3
- [ ] Member-facing app features (full experience)
- [ ] Communication & reminders (renewal alerts, announcements)
- [ ] Advanced analytics
- [ ] Progress photos upload

---

## Build Order (Step by Step)

1. **Database Schema** — Design all Supabase tables and relationships first
2. **Project Setup** — Initialize React Native + Expo project
3. **Auth Flow** — Login, registration, role-based navigation
4. **Owner Dashboard** — Core layout and overview
5. **Member Management** — CRUD for members
6. **Plans & Payments** — Membership plans, payment recording
7. **Attendance** — Mark and track
8. **Staff & Member Flows** — Secondary user experiences

---

## Current Status

- [x] Product vision defined
- [x] Platform decision made (Mobile only)
- [x] Tech stack finalized
- [x] App structure and screens mapped
- [x] Build phases defined
- [ ] **NEXT STEP: Design the database schema**

---

## Important Context

- Solo developer building this with Claude as assistant
- Build one thing at a time, no rushing
- Explain the "why" behind decisions, not just the "what"
- Foundation first — get the database schema right before writing app code
- No online payment processing needed initially — payments are recorded manually (offline)
- Receipt generation required after payment recording
- Member-facing features are optional/secondary priority

---

## Database Tables (To Be Designed)

This section will be filled in once we complete the database schema design session.

Tables expected:
- gyms
- users
- gym_members (staff + owners)
- members (gym customers)
- membership_plans
- member_plans (assigned plans)
- payments
- attendance
- trainer_notes
- workout_plans
- diet_plans

---

*Last updated: Session 1 — Tech stack and structure finalized. Next session starts with database schema design.*
