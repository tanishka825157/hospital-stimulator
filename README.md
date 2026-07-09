# Hospital Emergency Simulator

A real-time hospital emergency department simulator built with React, Vite, TypeScript, Tailwind CSS, Zustand, and optional Supabase realtime sync.

Admins operate the scenario by hand: add patients, assign doctors, manage ICU beds, dispatch ambulances, and discharge patients. Patient viewers get a read-only live dashboard with the queue, ICU, ambulance status, reports, and activity feed.

## Features

- Role-based admin and patient dashboards
- Manual patient intake with severity selection
- Priority queue ordering by severity and wait time
- Doctor, ICU bed, and ambulance controls
- Live activity feed and simulation metrics
- Demo mode that works without Supabase
- Optional Supabase auth and realtime multi-device sync

## Requirements

- Node.js 18 or newer
- npm

## Run Locally

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the local URL printed by Vite, usually:

```text
http://127.0.0.1:5173/
```

If port `5173` is already busy, Vite will automatically choose another port.

## Demo Login

The app runs in demo mode when Supabase environment variables are not configured. Use these accounts:

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@hospital.com` | `admin123` |
| Patient | `patient@hospital.com` | `patient123` |

Demo mode is local to one browser/device. For multi-device live sync, configure Supabase.

## Build

Create a production build:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## Optional Supabase Setup

1. Create a Supabase project.
2. Run the SQL in `supabase-schema.sql` from the Supabase SQL Editor.
3. Enable Realtime for the `simulation_state` table if it is not already enabled.
4. Create a `.env` file in the project root:

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

5. Restart the dev server.
6. Sign up through the app, then change the desired user role to `admin` in the Supabase `profiles` table.

## Scripts

- `npm run dev` - start the Vite development server
- `npm run build` - type-check and build for production
- `npm run preview` - preview the production build locally

