import { BadRequestException, Injectable } from '@nestjs/common';
import { DatabaseService } from './database.service';

type CurriculumImportRow = {
  classGrade: string;
  stage: string;
  subject: string;
  subjectCode: string;
  topic: string;
  description?: string;
  learningObjectives?: string;
  month?: string;
  bloomLevels?: string;
};

type CacheEntry = { expiresAt: number; value: { items: unknown[] } };

@Injectable()
export class CurriculumService {
  private readonly cache = new Map<string, CacheEntry>();
  private readonly cacheTtlMs = 60 * 60 * 1000;

  constructor(private readonly database: DatabaseService) {}

  getBoards() { return this.cached('boards', `SELECT id::text, name, code, country, description, is_active AS "isActive" FROM curriculum_boards WHERE is_active = true ORDER BY name`); }
  getClasses(boardId: string) { return this.cached(`classes:${boardId}`, `SELECT id::text, board_id::text AS "boardId", grade_band AS "gradeBand", stage, level, name, is_active AS "isActive" FROM curriculum_classes WHERE board_id::text = $1 AND is_active = true ORDER BY level`, [boardId]); }
  getSubjects(classId: string) { return this.cached(`subjects:${classId}`, `SELECT s.id::text, s.board_id::text AS "boardId", s.code, s.name, s.description, s.display_order AS "displayOrder", s.is_active AS "isActive" FROM curriculum_subjects s JOIN curriculum_class_subjects cs ON cs.subject_id = s.id WHERE cs.class_id::text = $1 AND s.is_active = true ORDER BY s.display_order, s.name`, [classId]); }
  getTopics(subjectId: string) { return this.cached(`topics:${subjectId}`, `SELECT id::text, subject_id::text AS "subjectId", board_id::text AS "boardId", code, name, description, display_order AS "displayOrder", is_active AS "isActive" FROM curriculum_topics WHERE subject_id::text = $1 AND is_active = true ORDER BY display_order, name`, [subjectId]); }
  getSubtopics(topicId: string) { return this.cached(`subtopics:${topicId}`, `SELECT id::text, topic_id::text AS "topicId", code, name, description, display_order AS "displayOrder", is_active AS "isActive" FROM curriculum_subtopics WHERE topic_id::text = $1 AND is_active = true ORDER BY display_order, name`, [topicId]); }
  getLearningObjectives(topicId: string) { return this.cached(`objectives:${topicId}`, `SELECT id::text, topic_id::text AS "topicId", subtopic_id::text AS "subtopicId", bloom_level AS "bloomLevel", objective, description, is_active AS "isActive" FROM curriculum_learning_objectives WHERE topic_id::text = $1 AND is_active = true ORDER BY created_at`, [topicId]); }

  async importRows(rows: CurriculumImportRow[]) {
    if (!this.database.isEnabled()) throw new BadRequestException('PostgreSQL is disabled. Set DB_ENABLED=true before importing.');
    if (!Array.isArray(rows) || rows.length === 0) throw new BadRequestException('At least one curriculum row is required.');
    if (rows.length > 5000) throw new BadRequestException('Import is limited to 5,000 rows per request.');

    const imported = await this.database.withTransaction(async (client) => {
      const board = await client.query<{ id: string }>(
        `INSERT INTO curriculum_boards (name, code, country) VALUES ('Central Board of Secondary Education', 'CBSE', 'India')
         ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name RETURNING id::text`, []);
      const boardId = board.rows[0].id;
      let classes = 0;
      let subjects = 0;
      let topics = 0;
      let objectives = 0;
      let syllabusRows = 0;
      const classIds = new Map<string, string>();
      const subjectIds = new Map<string, string>();
      const topicIds = new Map<string, string>();

      for (const row of rows) {
        if (!row.classGrade || !row.stage || !row.subject || !row.subjectCode || !row.topic) continue;
        await client.query(
          `INSERT INTO curriculum_syllabus (class_grade, stage, subject, subject_code, topic, description, learning_objectives, month, bloom_levels)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (class_grade, stage, subject_code, topic, month) DO UPDATE SET
           subject = EXCLUDED.subject, description = EXCLUDED.description,
           learning_objectives = EXCLUDED.learning_objectives, bloom_levels = EXCLUDED.bloom_levels,
           imported_at = now()`,
           [row.classGrade.trim(), row.stage.trim(), row.subject.trim(), row.subjectCode.trim(), row.topic.trim(), row.description?.trim() ?? '', row.learningObjectives?.trim() ?? '', row.month?.trim() ?? '', row.bloomLevels?.trim() ?? '']
        );
        syllabusRows++;
        const gradeBand = row.classGrade.trim().toUpperCase();
        const level = ['III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'].indexOf(gradeBand) + 3;
        if (level < 3 || !['PREPARATORY', 'MIDDLE', 'SECONDARY'].includes(row.stage.trim().toUpperCase())) continue;
        const classKey = gradeBand;
        let classId = classIds.get(classKey);
        if (!classId) {
          const result = await client.query<{ id: string }>(
            `INSERT INTO curriculum_classes (board_id, grade_band, stage, level, name) VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (board_id, grade_band) DO UPDATE SET stage = EXCLUDED.stage, level = EXCLUDED.level, name = EXCLUDED.name RETURNING id::text`,
            [boardId, gradeBand, row.stage.trim().toUpperCase(), level, `Class ${level}`]);
          classId = result.rows[0].id; classIds.set(classKey, classId); classes++;
        }
        const subjectKey = row.subjectCode.trim().toUpperCase();
        let subjectId = subjectIds.get(subjectKey);
        if (!subjectId) {
          const result = await client.query<{ id: string }>(
            `INSERT INTO curriculum_subjects (board_id, code, name, description) VALUES ($1, $2, $3::varchar, $3::text)
             ON CONFLICT (board_id, code) DO UPDATE SET name = EXCLUDED.name RETURNING id::text`, [boardId, subjectKey, row.subject.trim()]);
          subjectId = result.rows[0].id; subjectIds.set(subjectKey, subjectId); subjects++;
        }
        await client.query(`INSERT INTO curriculum_class_subjects (class_id, subject_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [classId, subjectId]);
        const topicCode = row.topic.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
        const topicKey = `${subjectId}:${topicCode}`;
        let topicId = topicIds.get(topicKey);
        if (!topicId) {
          const result = await client.query<{ id: string }>(
            `INSERT INTO curriculum_topics (subject_id, board_id, code, name, description) VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (subject_id, code) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description RETURNING id::text`,
            [subjectId, boardId, topicCode, row.topic.trim(), row.description?.trim() ?? null]);
          topicId = result.rows[0].id; topicIds.set(topicKey, topicId); topics++;
        }
        for (const objective of (row.learningObjectives ?? '').split(';').map((value) => value.trim()).filter(Boolean)) {
          const bloomLevel = (row.bloomLevels ?? 'UNDERSTAND').split(',')[0].trim().toUpperCase();
          await client.query(`INSERT INTO curriculum_learning_objectives (topic_id, bloom_level, objective) SELECT $1, $2, $3 WHERE NOT EXISTS (SELECT 1 FROM curriculum_learning_objectives WHERE topic_id = $1 AND objective = $3)`, [topicId, bloomLevel, objective]);
          objectives++;
        }
      }
      return { rows: rows.length, syllabusRows, classes, subjects, topics, objectives };
    });
    this.cache.clear();
    return { status: 'completed', ...imported };
  }

  private async cached(key: string, text: string, values: unknown[] = []) {
    if (!this.database.isEnabled()) return { items: [] };
    const existing = this.cache.get(key);
    if (existing && existing.expiresAt > Date.now()) return existing.value;
    const result = await this.database.query<Record<string, unknown>>(text, values);
    const value = { items: result.rows };
    this.cache.set(key, { expiresAt: Date.now() + this.cacheTtlMs, value });
    return value;
  }
}
