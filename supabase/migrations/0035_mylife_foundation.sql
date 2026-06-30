-- MyLife Foundation: personal module tables
-- Migration: 0035_mylife_foundation.sql
-- These tables are personal (per-user, not shared with household).
-- RLS: each user only sees their own rows.

-- ─────────────────────────────────────────────────────────────────────────────
-- Habits
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE habits (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid REFERENCES auth.users NOT NULL,
  name         text NOT NULL,
  description  text,
  frequency    text NOT NULL DEFAULT 'daily',  -- daily | weekly | monthly
  target_count int  NOT NULL DEFAULT 1,
  color        text,
  is_active    bool NOT NULL DEFAULT true,
  start_date   date DEFAULT CURRENT_DATE,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX habits_user_idx ON habits (user_id);
CREATE INDEX habits_active_idx ON habits (user_id, is_active);

ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "habits_owner" ON habits USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE habit_logs (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid REFERENCES auth.users NOT NULL,
  habit_id     uuid REFERENCES habits(id) ON DELETE CASCADE NOT NULL,
  logged_date  date NOT NULL DEFAULT CURRENT_DATE,
  count        int  NOT NULL DEFAULT 1,
  notes        text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (habit_id, logged_date)
);

CREATE INDEX habit_logs_habit_idx ON habit_logs (habit_id);
CREATE INDEX habit_logs_date_idx  ON habit_logs (user_id, logged_date);

ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "habit_logs_owner" ON habit_logs USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Goals
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE goals (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid REFERENCES auth.users NOT NULL,
  title         text NOT NULL,
  description   text,
  category      text NOT NULL DEFAULT 'Personal',
  target_value  numeric,
  current_value numeric DEFAULT 0,
  unit          text,
  target_date   date,
  status        text NOT NULL DEFAULT 'Active',  -- Active | Completed | Paused | Abandoned
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX goals_user_idx   ON goals (user_id);
CREATE INDEX goals_status_idx ON goals (user_id, status);

ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "goals_owner" ON goals USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Journal
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE journal_entries (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users NOT NULL,
  entry_date  date NOT NULL DEFAULT CURRENT_DATE,
  mood        text,
  mood_score  int,
  content     text,
  gratitude   text,
  photo_url   text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, entry_date)
);

CREATE INDEX journal_user_date_idx ON journal_entries (user_id, entry_date DESC);

ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "journal_owner" ON journal_entries USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Fitness — workouts & exercises
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE workouts (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid REFERENCES auth.users NOT NULL,
  name             text NOT NULL,
  workout_date     date NOT NULL DEFAULT CURRENT_DATE,
  duration_minutes int,
  workout_type     text DEFAULT 'Strength',
  notes            text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX workouts_user_date_idx ON workouts (user_id, workout_date DESC);

ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workouts_owner" ON workouts USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE workout_exercises (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid REFERENCES auth.users NOT NULL,
  workout_id       uuid REFERENCES workouts(id) ON DELETE CASCADE NOT NULL,
  name             text NOT NULL,
  sets             int,
  reps             int,
  weight_kg        numeric,
  duration_seconds int,
  distance_meters  numeric,
  notes            text,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX workout_exercises_workout_idx ON workout_exercises (workout_id);
CREATE INDEX workout_exercises_name_idx    ON workout_exercises (user_id, name);

ALTER TABLE workout_exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workout_exercises_owner" ON workout_exercises USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Health records
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE health_records (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users NOT NULL,
  record_type text NOT NULL,  -- weight | blood_pressure | body_fat | steps | sleep | heart_rate | blood_glucose | other
  value       numeric,
  value2      numeric,        -- diastolic for blood_pressure
  unit        text,
  notes       text,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX health_records_user_type_idx ON health_records (user_id, record_type, recorded_at DESC);

ALTER TABLE health_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "health_records_owner" ON health_records USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Medications
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE medications (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES auth.users NOT NULL,
  name       text NOT NULL,
  dosage     text,
  frequency  text,
  start_date date,
  end_date   date,
  notes      text,
  is_active  bool NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX medications_user_active_idx ON medications (user_id, is_active);

ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "medications_owner" ON medications USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Appointments
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE appointments (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid REFERENCES auth.users NOT NULL,
  title            text NOT NULL,
  provider         text,
  appointment_date date NOT NULL,
  appointment_time text,
  location         text,
  notes            text,
  status           text NOT NULL DEFAULT 'Upcoming',  -- Upcoming | Completed | Cancelled
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX appointments_user_date_idx ON appointments (user_id, appointment_date);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "appointments_owner" ON appointments USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Nutrition logs
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE nutrition_logs (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES auth.users NOT NULL,
  log_date   date NOT NULL DEFAULT CURRENT_DATE,
  meal_type  text NOT NULL DEFAULT 'Meal',  -- Breakfast | Lunch | Dinner | Snack | Pre-workout | Post-workout
  name       text NOT NULL,
  calories   int,
  protein_g  numeric,
  carbs_g    numeric,
  fat_g      numeric,
  notes      text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX nutrition_logs_user_date_idx ON nutrition_logs (user_id, log_date DESC);

ALTER TABLE nutrition_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "nutrition_logs_owner" ON nutrition_logs USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- updated_at triggers (reuses the existing set_updated_at function)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TRIGGER habits_updated_at          BEFORE UPDATE ON habits           FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER goals_updated_at           BEFORE UPDATE ON goals            FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER journal_entries_updated_at BEFORE UPDATE ON journal_entries  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER workouts_updated_at        BEFORE UPDATE ON workouts         FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER medications_updated_at     BEFORE UPDATE ON medications      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER appointments_updated_at    BEFORE UPDATE ON appointments     FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
