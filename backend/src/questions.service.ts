import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from './database.service';

export type QuestionInput = {
  classId: string; subjectId: string; topicId: string; subtopicId?: string; learningObjectiveId?: string;
  competencyId?: string; itemType: string; prompt: string; difficulty: string; estimatedTimeSeconds?: number;
  options?: unknown; correctAnswerKey?: string; rubric?: unknown; expectedEvidence?: unknown;
  provenance?: string;
  createdBy?: string;
};

const itemTypes = new Set(['MCQ', 'SHORT_ANSWER', 'REFLECTION', 'SCENARIO', 'CONVERSATION', 'PERFORMANCE', 'TRUE_FALSE', 'FILL_BLANK']);
const difficulties = new Set(['EASY', 'MEDIUM', 'HARD']);
const provenances = new Set(['MANUALLY_CREATED', 'BULK_IMPORTED', 'AI_ASSISTED', 'AI_GENERATED']);

@Injectable()
export class QuestionsService {
  constructor(private readonly database: DatabaseService) {}

  async create(input: QuestionInput, createdBy?: string) {
    if (!input.prompt?.trim()) throw new BadRequestException('prompt is required');
    if (!createdBy?.trim()) throw new BadRequestException('authenticated creator is required');
    this.validate(input);
    const result = await this.database.query(`
      INSERT INTO question_bank_questions
        (class_id, subject_id, topic_id, subtopic_id, learning_objective_id, competency_id, item_type, prompt,
         difficulty, estimated_time_seconds, options, correct_answer_key, rubric, expected_evidence, provenance, created_by)
      VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5::uuid, $6::uuid, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16::uuid)
      RETURNING id::text, class_id::text AS "classId", subject_id::text AS "subjectId", topic_id::text AS "topicId",
        item_type AS "itemType", prompt, difficulty, options, correct_answer_key AS "correctAnswerKey",
        rubric, expected_evidence AS "expectedEvidence", provenance, status, created_by::text AS "createdBy",
        created_at AS "createdAt", updated_at AS "updatedAt"`, this.values(input, createdBy));
    return result.rows[0];
  }

  async list(filters: Record<string, string | undefined>) {
    if (!this.database.isEnabled()) return { items: [], total: 0, limit: 20, offset: 0 };
    const clauses: string[] = [];
    const values: unknown[] = [];
    const columns: Record<string, string> = { classId: 'class_id', subjectId: 'subject_id', topicId: 'topic_id', competencyId: 'competency_id', difficulty: 'difficulty', status: 'status', provenance: 'provenance' };
    for (const [key, column] of Object.entries(columns)) {
      if (filters[key]) { values.push(filters[key]); clauses.push(`${column}${key === 'difficulty' || key === 'status' || key === 'provenance' ? ' = $' : '::text = $'}${values.length}`); }
    }
    if (filters.search) { values.push(filters.search); clauses.push(`to_tsvector('english', prompt) @@ plainto_tsquery('english', $${values.length})`); }
    const limit = Math.min(Math.max(Number(filters.limit ?? 20), 1), 100);
    const offset = Math.max(Number(filters.offset ?? 0), 0);
    values.push(limit, offset);
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const countResult = await this.database.query<{ total: string }>(`SELECT COUNT(*)::int AS total FROM question_bank_questions ${where}`, values.slice(0, -2));
    const result = await this.database.query(`SELECT id::text, class_id::text AS "classId", subject_id::text AS "subjectId", topic_id::text AS "topicId", item_type AS "itemType", prompt, difficulty, options, correct_answer_key AS "correctAnswerKey", rubric, expected_evidence AS "expectedEvidence", provenance, status, created_at AS "createdAt", updated_at AS "updatedAt" FROM question_bank_questions ${where} ORDER BY created_at DESC LIMIT $${values.length - 1} OFFSET $${values.length}` , values);
    return { items: result.rows, total: Number(countResult.rows[0]?.total ?? 0), limit, offset };
  }

  async get(id: string) {
    const result = await this.database.query(`SELECT id::text, class_id::text AS "classId", subject_id::text AS "subjectId", topic_id::text AS "topicId", item_type AS "itemType", prompt, difficulty, options, correct_answer_key AS "correctAnswerKey", rubric, expected_evidence AS "expectedEvidence", provenance, status, created_at AS "createdAt", updated_at AS "updatedAt" FROM question_bank_questions WHERE id::text = $1`, [id]);
    if (!result.rows[0]) throw new NotFoundException('Question not found');
    return result.rows[0];
  }

  async update(id: string, input: Partial<QuestionInput> & { changeReason?: string; changedBy?: string }) {
    const current = await this.get(id);
    if (!input.changedBy?.trim()) throw new BadRequestException('authenticated change actor is required');
    await this.database.query(`INSERT INTO question_bank_versions (question_id, version_number, prompt, options, correct_answer_key, rubric, expected_evidence, changed_by, change_reason) SELECT id, COALESCE((SELECT MAX(version_number) FROM question_bank_versions WHERE question_id = id), 0) + 1, prompt, options, correct_answer_key, rubric, expected_evidence, $2::uuid, $3 FROM question_bank_questions WHERE id = $1::uuid`, [id, input.changedBy, input.changeReason ?? 'Question edited']);
    const result = await this.database.query(`UPDATE question_bank_questions SET prompt = COALESCE($2, prompt), difficulty = COALESCE($3, difficulty), options = COALESCE($4, options), correct_answer_key = COALESCE($5, correct_answer_key), rubric = COALESCE($6, rubric), expected_evidence = COALESCE($7, expected_evidence), updated_at = now() WHERE id = $1::uuid RETURNING id::text, prompt, difficulty, options, correct_answer_key AS "correctAnswerKey", rubric, expected_evidence AS "expectedEvidence", status, updated_at AS "updatedAt"`, [id, input.prompt, input.difficulty, this.json(input.options), input.correctAnswerKey, this.json(input.rubric), this.json(input.expectedEvidence)]);
    return result.rows[0] ?? current;
  }

  async setStatus(id: string, status: 'ACTIVE' | 'ARCHIVED') {
    if (status === 'ACTIVE') {
      const result = await this.database.query(`UPDATE question_bank_questions SET status = 'ACTIVE', approved_at = COALESCE(approved_at, now()), updated_at = now() WHERE id = $1::uuid RETURNING id::text, status, approved_at AS "approvedAt"`, [id]);
      if (!result.rows[0]) throw new NotFoundException('Question not found');
      return result.rows[0];
    }
    const result = await this.database.query(`UPDATE question_bank_questions SET status = 'ARCHIVED', updated_at = now() WHERE id = $1::uuid RETURNING id::text, status`, [id]);
    if (!result.rows[0]) throw new NotFoundException('Question not found');
    return result.rows[0];
  }

  getVersions(id: string) { return this.database.query(`SELECT id::text, version_number AS "versionNumber", prompt, options, correct_answer_key AS "correctAnswerKey", rubric, expected_evidence AS "expectedEvidence", changed_by::text AS "changedBy", change_reason AS "changeReason", created_at AS "createdAt" FROM question_bank_versions WHERE question_id::text = $1 ORDER BY version_number DESC`, [id]).then((result) => result.rows); }

  private values(input: QuestionInput, createdBy: string) { return [input.classId, input.subjectId, input.topicId, input.subtopicId ?? null, input.learningObjectiveId ?? null, input.competencyId ?? null, input.itemType, input.prompt, input.difficulty, input.estimatedTimeSeconds ?? null, this.json(input.options), input.correctAnswerKey ?? null, this.json(input.rubric), this.json(input.expectedEvidence), input.provenance ?? 'MANUALLY_CREATED', createdBy]; }
  private json(value: unknown) { return value === undefined ? null : JSON.stringify(value); }
  private validate(input: QuestionInput) {
    if (!itemTypes.has(input.itemType)) throw new BadRequestException('itemType is invalid');
    if (!difficulties.has(input.difficulty)) throw new BadRequestException('difficulty is invalid');
    const provenance = input.provenance ?? 'MANUALLY_CREATED';
    if (!provenances.has(provenance)) throw new BadRequestException('provenance is invalid');
    if ((input.itemType === 'MCQ' || input.itemType === 'TRUE_FALSE') && (!Array.isArray(input.options) || input.options.length === 0)) {
      throw new BadRequestException('options are required for multiple-choice questions');
    }
    if ((input.itemType === 'MCQ' || input.itemType === 'TRUE_FALSE') && !input.correctAnswerKey?.trim()) {
      throw new BadRequestException('correctAnswerKey is required for selectable questions');
    }
  }
}
