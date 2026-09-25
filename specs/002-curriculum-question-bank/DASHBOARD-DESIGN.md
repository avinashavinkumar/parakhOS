# Admin Dashboard Design: Curriculum & Question Bank Management

**Date**: 2026-08-20 | **Version**: 1.0 | **Status**: Design Concept

**Purpose**: Provide educators and curriculum coordinators with a visual, intuitive interface to manage curriculum structure and the question bank without requiring API expertise.

---

## Dashboard Architecture

### User Roles & Permissions

| Role | Curriculum | Questions | Bulk Import | Settings |
|------|-----------|-----------|------------|----------|
| **Admin** | View, Import, Edit, Archive | View, Create, Edit, Approve, Delete | Initiate, View, Retry | Full access |
| **Curriculum Coordinator** | View, Edit, Archive | View, Create, Edit, Approve | Initiate, View | Limited |
| **Educator** | View Only | View, Create, Edit | Request (via coordinator) | None |
| **Viewer** | View Only | View Only | None | None |

---

## Page 1: Dashboard Home / Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  📚 Question Bank Dashboard                     [v 1.0]  👤 Admin │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Quick Stats Panel                                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────┐│
│  │ 📖 Classes   │  │ 📑 Subjects  │  │ 📝 Questions │  │📊Recent│
│  │      10      │  │      35      │  │    1,245     │  │  Imp.  │
│  │   Active     │  │   Active     │  │   Active     │  │   42   │
│  └──────────────┘  └──────────────┘  └──────────────┘  └────────┘
│
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────┐│
│  │ 📥 Imports   │  │⏳ In Progress│  │ ✅ AI Assist │  │🚩 Flags│
│  │      5       │  │      1       │  │      28      │  │   3    │
│  │   Completed  │  │  Processing  │  │  Approved    │  │  Issues│
│  └──────────────┘  └──────────────┘  └──────────────┘  └────────┘
│
│  Action Buttons
│  ┌─────────────────────────────────────────────────────────────┐
│  │  [+ New Question] [📤 Bulk Import CSV] [📋 Curriculum Import]│
│  │  [📊 Analytics]   [⚙️  Settings]        [📖 View Drafts]   │
│  └─────────────────────────────────────────────────────────────┘
│
│  Recent Activity Feed
│  ┌─────────────────────────────────────────────────────────────┐
│  │ 🆕 Sarah created 5 new MCQs for Class V Math (30 min ago)   │
│  │ ✅ Admin approved "Addition Strategies" (1 hour ago)        │
│  │ 📥 Bulk import completed: 248 questions (2 hours ago)       │
│  │ 🔄 Question versioning: "Fractions" v2 updated by John      │
│  │ 🚩 Question flagged: "Geometry Q-45" - needs review         │
│  └─────────────────────────────────────────────────────────────┘
│
└─────────────────────────────────────────────────────────────────┘
```

---

## Page 2: Curriculum Management

### 2.1 Curriculum Structure Browser

```
┌─────────────────────────────────────────────────────────────────┐
│  📖 Curriculum Structure                  [🔍 Search] [Import ▼] │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Board: [CBSE ▼]  Stage: [All ▼]  Filter Active Only ☑           │
│
│  Curriculum Hierarchy (Tree View)
│  ┌─────────────────────────────────────────────────────────────┐
│  │ ▶ CBSE (Indian Standard)                                    │
│  │   ▶ Class III (Primary)                [📊 30 topics]       │
│  │   ▼ Class V (Primary)                  [📊 45 topics]       │
│  │     ▶ Mathematics                      [📊 12 topics]       │
│  │       ▶ Numbers & Operations           [📊 3 topics]        │
│  │         ▼ Whole Numbers                                      │
│  │           • Addition with Carry-Over   [5 LO] [18 Q's]      │
│  │           • Subtraction with Borrow    [3 LO] [12 Q's]      │
│  │           • Multiplication Facts       [4 LO] [22 Q's]      │
│  │       ▶ Fractions                      [📊 3 topics]        │
│  │     ▶ English Language                 [📊 8 topics]        │
│  │     ▶ Science                          [📊 10 topics]       │
│  │   ▶ Class VI (Middle)                  [📊 50 topics]       │
│  │   ▶ Class VII (Middle)                 [📊 52 topics]       │
│  │                                                               │
│  │ [+ Add Board] [+ Add Class] [+ Add Subject]                 │
│  │ [+ Add Topic] [+ Add SubTopic]                               │
│  │                                                               │
│  └─────────────────────────────────────────────────────────────┘
│
│  Right Panel: Topic Details (on click)
│  ┌─────────────────────────────────────────────────────────────┐
│  │ Topic: "Whole Numbers"                                       │
│  │ Subject: Mathematics | Class: V                              │
│  │ Status: Active                                               │
│  │ Learning Objectives: 5                                       │
│  │ Associated Questions: 18 (ACTIVE)                            │
│  │ Created: 2026-06-15 | Updated: 2026-08-10                   │
│  │                                                               │
│  │ [Edit] [Archive] [View Questions] [Add Learning Objective]  │
│  └─────────────────────────────────────────────────────────────┘
│
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Curriculum Import Modal

```
┌─────────────────────────────────────────────────────────────────┐
│  📥 Import Curriculum Structure                                ✕ │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Board: [CBSE ▼]                                                 │
│                                                                   │
│  Merge Strategy:                                                 │
│  ⦿ Keep Old (add new, ignore duplicates)                        │
│  ◯ Replace (overwrite existing)                                 │
│  ◯ Version (archive old, create new version)                    │
│                                                                   │
│  Upload File:                                                    │
│  ┌─────────────────────────────────────────────────────────────┐
│  │ Drop CSV/JSON file here or click to browse                  │
│  │  [Choose File...]                                            │
│  └─────────────────────────────────────────────────────────────┘
│
│  📋 File Format Example:
│  ┌─────────────────────────────────────────────────────────────┐
│  │ classGrade,stage,subject,topic,subtopic,learningObjectives │
│  │ V,MIDDLE,Mathematics,Whole Numbers,Addition with Carry,    │
│  │   Students add multi-digit numbers|Students use commutativity
│  │                                                               │
│  │ [View CSV Template]  [View JSON Schema]                      │
│  └─────────────────────────────────────────────────────────────┘
│
│  [Cancel] [Preview] [Import →]
│
└─────────────────────────────────────────────────────────────────┘
```

---

## Page 3: Question Bank Management

### 3.1 Question List & Search

```
┌─────────────────────────────────────────────────────────────────┐
│  ❓ Question Bank                     [🔍 Search] [+ New] [Import ▼]│
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Filters:                                                         │
│  Class: [All ▼] Subject: [All ▼] Topic: [All ▼]                 │
│  Competency: [All ▼] Difficulty: [All ▼] Status: [ACTIVE ▼]     │
│  Provenance: [All ▼]                                             │
│  [Reset Filters]                                                 │
│
│  Results: 847 questions  |  Show per page: [20 ▼]  Page 1 of 43
│
│  Question Table
│  ┌──────────────────────────────────────────────────────────────┐
│  │ ☑                                                              │
│  ├──────────────────────────────────────────────────────────────┤
│  │ # │ Prompt / Title                          │ Meta │ Status  │
│  ├──────────────────────────────────────────────────────────────┤
│  │ 1 │ What is 5 + 7?                          │      │ ✅ ACTV│
│  │   │ MCQ | Class V | Math | Whole Num. | E  │ v2   │         │
│  │   │ Created by: Sarah (2026-08-15)          │      │ 🔗 Used│
│  │   │ Created: 2026-08-15 | Updated: 2026-08-18     │ in 3 A │
│  │   │ [View] [Edit] [Versions] [Archive]     │      │         │
│  ├──────────────────────────────────────────────────────────────┤
│  │ 2 │ Solve: 23 + 47 = ?                      │      │ ✅ ACTV│
│  │   │ MCQ | Class V | Math | Whole Num. | M  │ v1   │         │
│  │   │ Created by: John (2026-08-10)           │      │ 🔗 Used│
│  │   │ [View] [Edit] [Versions] [Archive]     │      │ in 2 A │
│  ├──────────────────────────────────────────────────────────────┤
│  │ 3 │ Short Answer: Explain addition with carry │      │ 📝 DRF│
│  │   │ SA | Class V | Math | Whole Num. | M   │ v1   │ Review │
│  │   │ Created by: Maya (2026-08-12)           │      │         │
│  │   │ [View] [Edit] [Approve/Reject] [Archive]     │         │
│  ├──────────────────────────────────────────────────────────────┤
│  │ 4 │ 🤖 AI Assisted: Fraction division       │      │ 👁 REVW│
│  │   │ MCQ | Class VI | Math | Fractions | M  │ v1   │ AI Gen │
│  │   │ AI Generated for: Dividing Fractions LO │      │         │
│  │   │ [Preview] [Approve/Reject] [Archive]    │      │         │
│  │   │ Generated: 2026-08-20 08:15              │      │         │
│  ├──────────────────────────────────────────────────────────────┤
│  │ 5 │ Multiple Choice: Identify odd number    │      │ 🚩 FLAG│
│  │   │ MCQ | Class III | Math | Numbers | E    │ v3   │ Issue  │
│  │   │ Issue: Ambiguous wording (reported by Sarah)  │         │
│  │   │ [View] [Edit] [Resolve] [Archive]      │      │         │
│  ├──────────────────────────────────────────────────────────────┤
│  │  ☑ Select 2 more...                                          │
│  │  [Bulk Actions:] [Approve All] [Archive Selected] [Move to Bank ▼]
│  └──────────────────────────────────────────────────────────────┘
│
│  [◀ Prev]  [1] [2] [3] ... [43]  [Next ▶]
│
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Create/Edit Question Form

```
┌─────────────────────────────────────────────────────────────────┐
│  ✏️ Create New Question                                        ✕ │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  BASIC INFORMATION                                                │
│  ┌─────────────────────────────────────────────────────────────┐
│  │ Question Type: [MCQ ▼]                                       │
│  │                                                               │
│  │ Prompt (Question Text):                                      │
│  │ ┌─────────────────────────────────────────────────────────┐
│  │ │ What is 5 + 7?                                          │
│  │ └─────────────────────────────────────────────────────────┘
│  │
│  │ Difficulty: [EASY ▼]  Estimated Time: [30] seconds         │
│  │                                                               │
│  └─────────────────────────────────────────────────────────────┘
│
│  CURRICULUM MAPPING                                               │
│  ┌─────────────────────────────────────────────────────────────┐
│  │ Class: [V ▼]  Subject: [Mathematics ▼]  Topic: [Whole Numbers ▼]
│  │ SubTopic: [Addition with Carry-Over ▼]                      │
│  │ Learning Objective: [Students add multi-digit numbers ▼]    │
│  │                                                               │
│  └─────────────────────────────────────────────────────────────┘
│
│  COMPETENCY MAPPING                                               │
│  ┌─────────────────────────────────────────────────────────────┐
│  │ Primary Competency: [PROBLEM_SOLVING ▼]                     │
│  │ Sub-Competency: [Numerical Reasoning ▼]                     │
│  │ Tags: [+] [Math] [Arithmetic] [Foundational]                │
│  │                                                               │
│  └─────────────────────────────────────────────────────────────┘
│
│  QUESTION OPTIONS (MCQ)                                           │
│  ┌─────────────────────────────────────────────────────────────┐
│  │ A) [10      ] [Correct Answer ◯]  [Delete]                  │
│  │ B) [12      ] [Correct Answer ◯] ◉ [Delete]                  │
│  │ C) [13      ] [Correct Answer ◯]  [Delete]                  │
│  │ D) [14      ] [Correct Answer ◯]  [Delete]                  │
│  │                                                               │
│  │ [+ Add Option]                                               │
│  │                                                               │
│  └─────────────────────────────────────────────────────────────┘
│
│  RUBRIC & EVIDENCE                                                │
│  ┌─────────────────────────────────────────────────────────────┐
│  │ Points: [1] (Total)                                          │
│  │                                                               │
│  │ Scoring Criteria:                                             │
│  │ □ Correct answer selected: 1 point                           │
│  │ □ [Add criterion]                                            │
│  │                                                               │
│  │ Expected Evidence:                                            │
│  │ □ Student selects option B                                   │
│  │ □ [Add evidence]                                             │
│  │                                                               │
│  └─────────────────────────────────────────────────────────────┘
│
│  NOTES & METADATA                                                 │
│  ┌─────────────────────────────────────────────────────────────┐
│  │ Notes/Context:                                               │
│  │ ┌─────────────────────────────────────────────────────────┐
│  │ │ Example: Can use base-10 blocks or number lines        │
│  │ └─────────────────────────────────────────────────────────┘
│  │                                                               │
│  │ Question Bank: [My Question Bank ▼]                          │
│  │                                                               │
│  │ Provenance: [MANUALLY_CREATED ▼]                             │
│  │                                                               │
│  └─────────────────────────────────────────────────────────────┘
│
│  [Save as Draft] [Save & Approve] [Preview] [Cancel]
│
└─────────────────────────────────────────────────────────────────┘
```

### 3.3 Question Version History

```
┌─────────────────────────────────────────────────────────────────┐
│  📜 Question Version History: "What is 5 + 7?"                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Current Version: 2 (ACTIVE)                                     │
│
│  Version Timeline                                                 │
│  ┌─────────────────────────────────────────────────────────────┐
│  │ ● v2 (Current) - 2026-08-18 10:15 - Sarah                   │
│  │   Change: Improved clarity                                   │
│  │   "What is the sum of 5 and 7?"                              │
│  │   [View Full] [Revert to v1] [Compare]                       │
│  │                                                               │
│  │ ●─────● v1 (Original) - 2026-08-15 14:30 - John              │
│  │        Change: Initial creation                              │
│  │        "What is 5 + 7?"                                      │
│  │        [View Full] [Compare]                                 │
│  │                                                               │
│  └─────────────────────────────────────────────────────────────┘
│
│  Comparison View (v1 vs v2)
│  ┌─────────────────────────────────────────────────────────────┐
│  │ Prompt:                                                      │
│  │   v1: "What is 5 + 7?"                                       │
│  │   v2: "What is the sum of 5 and 7?"  ← Changed              │
│  │                                                               │
│  │ Difficulty:                                                  │
│  │   v1: EASY                                                   │
│  │   v2: EASY  (no change)                                      │
│  │                                                               │
│  │ Rubric:                                                       │
│  │   v1: 1 criterion                                            │
│  │   v2: 1 criterion (no change)                                │
│  │                                                               │
│  └─────────────────────────────────────────────────────────────┘
│
│  [Back] [Close]
│
└─────────────────────────────────────────────────────────────────┘
```

---

## Page 4: Bulk Import Management

### 4.1 Bulk Import Upload

```
┌─────────────────────────────────────────────────────────────────┐
│  📤 Bulk Import Questions from CSV                             ✕ │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Upload CSV File:                                                 │
│  ┌─────────────────────────────────────────────────────────────┐
│  │                                                               │
│  │     📁 Drop CSV file here or click to browse               │
│  │                                                               │
│  │          [Choose File...]                                   │
│  │                                                               │
│  │     Max file size: 50MB                                      │
│  │     Supported formats: CSV, JSON                             │
│  │                                                               │
│  └─────────────────────────────────────────────────────────────┘
│
│  CSV Format:
│  ┌─────────────────────────────────────────────────────────────┐
│  │ Required columns:                                             │
│  │ • prompt (question text)                                     │
│  │ • itemType (MCQ, SHORT_ANSWER, REFLECTION, etc.)             │
│  │ • class (class name or ID)                                   │
│  │ • subject (subject name or ID)                               │
│  │ • topic (topic name or ID)                                   │
│  │ • competency (competency name or ID)                         │
│  │ • correctAnswerKey (A, B, C, D for MCQ)                      │
│  │                                                               │
│  │ Optional columns:                                             │
│  │ • subTopic, difficulty, estimatedTimeSeconds, rubric         │
│  │                                                               │
│  │ [Download CSV Template]  [View Example CSV]  [JSON Format]   │
│  │                                                               │
│  └─────────────────────────────────────────────────────────────┘
│
│  [Cancel] [Next: Preview →]
│
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Bulk Import Progress & Status

```
┌─────────────────────────────────────────────────────────────────┐
│  📊 Import Status: questions-batch-001.csv                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Import ID: 2f8d4c9a-7b3e-4f1a-9c2e-8a5d6b7c1e9f              │
│  Status: 🔄 IN_PROGRESS  (Processing 150 / 250 rows)            │
│  Progress: ████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░  60%        │
│  Elapsed: 2:45  |  Estimated remaining: 1:50                    │
│
│  Real-time Stats
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────┐
│  │ ✅ Success   │  │ ⚠️ Warning   │  │ ❌ Error     │  │ ⏭ Skip │
│  │     142      │  │       6      │  │       2      │  │   0    │
│  └──────────────┘  └──────────────┘  └──────────────┘  └────────┘
│
│  Processing Log (Recent Events)
│  ┌─────────────────────────────────────────────────────────────┐
│  │ [02:42] Row 148: ✅ Question created (Class V, Math, MCQ)  │
│  │ [02:41] Row 147: ✅ Question created (Class V, Math, MCQ)  │
│  │ [02:40] Row 146: ⚠️ Warning: Ambiguous class name "V" or    │
│  │        "Class V" - resolved to Class V (ID: ...)            │
│  │ [02:39] Row 145: ✅ Question created (Class VI, English)   │
│  │ [02:38] Row 144: ❌ Error: Competency "UNKNOWN_COMP" not    │
│  │        found - Check competency name in row 144              │
│  │ [02:35] Row 1-143: Batch 1 processed successfully            │
│  │                                                               │
│  │ [Show All Errors] [Show All Warnings]                        │
│  │                                                               │
│  └─────────────────────────────────────────────────────────────┘
│
│  [Pause] [Cancel Import] [Minimize]
│
└─────────────────────────────────────────────────────────────────┘
```

### 4.3 Import Summary & Error Report

```
┌─────────────────────────────────────────────────────────────────┐
│  📋 Import Summary: questions-batch-001.csv                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Status: ✅ COMPLETED (with 2 errors)                            │
│  Completed: 2026-08-20 10:05:30                                  │
│
│  Summary Stats
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────┐
│  │ 📊 Total     │  │ ✅ Success   │  │ ❌ Errors    │  │ ⚠️ Warn│
│  │     250      │  │     248      │  │       2      │  │   6    │
│  └──────────────┘  └──────────────┘  └──────────────┘  └────────┘
│
│  Success Rate: 99.2% ✅
│
│  Error Details
│  ┌─────────────────────────────────────────────────────────────┐
│  │ ❌ Row 45: Invalid itemType "MCQMultiple"                   │
│  │    Suggestion: Use one of: MCQ, SHORT_ANSWER, REFLECTION   │
│  │    [Download Fix Template] [Retry Row]                      │
│  │                                                               │
│  │ ❌ Row 127: Competency "UNKNOWN_COMPETENCY" not found       │
│  │    Available competencies: PROBLEM_SOLVING, PRECISION, ...  │
│  │    [Download Fix Template] [Retry Row]                      │
│  │                                                               │
│  │ ⚠️  6 warnings (ambiguous class/subject/topic names)         │
│  │    [Show Warnings] [Download Detailed Report]               │
│  │                                                               │
│  └─────────────────────────────────────────────────────────────┘
│
│  Next Steps:
│  ┌─────────────────────────────────────────────────────────────┐
│  │ □ Fix errors and resubmit failed rows only                  │
│  │ □ View all 248 imported questions                            │
│  │ □ Review & approve questions in DRAFT status                │
│  │ □ Download detailed error report (CSV or PDF)               │
│  │                                                               │
│  │ [View Imported Questions] [Download Report] [Retry Errors] │
│  │                                                               │
│  └─────────────────────────────────────────────────────────────┘
│
│  [Back] [Close]
│
└─────────────────────────────────────────────────────────────────┘
```

---

## Page 5: AI-Assisted Question Generation (Phase 2)

```
┌─────────────────────────────────────────────────────────────────┐
│  🤖 AI Question Generation                                     ✕ │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  GENERATION REQUEST                                               │
│  ┌─────────────────────────────────────────────────────────────┐
│  │ Learning Objective: [Students add multi-digit numbers ▼]   │
│  │ Curriculum Path:                                             │
│  │   Class V > Mathematics > Whole Numbers > Addition...       │
│  │                                                               │
│  │ Competency: [PROBLEM_SOLVING ▼]                             │
│  │ Question Type: [MCQ ▼]                                      │
│  │ Number to Generate: [5]                                      │
│  │ Difficulty Mix:                                              │
│  │   ◉ Auto (system decides)                                   │
│  │   ◯ Custom: [2 EASY] [2 MEDIUM] [1 HARD]                   │
│  │                                                               │
│  │ Custom Instructions (optional):                              │
│  │ ┌─────────────────────────────────────────────────────────┐
│  │ │ Include real-world contexts where possible. Avoid       │
│  │ │ numbers above 100. Use base-10 blocks visualization    │
│  │ └─────────────────────────────────────────────────────────┘
│  │                                                               │
│  └─────────────────────────────────────────────────────────────┘
│
│  [Cancel] [Generate →]
│
└─────────────────────────────────────────────────────────────────┘

[After Generation - Approval Interface]

┌─────────────────────────────────────────────────────────────────┐
│  👁️ Review AI-Generated Questions                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Generated 5 questions for "Addition with Carry-Over"            │
│  Confidence Scores: High (4.8/5), Medium (4.2/5), High (4.7/5)   │
│
│  Question 1/5
│  ┌─────────────────────────────────────────────────────────────┐
│  │ Prompt: In a store, there are 45 apples on one shelf and   │
│  │ 38 apples on another. How many apples are there in total?  │
│  │                                                               │
│  │ Options:                                                     │
│  │ A) 73   B) 83 (Correct) C) 93  D) 103                       │
│  │                                                               │
│  │ Difficulty: MEDIUM | Confidence: 4.8/5                      │
│  │ Alignment: Learning Objective: "Students add multi-digit"   │
│  │                                                               │
│  │ [👍 Approve] [✏️ Edit] [👎 Discard]  [Next →]              │
│  │                                                               │
│  └─────────────────────────────────────────────────────────────┘
│
│  Progress: [■■■■□] 4/5 approved
│
│  [Bulk Actions: Approve All] [Discard All] [Save Progress]
│
└─────────────────────────────────────────────────────────────────┘
```

---

## Page 6: Analytics & Insights

```
┌─────────────────────────────────────────────────────────────────┐
│  📊 Question Bank Analytics                                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Coverage Analysis
│  ┌──────────────────────────────────────────────────────────────┐
│  │ Questions by Class                  │ Questions by Subject    │
│  │ ┌─────────────────────────────────┐ │ ┌─────────────────────┐│
│  │ │ Class V:  ████████ 245 (19.6%)  │ │ │ Math:   ██████ 380  ││
│  │ │ Class VI: ███████  198 (15.9%)  │ │ │ English: ████ 210   ││
│  │ │ Class VII: ███████  210 (16.9%) │ │ │ Science: ███ 150    ││
│  │ │ Class VIII: ██████  165 (13.2%) │ │ │ Other:   ██ 100     ││
│  │ │ Class III: ████     95 (7.6%)   │ │ │                     ││
│  │ │ ...                              │ │ │ Coverage: 840 total ││
│  │ └─────────────────────────────────┘ │ └─────────────────────┘│
│  └──────────────────────────────────────────────────────────────┘
│
│  Questions by Difficulty
│  ┌──────────────────────────────────────────────────────────────┐
│  │  EASY: ██████████ 420 (33.7%)                                 │
│  │  MEDIUM: ████████ 580 (46.5%)                                 │
│  │  HARD: ████ 245 (19.7%)                                       │
│  └──────────────────────────────────────────────────────────────┘
│
│  Questions by Competency
│  ┌──────────────────────────────────────────────────────────────┐
│  │ PROBLEM_SOLVING:     ██████████ 450 (36.1%)                  │
│  │ CRITICAL_THINKING:   ███████ 320 (25.7%)                     │
│  │ COMMUNICATION:       ████ 150 (12.0%)                        │
│  │ COLLABORATION:       ███ 120 (9.6%)                          │
│  │ CREATIVITY:          ██ 85 (6.8%)                            │
│  │ SELF_MANAGEMENT:     █ 70 (5.6%)                             │
│  │ PRECISION:           █ 45 (3.6%)                             │
│  │ Other:               █ 15 (1.2%)                             │
│  └──────────────────────────────────────────────────────────────┘
│
│  Coverage Gaps
│  ┌──────────────────────────────────────────────────────────────┐
│  │ Topics with <5 questions:                                     │
│  │ • Class IV, Mathematics, Geometry (2 questions) ⚠️             │
│  │ • Class III, Science, Water Bodies (3 questions) ⚠️            │
│  │ • Class VII, English, Poetry (1 question) 🔴                  │
│  │                                                               │
│  │ [Request AI Generation] [Create Manually] [View Full List]   │
│  │                                                               │
│  └──────────────────────────────────────────────────────────────┘
│
│  Recent Imports & Performance
│  ┌──────────────────────────────────────────────────────────────┐
│  │ Import Date    │ File Name          │ Success │ Errors │ Avg │
│  │────────────────────────────────────────────────────────────────│
│  │ 2026-08-20     │ batch-001.csv      │ 248     │ 2      │ 99% │
│  │ 2026-08-18     │ batch-002.csv      │ 156     │ 0      │ 100%│
│  │ 2026-08-15     │ ncert-cbse.csv     │ 450     │ 5      │ 98% │
│  └──────────────────────────────────────────────────────────────┘
│
└─────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack Recommendations

### Frontend
- **Framework**: Vue.js 3 or React 18
- **UI Component Library**: Vuetify, Ant Design, or Material UI
- **State Management**: Pinia (Vue) or Redux (React)
- **HTTP Client**: Axios or Fetch API
- **File Upload**: Dropzone.js or similar
- **Charting**: Chart.js or ApexCharts for analytics
- **Form Handling**: Formik or React Hook Form

### Backend (Already Defined in Tasks)
- NestJS for API
- BullMQ for async jobs
- PostgreSQL for persistence

### Deployment
- Docker containers
- Kubernetes or managed container service
- S3-compatible storage for file uploads

---

## User Experience Principles

1. **Clear Navigation**: Users can move between curriculum, questions, imports, and analytics intuitively
2. **Minimal Friction**: Actions like "Create Question" or "Upload CSV" are 1-2 clicks away
3. **Real-time Feedback**: Import progress shown live; questions validated instantly
4. **Error Clarity**: Specific, actionable error messages with suggestions
5. **Powerful Search**: Educators can find any question within 2-3 seconds
6. **Bulk Operations**: Support for bulk actions (approve, archive, delete) to scale operations
7. **Accessibility**: Follow WCAG guidelines; support keyboard navigation
8. **Mobile Responsiveness**: Dashboard works on tablets (admin is secondary interface)

---

## Wireframe Summary

| Page | Purpose | Key Elements |
|------|---------|-------------|
| Home | Overview | Stats, recent activity, quick actions |
| Curriculum | Browse & manage | Tree view, import, topic details |
| Question List | Search & manage | Filters, table, bulk actions, versioning |
| Create/Edit | Build questions | Form, rubric builder, curriculum mapping |
| Bulk Import | Mass upload | File upload, progress tracking, error report |
| Analytics | Insights | Coverage gaps, distribution, recommendations |

---

## Next Steps

1. **Prototype Phase 2**: Create interactive Figma/Adobe XD mockups
2. **User Testing**: Validate with actual educators and curriculum coordinators
3. **Component Library**: Build reusable UI components in Storybook
4. **Frontend Implementation**: Start with Home + Question List pages
5. **Backend Integration**: Wire up API calls from each dashboard page
