# CBSE Curriculum Ingestion Guide

**Date**: 2026-08-20 | **Version**: 1.0 | **Status**: Ready for Implementation

**Data Source**: 
- Primary: `F:\Student OS\PARAKH\split-up-syllabus-for-the-academic-session-2026-27 - All merged from III to XII.pdf`
- Individual class files: `F:\Student OS\PARAKH\Split-Up-Syllabus_2026-27_Class-{III,IV,V,VI,VII,VIII,X,XI,XII}.pdf`
- Academic Session: 2026-27

---

## Overview

The CBSE (Central Board of Secondary Education) provides official curriculum documents for Classes III through XII. These PDFs define:
- **Subjects** per class (e.g., Mathematics, English, Science, Social Studies)
- **Topics/Units** within each subject (e.g., "Whole Numbers" in Math Class V)
- **Learning outcomes** and competencies aligned to each topic
- **Month-wise distribution** (when each topic should be taught)

The curriculum ingestion process will:
1. Parse the official PDF files
2. Extract subjects, topics, and learning objectives
3. Structure data according to the 002 data model
4. Import into PostgreSQL via bulk CSV/JSON upload
5. Make curriculum queryable for assessment creation

---

## CBSE Curriculum Structure

### Class Distribution

| Class | Stage | Subjects | Topics/Units | Notes |
|-------|-------|----------|------------|-------|
| III | PREPARATORY | 5-6 | ~25-30 | Foundational stage |
| IV | PREPARATORY | 5-6 | ~30-35 | Transitional |
| V | PREPARATORY | 5-6 | ~30-35 | Upper primary |
| VI | MIDDLE | 6-7 | ~40-45 | Lower secondary |
| VII | MIDDLE | 6-7 | ~40-45 | Middle secondary |
| VIII | MIDDLE | 6-7 | ~40-45 | Upper middle |
| IX | SECONDARY | 6-7 | ~45-50 | Secondary (w/ board exams) |
| X | SECONDARY | 6-7 | ~45-50 | Secondary (board exams) |
| XI | SECONDARY | 6-7 | ~50-55 | Senior secondary |
| XII | SECONDARY | 6-7 | ~50-55 | Senior secondary (board exams) |

**Total Estimate**: ~300-350 topics across 10 classes × 6 subjects

### Subject Breakdown (CBSE Core Subjects)

**Classes III-VIII** (Primary & Middle):
1. Mathematics (Math)
2. English Language
3. Hindi / Regional Language
4. Science
5. Social Studies

**Classes IX-XII** (Secondary & Senior Secondary):
1. Mathematics (standard or basic track)
2. English
3. Hindi / Indian Languages
4. Science (Physics, Chemistry, Biology - split in IX+)
5. Social Studies (History, Geography, Civics, Economics - split in IX+)
6. Electives (based on student stream: Science, Commerce, Humanities)

### Topic Structure

Each subject contains **chapters/units** with:
- **Chapter number** (e.g., "Chapter 1: Knowing Our Numbers")
- **Chapter name/title**
- **Key learning outcomes** (what students will achieve)
- **Scope** (topics covered within chapter)
- **Month of teaching** (when in academic year)

**Example: Class V Mathematics**
```
Chapter 1: Knowing Our Numbers
  Topics:
    - Whole numbers and place value
    - Comparing numbers
    - Rounding off numbers

Chapter 2: Whole Numbers
  Topics:
    - Addition and subtraction
    - Multiplication
    - Division
    - Properties of whole numbers

[... 10-12 chapters total ...]
```

---

## Data Model Mapping

### PDF → Database Entity Mapping

| PDF Element | Database Entity | Example |
|------------|-----------------|---------|
| Board (CBSE) | Board | id: cbse-001, name: "CBSE" |
| Class (III, IV, V...) | Class | id: class-v, gradeBand: "V", stage: "PREPARATORY" |
| Subject | Subject | id: math-v, code: "MATH", name: "Mathematics" |
| Chapter / Unit | Topic | id: topic-whole-numbers, name: "Whole Numbers" |
| Chapter section | SubTopic | id: subtopic-add-carry, name: "Addition with Carry-Over" |
| Learning outcome | LearningObjective | objective: "Students add multi-digit numbers with carry-over", bloomLevel: "APPLY" |

### Curriculum Hierarchy

```
CBSE (Board)
├── Class III (PREPARATORY)
│   ├── Mathematics
│   │   ├── Knowing Our Numbers
│   │   │   ├── Place value concept
│   │   │   └── Counting and comparing
│   │   ├── Whole Numbers
│   │   │   ├── Addition
│   │   │   ├── Subtraction
│   │   │   └── Multiplication
│   │   ├── Fractions
│   │   │   ├── Concept of fractions
│   │   │   └── Comparing fractions
│   │   └── ... (8-10 more chapters)
│   ├── English
│   │   ├── Prose
│   │   │   └── ... (stories, narratives)
│   │   ├── Poetry
│   │   │   └── ... (poems, rhymes)
│   │   └── ... (grammar, composition)
│   ├── Science
│   │   ├── Human Body and Health
│   │   ├── Plants and Animals
│   │   └── ... (matter, living things)
│   ├── Social Studies
│   │   ├── Geography
│   │   ├── History
│   │   └── Civics
│   └── Hindi / Regional Language
└── Class IV, V, VI, VII, VIII, IX, X, XI, XII
    └── [Same structure, increasing complexity]
```

---

## Curriculum Ingestion Process

### Step 1: PDF Parsing

**Tool Options**:
- **Python**: pdfplumber, PyPDF2, or pypdfium2 for extraction
- **Node.js**: pdfparse, pdf.js, or pdf-lib
- **Manual**: Regex-based extraction if structure is consistent

**Expected Challenges**:
- PDF layout varies (tables, text boxes, multi-column)
- Chapter numbering inconsistency
- Learning outcomes embedded in prose vs. bullet points
- Font styles used to denote hierarchy (bold, indentation)

**Parsing Strategy** (Recommended):
```python
import pdfplumber

with pdfplumber.open('Split-Up-Syllabus_2026-27_Class-V.pdf') as pdf:
    for page in pdf.pages:
        text = page.extract_text()
        
        # Regex to identify:
        # - Chapter number: "Chapter 1:", "Ch. 2:"
        # - Chapter title: "Knowing Our Numbers"
        # - Learning outcomes: "Students will be able to..."
        # - Month: "July", "August", etc.
        
        # Store results in structured format
        curriculum.append({
            'class': 'V',
            'subject': 'Mathematics',
            'chapter_num': 1,
            'chapter_name': 'Knowing Our Numbers',
            'learning_outcomes': [...],
            'month': 'July-August'
        })
```

### Step 2: Data Structuring

Transform parsed PDF data into CSV/JSON format matching the data model.

**CSV Format** (for bulk import):
```csv
classGrade,stage,subject,code,topic,description,learning_objectives,month
V,PREPARATORY,Mathematics,MATH,Whole Numbers,"Understanding whole numbers and operations","Students add multi-digit numbers with carry-over; Students understand commutativity",July-August
V,PREPARATORY,Mathematics,MATH,Fractions,"Introduction to fractions","Students identify half and quarter; Students compare fractions",August-September
VI,MIDDLE,Mathematics,MATH,"Integers","Positive and negative numbers","Students understand negative numbers; Students perform operations on integers",September-October
```

**JSON Format** (alternative):
```json
{
  "board": "CBSE",
  "academicSession": "2026-27",
  "curriculum": [
    {
      "class": "V",
      "stage": "PREPARATORY",
      "subjects": [
        {
          "name": "Mathematics",
          "code": "MATH",
          "topics": [
            {
              "name": "Whole Numbers",
              "description": "Understanding whole numbers and operations",
              "learningObjectives": [
                "Students add multi-digit numbers with carry-over",
                "Students understand commutativity"
              ],
              "month": "July-August",
              "subtopics": [
                {
                  "name": "Addition with Carry-Over",
                  "description": "Multi-digit addition"
                },
                {
                  "name": "Subtraction with Borrow",
                  "description": "Multi-digit subtraction"
                }
              ]
            },
            {
              "name": "Fractions",
              "description": "Introduction to fractions",
              "learningObjectives": [
                "Students identify half and quarter",
                "Students compare fractions"
              ],
              "month": "August-September"
            }
          ]
        }
      ]
    },
    {
      "class": "VI",
      "stage": "MIDDLE",
      "subjects": [...]
    }
  ]
}
```

### Step 3: CSV Creation for Bulk Import

Create a master CSV file with all curriculum data.

**File**: `cbse-curriculum-2026-27.csv`

**Columns**:
| classGrade | stage | subject | subjectCode | topic | description | learningObjectives | month | bloomLevels |
|------------|-------|---------|-------------|-------|-------------|-------------------|-------|------------|
| V | PREPARATORY | Mathematics | MATH | Whole Numbers | Understanding whole numbers and operations | Students add multi-digit numbers with carry-over; Students understand commutativity | July-August | APPLY,UNDERSTAND |
| V | PREPARATORY | Mathematics | MATH | Fractions | Introduction to fractions | Students identify half and quarter; Students compare fractions | August-September | REMEMBER,UNDERSTAND |

**Row Count Estimate**: ~300-350 rows (one topic per row)

### Step 4: Upload via Admin Dashboard

1. Admin logs into dashboard
2. Navigate to Curriculum → Import
3. Upload `cbse-curriculum-2026-27.csv`
4. Select board: CBSE
5. Select merge strategy: KEEP_OLD (first import)
6. Preview conflicts (if any)
7. Click "Import"
8. System processes asynchronously:
   - Parse CSV
   - Validate class/subject/topic names
   - Create Board, Class, Subject, Topic, SubTopic entities
   - Create LearningObjective records
   - Return summary: "145 topics imported; 10 classes; 35 subjects"

### Step 5: Validation

After import, verify:
- All classes present (III-XII)
- All subjects loaded correctly
- Topics queryable by class/subject
- Learning objectives linked to topics
- Month information stored (for assessment sequencing)

**Validation Query** (SQL):
```sql
-- Count topics by class
SELECT c.name, COUNT(t.id) as topic_count
FROM classes c
JOIN subjects s ON s.class_id = c.id
JOIN topics t ON t.subject_id = s.id
GROUP BY c.id
ORDER BY c.level;

-- Expected output:
-- Class III: ~25 topics
-- Class IV: ~30 topics
-- Class V: ~30 topics
-- Class VI: ~40 topics
-- ...
-- Total: ~300+ topics
```

---

## Specific CBSE Curriculum Details (2026-27)

Based on official CBSE structure:

### Class V Mathematics Chapters (Example)

| Chapter | Learning Outcomes | Month |
|---------|------------------|-------|
| 1. Knowing Our Numbers | Place value, counting, comparing | July |
| 2. Whole Numbers | Addition, subtraction, multiplication, division | July-August |
| 3. Playing with Numbers | Factors, multiples, divisibility | August |
| 4. Fractions | Concept, comparing, operations | September |
| 5. Decimals | Decimal notation, operations | September-October |
| 6. Algebra | Simple patterns, variables | October |
| 7. Ratio and Proportion | Concept of ratio, proportion | October-November |
| 8. Geometry | 2D shapes, symmetry, angles | November |
| 9. Perimeter and Area | Calculating perimeter, area | November-December |
| 10. Data Handling | Data collection, graphs, average | December-January |

**Total**: 10 chapters, ~30 topics for Class V Math

### Class VI Mathematics Chapters (Progression)

| Chapter | Learning Outcomes | Month |
|---------|------------------|-------|
| 1. Knowing Our Numbers | Place value, comparison, ordering up to lakhs | July |
| 2. Whole Numbers | Number line, properties | July-August |
| 3. Playing with Numbers | Factors, multiples, prime/composite | August |
| 4. Basic Geometrical Ideas | Points, lines, planes, angles | August-September |
| 5. Understanding Elementary Shapes | Polygons, triangles, circles | September |
| 6. Integers | Concept, operations on integers | September-October |
| 7. Fractions | Concept, operations on fractions | October |
| 8. Decimals | Decimal operations, money, measurement | October-November |
| 9. Data Handling | Tally marks, pictographs, bar graphs | November |
| 10. Mensuration | Perimeter, area | November-December |
| 11. Algebra | Variables, equations, word problems | December-January |
| 12. Symmetry | Line symmetry, rotational symmetry | January-February |
| 13. Practical Geometry | Construction basics | February |

**Total**: 13 chapters, ~40 topics for Class VI Math

---

## Implementation Steps for Backend

### Task: Create PDF Parser Module

**File**: `backend/src/import/pdf-parser.ts`

```typescript
import pdfPlumber from 'pdfplumber';
import { Logger } from '@nestjs/common';

export class PDFCurriculumParser {
  private readonly logger = new Logger(PDFCurriculumParser.name);

  async parseCSVECurriculumPDF(filePath: string): Promise<CurriculumData[]> {
    try {
      const pdf = await pdfPlumber.open(filePath);
      const curriculum: CurriculumData[] = [];

      for (const page of pdf.pages) {
        const text = page.extract_text();
        
        // Extract class, subject, chapters using regex
        const classMatch = text.match(/Class\s+([A-Z0-9]+)/);
        const chapterMatches = text.matchAll(/Chapter\s+(\d+)[:\s]+([^\n]+)/g);

        if (classMatch) {
          const className = classMatch[1];
          
          for (const match of chapterMatches) {
            curriculum.push({
              classGrade: className,
              stage: this.mapClassToStage(className),
              subject: this.extractSubject(text),
              topic: match[2].trim(),
              learningObjectives: this.extractObjectives(text),
              month: this.extractMonth(text)
            });
          }
        }
      }

      return curriculum;
    } catch (error) {
      this.logger.error(`Failed to parse PDF: ${error.message}`);
      throw error;
    }
  }

  private mapClassToStage(classGrade: string): 'PREPARATORY' | 'MIDDLE' | 'SECONDARY' {
    const grade = parseInt(classGrade);
    if (grade <= 5) return 'PREPARATORY';
    if (grade <= 8) return 'MIDDLE';
    return 'SECONDARY';
  }

  private extractSubject(text: string): string {
    // Use text context to determine subject
    if (text.includes('equation') || text.includes('algebra')) return 'Mathematics';
    if (text.includes('grammar') || text.includes('literature')) return 'English';
    if (text.includes('science')) return 'Science';
    return 'Unknown';
  }

  private extractObjectives(text: string): string[] {
    const objectivePattern = /Students (?:will )?(?:be able to )?([^.]+)\./g;
    const matches = [...text.matchAll(objectivePattern)];
    return matches.map(m => m[1].trim());
  }

  private extractMonth(text: string): string {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                   'July', 'August', 'September', 'October', 'November', 'December'];
    const foundMonths = months.filter(m => text.includes(m));
    return foundMonths.join('-');
  }
}
```

### Task: Create CSV Export from Parsed PDF

**Output**: `cbse-curriculum-2026-27.csv`

```typescript
export async function generateCurriculumCSV(pdfPath: string, outputPath: string) {
  const parser = new PDFCurriculumParser();
  const data = await parser.parseCSVECurriculumPDF(pdfPath);
  
  const csvContent = [
    'classGrade,stage,subject,subjectCode,topic,description,learningObjectives,month,bloomLevels',
    ...data.map(row => 
      `${row.classGrade},"${row.stage}","${row.subject}","${this.getSubjectCode(row.subject)}","${row.topic}","Curriculum topic from CBSE 2026-27","${row.learningObjectives.join('; ')}","${row.month}","UNDERSTAND,APPLY"`
    )
  ].join('\n');
  
  fs.writeFileSync(outputPath, csvContent, 'utf8');
  console.log(`✅ Curriculum CSV generated: ${outputPath}`);
}
```

---

## Curriculum Validation Checklist

After import completes, verify:

- [ ] **10 classes imported** (III, IV, V, VI, VII, VIII, IX, X, XI, XII)
- [ ] **35 subjects loaded** (~3-6 per class, accounting for electives in IX+)
- [ ] **300+ topics created** (~30 per class average)
- [ ] **Learning objectives linked** to each topic
- [ ] **Month information stored** (for sequencing in assessments)
- [ ] **Stage mapping correct**:
  - [ ] Classes III-V = PREPARATORY
  - [ ] Classes VI-VIII = MIDDLE
  - [ ] Classes IX-XII = SECONDARY
- [ ] **No duplicate topics** (same name in same subject/class)
- [ ] **Query performance** <100ms for "get topics by class/subject"

---

## Sample Import Workflow

**Input Files**:
- `F:\Student OS\PARAKH\split-up-syllabus-for-the-academic-session-2026-27 - All merged from III to XII.pdf`
- `F:\Student OS\PARAKH\Split-Up-Syllabus_2026-27_Class-*.pdf` (individual class files)

**Processing**:
1. Parse PDFs → Extract curriculum data
2. Create CSV file → `cbse-curriculum-2026-27.csv` (~350 rows)
3. Upload via admin dashboard
4. System imports asynchronously
5. Validate query results

**Expected Outcome**:
```json
{
  "importId": "curriculum-cbse-2026-27",
  "status": "COMPLETED",
  "board": "CBSE",
  "classesCreated": 10,
  "subjectsCreated": 35,
  "topicsCreated": 325,
  "learningObjectivesCreated": 850,
  "errors": 0,
  "warnings": 5,
  "completedAt": "2026-08-21T10:30:00Z"
}
```

---

## Future Enhancements

1. **Automated PDF Parsing**: Develop Node.js service to automatically parse CBSE PDFs on upload
2. **Month-based Assessment Sequencing**: When creating assessment, suggest topics based on current month
3. **Competency-to-LearningObjective Mapping**: Map CBSE learning outcomes to competencies (PROBLEM_SOLVING, CRITICAL_THINKING, etc.)
4. **Curriculum Version Management**: Track CBSE curriculum updates (e.g., 2025-26 vs 2026-27)
5. **Multi-Board Support**: Extend to ICSE, State Board curricula using same import pipeline

---

## References

- **CBSE Official**: https://cbseacademic.nic.in/ (syllabus downloads)
- **Source File Location**: `F:\Student OS\PARAKH\split-up-syllabus-for-the-academic-session-2026-27 - All merged from III to XII.pdf`
- **Related Task**: T228 - Curriculum import CSV/JSON parser
- **Related Task**: T229 - Curriculum import validator
- **Related Task**: T230 - BullMQ job processor for curriculum import
