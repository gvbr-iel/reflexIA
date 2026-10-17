import type { ImportedWorkshopQuestion } from '../../../models/workshopStructure';

const MAX_CSV_LENGTH = 1_000_000;
const MAX_QUESTIONS = 30;
const ALTERNATIVE_HEADERS = [
  'alternativa1',
  'alternativa2',
  'alternativa3',
  'alternativa4',
  'alternativa5',
  'alternativa6',
];

function detectDelimiter(headerLine: string): ',' | ';' {
  let quoted = false;
  let commas = 0;
  let semicolons = 0;
  for (let index = 0; index < headerLine.length; index += 1) {
    const character = headerLine[index];
    if (character === '"' && headerLine[index + 1] === '"' && quoted) {
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (!quoted && character === ',') {
      commas += 1;
    } else if (!quoted && character === ';') {
      semicolons += 1;
    }
  }
  return semicolons > commas ? ';' : ',';
}

function parseRows(csv: string, delimiter: ',' | ';'): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;

  for (let index = 0; index < csv.length; index += 1) {
    const character = csv[index];
    if (character === '"') {
      if (quoted && csv[index + 1] === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (!quoted && character === delimiter) {
      row.push(field);
      field = '';
    } else if (!quoted && (character === '\n' || character === '\r')) {
      if (character === '\r' && csv[index + 1] === '\n') index += 1;
      row.push(field);
      if (row.some((cell) => cell.trim() !== '')) rows.push(row);
      row = [];
      field = '';
    } else {
      field += character;
    }
  }

  if (quoted) throw new Error('El CSV tiene comillas sin cerrar.');
  row.push(field);
  if (row.some((cell) => cell.trim() !== '')) rows.push(row);
  return rows;
}

function normalizeHeader(header: string): string {
  return header
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[\s_-]+/g, '');
}

export function parseQuestionsCsv(csv: string): ImportedWorkshopQuestion[] {
  if (csv.length === 0 || csv.length > MAX_CSV_LENGTH) {
    throw new Error('El CSV está vacío o supera el límite de 1 MB.');
  }

  const content = csv.replace(/^\uFEFF/, '');
  const firstLine = content.split(/\r?\n/, 1)[0] ?? '';
  const rows = parseRows(content, detectDelimiter(firstLine));
  if (rows.length < 2) {
    throw new Error('El CSV debe incluir encabezados y al menos una pregunta.');
  }

  const headers = rows[0].map(normalizeHeader);
  const questionIndex = headers.indexOf('pregunta');
  const correctAnswerIndex = headers.indexOf('respuestacorrecta');
  const alternativeIndexes = ALTERNATIVE_HEADERS.map((header) => headers.indexOf(header));
  if (
    questionIndex < 0 ||
    correctAnswerIndex < 0 ||
    alternativeIndexes.slice(0, 2).some((index) => index < 0)
  ) {
    throw new Error(
      'Faltan columnas. Usa pregunta, alternativa1, alternativa2 y respuestaCorrecta; puedes agregar alternativa3 a alternativa6.',
    );
  }

  const questions = rows.slice(1).map((cells, rowIndex) => {
    const line = rowIndex + 2;
    const prompt = (cells[questionIndex] ?? '').trim();
    const answer = (cells[correctAnswerIndex] ?? '').trim();
    const options = alternativeIndexes
      .filter((index) => index >= 0)
      .map((index) => (cells[index] ?? '').trim())
      .filter(Boolean);

    if (!prompt || prompt.length > 500) {
      throw new Error(`La pregunta de la fila ${line} está vacía o supera 500 caracteres.`);
    }
    if (options.length < 2 || options.length > 6 || options.some((option) => option.length > 300)) {
      throw new Error(`La fila ${line} debe incluir entre dos y seis alternativas (máximo 300 caracteres cada una).`);
    }
    const correctOptionIndex = options.findIndex((option) => option === answer);
    if (!answer || correctOptionIndex < 0) {
      throw new Error(
        `La respuestaCorrecta de la fila ${line} debe coincidir exactamente con una de sus alternativas.`,
      );
    }

    return {
      prompt,
      type: 'multiple-choice' as const,
      options,
      correctOptionIndex,
    };
  });

  if (questions.length > MAX_QUESTIONS) {
    throw new Error(`El CSV no puede contener más de ${MAX_QUESTIONS} preguntas.`);
  }
  return questions;
}
