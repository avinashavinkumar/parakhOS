import { CurriculumService } from './curriculum.service';
import { DatabaseService } from './database.service';

describe('CurriculumService', () => {
  it('queries the curriculum hierarchy through the database service', async () => {
    const database = { isEnabled: () => true, query: jest.fn()
      .mockResolvedValueOnce({ rows: [{ id: 'board-1', code: 'CBSE' }] })
      .mockResolvedValueOnce({ rows: [{ id: 'class-1', gradeBand: 'V' }] })
      .mockResolvedValueOnce({ rows: [{ id: 'subject-1', code: 'MATH' }] })
      .mockResolvedValueOnce({ rows: [{ id: 'topic-1', code: 'WHOLE_NUMBERS' }] })
      .mockResolvedValueOnce({ rows: [{ id: 'subtopic-1', code: 'ADDITION' }] })
      .mockResolvedValueOnce({ rows: [{ id: 'objective-1', bloomLevel: 'APPLY' }] }) } as unknown as DatabaseService;
    const service = new CurriculumService(database);

    await expect(service.getBoards()).resolves.toEqual({ items: [{ id: 'board-1', code: 'CBSE' }] });
    await expect(service.getClasses('board-1')).resolves.toEqual({ items: [{ id: 'class-1', gradeBand: 'V' }] });
    await expect(service.getSubjects('class-1')).resolves.toEqual({ items: [{ id: 'subject-1', code: 'MATH' }] });
    await expect(service.getTopics('subject-1')).resolves.toEqual({ items: [{ id: 'topic-1', code: 'WHOLE_NUMBERS' }] });
    await expect(service.getSubtopics('topic-1')).resolves.toEqual({ items: [{ id: 'subtopic-1', code: 'ADDITION' }] });
    await expect(service.getLearningObjectives('topic-1')).resolves.toEqual({ items: [{ id: 'objective-1', bloomLevel: 'APPLY' }] });
    expect(database.query).toHaveBeenCalledTimes(6);
  });
});
