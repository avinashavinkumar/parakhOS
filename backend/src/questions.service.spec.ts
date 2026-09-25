import { QuestionsService } from './questions.service';
import { DatabaseService } from './database.service';

describe('QuestionsService', () => {
  it('rejects an empty question prompt before writing', async () => {
    const database = { query: jest.fn() } as unknown as DatabaseService;
    const service = new QuestionsService(database);
    await expect(service.create({ classId: 'class', subjectId: 'subject', topicId: 'topic', itemType: 'MCQ', prompt: '', difficulty: 'EASY', createdBy: 'user' })).rejects.toThrow('prompt is required');
    expect(database.query).not.toHaveBeenCalled();
  });

  it.each([
    ['item type', { itemType: 'ESSAY' }],
    ['difficulty', { difficulty: 'TRICKY' }],
    ['MCQ options', { itemType: 'MCQ' }],
    ['MCQ answer', { itemType: 'MCQ', options: [{ key: 'A', text: 'One' }] }]
  ])('rejects invalid %s before writing', async (_name, overrides) => {
    const database = { query: jest.fn() } as unknown as DatabaseService;
    const service = new QuestionsService(database);
    const input = {
      classId: 'class', subjectId: 'subject', topicId: 'topic', itemType: 'SHORT_ANSWER',
      prompt: 'A valid prompt', difficulty: 'EASY', createdBy: 'user', ...overrides
    };

    await expect(service.create(input)).rejects.toThrow();
    expect(database.query).not.toHaveBeenCalled();
  });

  it('returns total question count with paginated results', async () => {
    const database = {
      isEnabled: () => true,
      query: jest.fn()
        .mockResolvedValueOnce({ rows: [{ total: '3' }] })
        .mockResolvedValueOnce({ rows: [{ id: 'question-1' }] })
    } as unknown as DatabaseService;
    const service = new QuestionsService(database);

    await expect(service.list({ limit: '2', offset: '1' })).resolves.toEqual({
      items: [{ id: 'question-1' }], total: 3, limit: 2, offset: 1
    });
  });
});
