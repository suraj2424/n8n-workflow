// Database schema definitions
const createTablesSQL = `
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
`;

module.exports = { createTablesSQL };
