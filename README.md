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
