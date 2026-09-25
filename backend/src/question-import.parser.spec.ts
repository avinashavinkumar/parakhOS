import { BadRequestException } from '@nestjs/common';
import { QuestionImportParser } from './question-import.parser';

describe('QuestionImportParser', () => {
  const parser = new QuestionImportParser();

  it('parses quoted CSV values and JSON options', () => {
    const rows = parser.parseCsv('prompt,itemType,options\n"What is 2, plus 2?",MCQ,"[{""key"": ""A"", ""text"": ""4""}]"');
    expect(rows).toEqual([{ prompt: 'What is 2, plus 2?', itemType: 'MCQ', options: [{ key: 'A', text: '4' }] }]);
  });

  it('accepts a JSON question array or questions envelope', () => {
    expect(parser.parseJson('[{"prompt":"One"}]')).toEqual([{ prompt: 'One' }]);
    expect(parser.parseJson('{"questions":[{"prompt":"Two"}]}')).toEqual([{ prompt: 'Two' }]);
  });

  it('rejects malformed rows and JSON', () => {
    expect(() => parser.parseCsv('prompt,itemType\n"missing quote,MCQ')).toThrow(BadRequestException);
    expect(() => parser.parseJson('{bad json}')).toThrow('Invalid JSON import');
    expect(() => parser.parseJson('{"questions":[]}')).toThrow('JSON must be an array of question objects');
  });
});