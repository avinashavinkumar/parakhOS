CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(320) UNIQUE,
  phone VARCHAR(30) UNIQUE,
  password_hash TEXT,
  role VARCHAR(30) NOT NULL CHECK (role IN ('student', 'parent', 'admin')),
  status VARCHAR(30) NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_login_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS curriculum_boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  code VARCHAR(50) NOT NULL UNIQUE,
  country VARCHAR(100),
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS curriculum_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES curriculum_boards(id) ON DELETE RESTRICT,
  grade_band VARCHAR(30) NOT NULL,
  stage VARCHAR(40) NOT NULL,
  level INTEGER NOT NULL,
  name VARCHAR(100) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (board_id, grade_band)
);

CREATE TABLE IF NOT EXISTS curriculum_subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES curriculum_boards(id) ON DELETE RESTRICT,
  code VARCHAR(80) NOT NULL,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (board_id, code)
);

CREATE TABLE IF NOT EXISTS curriculum_class_subjects (
  class_id UUID NOT NULL REFERENCES curriculum_classes(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES curriculum_subjects(id) ON DELETE CASCADE,
  PRIMARY KEY (class_id, subject_id)
);

CREATE TABLE IF NOT EXISTS curriculum_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES curriculum_subjects(id) ON DELETE RESTRICT,
  board_id UUID NOT NULL REFERENCES curriculum_boards(id) ON DELETE RESTRICT,
  code VARCHAR(100) NOT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (subject_id, code)
);

CREATE TABLE IF NOT EXISTS curriculum_subtopics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES curriculum_topics(id) ON DELETE RESTRICT,
  code VARCHAR(100) NOT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (topic_id, code)
);

CREATE TABLE IF NOT EXISTS curriculum_learning_objectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES curriculum_topics(id) ON DELETE RESTRICT,
  subtopic_id UUID REFERENCES curriculum_subtopics(id) ON DELETE SET NULL,
  bloom_level VARCHAR(50) NOT NULL DEFAULT 'UNDERSTAND',
  objective TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (topic_id, objective)
);

CREATE TABLE IF NOT EXISTS curriculum_syllabus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_grade VARCHAR(30) NOT NULL,
  stage VARCHAR(40) NOT NULL,
  subject VARCHAR(150) NOT NULL,
  subject_code VARCHAR(80) NOT NULL,
  topic VARCHAR(200) NOT NULL,
  description TEXT,
  learning_objectives TEXT,
  month VARCHAR(40),
  bloom_levels TEXT,
  imported_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (class_grade, stage, subject_code, topic, month)
);

CREATE TABLE IF NOT EXISTS question_bank_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES curriculum_classes(id) ON DELETE RESTRICT,
  subject_id UUID NOT NULL REFERENCES curriculum_subjects(id) ON DELETE RESTRICT,
  topic_id UUID NOT NULL REFERENCES curriculum_topics(id) ON DELETE RESTRICT,
  subtopic_id UUID REFERENCES curriculum_subtopics(id) ON DELETE SET NULL,
  learning_objective_id UUID REFERENCES curriculum_learning_objectives(id) ON DELETE SET NULL,
  competency_id UUID,
  item_type VARCHAR(40) NOT NULL,
  prompt TEXT NOT NULL,
  difficulty VARCHAR(20) NOT NULL,
  estimated_time_seconds INTEGER,
  options JSONB,
  correct_answer_key VARCHAR(100),
  rubric JSONB,
  expected_evidence JSONB,
  provenance VARCHAR(40) NOT NULL DEFAULT 'MANUALLY_CREATED',
  status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS question_bank_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES question_bank_questions(id) ON DELETE RESTRICT,
  version_number INTEGER NOT NULL,
  prompt TEXT NOT NULL,
  options JSONB,
  correct_answer_key VARCHAR(100),
  rubric JSONB,
  expected_evidence JSONB,
  changed_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  change_reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (question_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_question_bank_questions_topic ON question_bank_questions(topic_id, status);
CREATE INDEX IF NOT EXISTS idx_question_bank_questions_created_by ON question_bank_questions(created_by, created_at);

CREATE TABLE IF NOT EXISTS parents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE RESTRICT,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE RESTRICT,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100),
  date_of_birth DATE,
  grade VARCHAR(30),
  school_name VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS parent_student (
  parent_id UUID NOT NULL REFERENCES parents(id) ON DELETE RESTRICT,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
  relationship VARCHAR(50) NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (parent_id, student_id)
);

CREATE TABLE IF NOT EXISTS competency_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0 CHECK (display_order >= 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS competencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id UUID NOT NULL REFERENCES competency_domains(id) ON DELETE RESTRICT,
  code VARCHAR(80) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  max_score NUMERIC(6,2) NOT NULL DEFAULT 100,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(80) NOT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  status VARCHAR(30) NOT NULL DEFAULT 'draft',
  duration_minutes INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (code, version)
);

CREATE TABLE IF NOT EXISTS assessment_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE RESTRICT,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES assessment_sections(id) ON DELETE RESTRICT,
  question_type VARCHAR(40) NOT NULL,
  question_text TEXT NOT NULL,
  options JSONB,
  correct_answer JSONB,
  points NUMERIC(8,2) NOT NULL DEFAULT 0,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_required BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS question_competencies (
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE RESTRICT,
  competency_id UUID NOT NULL REFERENCES competencies(id) ON DELETE RESTRICT,
  weight NUMERIC(8,4) NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (question_id, competency_id)
);

CREATE TABLE IF NOT EXISTS assessment_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE RESTRICT,
  assessment_version INTEGER NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'started',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS assessment_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES assessment_attempts(id) ON DELETE RESTRICT,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE RESTRICT,
  answer JSONB NOT NULL,
  is_correct BOOLEAN,
  raw_score NUMERIC(8,2),
  time_spent_seconds INTEGER,
  answered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (attempt_id, question_id)
);

CREATE TABLE IF NOT EXISTS assessment_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL UNIQUE REFERENCES assessment_attempts(id) ON DELETE RESTRICT,
  raw_score NUMERIC(10,2) NOT NULL,
  max_score NUMERIC(10,2) NOT NULL,
  percentage NUMERIC(6,2) NOT NULL CHECK (percentage BETWEEN 0 AND 100),
  proficiency_level VARCHAR(30),
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  scoring_version VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS competency_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES assessment_attempts(id) ON DELETE RESTRICT,
  competency_id UUID NOT NULL REFERENCES competencies(id) ON DELETE RESTRICT,
  raw_score NUMERIC(10,2) NOT NULL,
  max_score NUMERIC(10,2) NOT NULL,
  percentage NUMERIC(6,2) NOT NULL CHECK (percentage BETWEEN 0 AND 100),
  proficiency_level VARCHAR(30),
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  scoring_version VARCHAR(50) NOT NULL,
  UNIQUE (attempt_id, competency_id)
);

CREATE TABLE IF NOT EXISTS student_competency_growth (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
  competency_id UUID NOT NULL REFERENCES competencies(id) ON DELETE RESTRICT,
  source_type VARCHAR(40) NOT NULL,
  source_id UUID,
  measured_at TIMESTAMPTZ NOT NULL,
  score NUMERIC(6,2) NOT NULL CHECK (score BETWEEN 0 AND 100),
  proficiency_level VARCHAR(30),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_attempts_student ON assessment_attempts(student_id, completed_at);
CREATE INDEX IF NOT EXISTS idx_growth_student_competency ON student_competency_growth(student_id, competency_id, measured_at);
