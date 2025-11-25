# Alcovia - Intervention Engine

A full-stack system that detects when students are falling behind and automatically triggers a mentorship intervention loop.

## Tech Stack

- **Backend**: Node.js + Express + Supabase (PostgreSQL)
- **Frontend**: React Native (Expo) with Web support
- **Automation**: n8n workflow for mentor notifications
- **Deployment**: Backend on Render, Frontend on Vercel/Expo

---

## Project Structure

```
├── Backend/          # Node.js API server
├── Frontend/         # React Native (Expo) app
├── n8n_Workflow/     # n8n automation workflows
└── README.md
```

---

# Backend Setup

## Database Setup (One-Time)

### Option 1: Quick Setup (Recommended)
Run this command to get the SQL you need:
```bash
npm run setup-db
```

Copy the output and paste it into your Supabase SQL Editor, then click "Run".

### Option 2: Manual Setup
Copy this SQL and run it in Supabase SQL Editor:

```sql
-- Students table
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  status TEXT DEFAULT 'normal' CHECK (status IN ('normal', 'locked', 'remedial')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Daily logs table
CREATE TABLE IF NOT EXISTS daily_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  quiz_score INTEGER NOT NULL CHECK (quiz_score >= 0 AND quiz_score <= 10),
  focus_minutes INTEGER NOT NULL CHECK (focus_minutes >= 0),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Interventions table
CREATE TABLE IF NOT EXISTS interventions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  task TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  assigned_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_daily_logs_student_id ON daily_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_daily_logs_created_at ON daily_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_interventions_student_id ON interventions(student_id);
CREATE INDEX IF NOT EXISTS idx_interventions_status ON interventions(status);
```

## Running the Server

```bash
npm run dev
```

The server will automatically check if tables exist on startup. If they don't, it will show you the SQL to run.

## Environment Variables

Create a `.env` file with:
```
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
n8n_URL=your_n8n_url
PORT=3000
```

## Schema Overview

### Students Table
- `id`: UUID (auto-generated)
- `name`: Student name
- `status`: 'normal' | 'locked' | 'remedial'
- `created_at`, `updated_at`: Timestamps

### Daily Logs Table
- `id`: UUID (auto-generated)
- `student_id`: Foreign key to students
- `quiz_score`: Integer (0-10)
- `focus_minutes`: Integer (>= 0)
- `created_at`: Timestamp

### Interventions Table
- `id`: UUID (auto-generated)
- `student_id`: Foreign key to students
- `task`: Intervention task description
- `status`: 'pending' | 'completed' | 'cancelled'
- `assigned_at`, `completed_at`: Timestamps

## API Endpoints

### Student Management
- `POST /students` - Create a new student
- `GET /students` - List all students
- `GET /status/:id` - Get student status

### Daily Check-in
- `POST /daily-checkin` - Submit daily quiz score and focus time
  - Success (score > 7 AND focus > 60): Returns "On Track"
  - Failure: Locks student and triggers n8n webhook

### Interventions
- `POST /assign-intervention` - Assign remedial task (called by n8n)
- `POST /mark-complete` - Mark intervention complete

See `Backend/API_TESTING.md` for detailed examples.

---

# Frontend Setup

## Prerequisites

- Node.js 18+ installed
- Expo CLI (installed automatically with dependencies)

## Installation

```bash
cd Frontend
npm install
```

## Configuration

Update the API URL in `Frontend/app/index.tsx`:

```typescript
const API_URL = "https://your-backend-url.com";
```

## Running the App

### Web (Recommended for testing)
```bash
npm run web
```
Opens at `http://localhost:8081`

### Mobile Development
```bash
npm start
```
Then:
- Press `w` for web
- Press `a` for Android emulator
- Press `i` for iOS simulator
- Scan QR code with Expo Go app on your phone

## Building for Production

### Web Deployment
```bash
npx expo export --platform web
```
Output in `dist/` folder - deploy to Vercel, Netlify, or any static host.

### Mobile Build
```bash
# Android
npx eas build --platform android

# iOS
npx eas build --platform ios
```

## App Features

### Three States:

1. **Normal State** (🟢)
   - Submit daily quiz score (0-10)
   - Log focus minutes
   - If score > 7 AND focus > 60: Stay on track

2. **Locked State** (🔒)
   - Triggered when performance drops
   - All features disabled
   - Polls server every 5 seconds
   - Waits for mentor intervention

3. **Remedial State** (📚)
   - Shows assigned task from mentor
   - Student can mark task complete
   - Returns to normal state after completion

---

# n8n Workflow Setup

1. Create a new workflow in n8n
2. Add a Webhook trigger: `/webhook/student-failed`
3. Add notification node (Email/Slack)
4. Add "Wait for Webhook" node for mentor approval
5. Add HTTP Request node to call `/assign-intervention`

See `n8n_Workflow/` folder for workflow JSON.

---

# Deployment

## Backend (Render)

1. Connect your GitHub repo to Render
2. Set environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `n8n_URL`
   - `PORT`
3. Deploy from `Backend/` directory

## Frontend (Vercel)

1. Connect repo to Vercel
2. Set build command: `cd Frontend && npm run web`
3. Set output directory: `Frontend/dist`
4. Deploy

## Database (Supabase)

1. Create project at supabase.com
2. Run SQL from `npm run setup-db`
3. Copy URL and service role key to backend `.env`

---

# Testing the System

1. **Start Backend**: `cd Backend && npm run dev`
2. **Start Frontend**: `cd Frontend && npm run web`
3. **Create Student**: Use the app or call `POST /students`
4. **Submit Check-in**: Enter low scores to trigger lock
5. **Check n8n**: Verify webhook received
6. **Assign Task**: Mentor approves in n8n
7. **Complete Task**: Student marks complete in app

---

# Troubleshooting

## Backend Issues
- Run `npm run test-db` to verify database connection
- Check server logs for detailed error messages
- Verify all environment variables are set

## Frontend Issues
- Clear Expo cache: `npx expo start -c`
- Verify API_URL points to your backend
- Check browser console for errors

## Database Issues
- Ensure tables are created (run setup SQL)
- Check Supabase logs for query errors
- Verify UUIDs are being used (not simple numbers like "123")

---

# License

MIT
