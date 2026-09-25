import { BadRequestException, Injectable } from '@nestjs/common';

export type ParsedQuestionRow = Record<string, unknown>;

@Injectable()
export class QuestionImportParser {
  parseCsv(input: string): ParsedQuestionRow[] {
    const records = this.records(input);
    if (records.length < 2) throw new BadRequestException('CSV must contain a header and at least one row');
    const headers = records[0].map((header) => header.trim());
    if (headers.some((header) => !header)) throw new BadRequestException('CSV headers cannot be empty');

    return records.slice(1).map((values, index) => {
      if (values.length !== headers.length) throw new BadRequestException(`CSV row ${index + 2} has an unexpected number of columns`);
      return Object.fromEntries(headers.map((header, column) => [header, this.value(values[column])]));
    });
  }

  parseJson(input: string): ParsedQuestionRow[] {
    let parsed: unknown;
    try { parsed = JSON.parse(input); } catch { throw new BadRequestException('Invalid JSON import'); }
    const rows = Array.isArray(parsed) ? parsed : (parsed && typeof parsed === 'object' && Array.isArray((parsed as { questions?: unknown }).questions) ? (parsed as { questions: unknown[] }).questions : null);
    if (!rows || rows.length === 0 || rows.some((row) => !row || typeof row !== 'object' || Array.isArray(row))) throw new BadRequestException('JSON must be an array of question objects');
    return rows as ParsedQuestionRow[];
  }

  private records(input: string): string[][] {
    const records: string[][] = [];
    let row: string[] = [];
    let value = '';
    let quoted = false;
    for (let index = 0; index < input.length; index++) {
      const character = input[index];
      if (character === '"') {
        if (quoted && input[index + 1] === '"') { value += '"'; index++; }
        else quoted = !quoted;
      } else if (character === ',' && !quoted) { row.push(value); value = ''; }
      else if ((character === '\n' || character === '\r') && !quoted) {
        if (character === '\r' && input[index + 1] === '\n') index++;
        row.push(value); value = '';
        if (row.some((cell) => cell.trim())) records.push(row);
        row = [];
      } else value += character;
    }
    if (quoted) throw new BadRequestException('CSV contains an unterminated quoted value');
    if (value || row.length) { row.push(value); if (row.some((cell) => cell.trim())) records.push(row); }
    return records;
  }

  private value(value: string): unknown {
    const trimmed = value.trim();
    if (!trimmed) return '';
    if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
      try { return JSON.parse(trimmed); } catch { return trimmed; }
    }
    return trimmed;
  }
}