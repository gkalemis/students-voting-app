export interface CsvRow {
  period?: string;
  course?: string;
  group?: string;
  full_name?: string;
  presentation_title?: string;
}

export function parseCsvText(raw: string): string[][] {
  const clean = raw.replace(/^\ufeff/, '').trim();
  if (!clean) return [];

  const lines = clean.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (!lines.length) return [];

  // Detect delimiter: comma, semicolon, or tab
  const sample = lines[0];
  const semiCount = (sample.match(/;/g) || []).length;
  const tabCount = (sample.match(/\t/g) || []).length;
  const commaCount = (sample.match(/,/g) || []).length;

  let delim = ',';
  if (semiCount > commaCount && semiCount >= tabCount) delim = ';';
  else if (tabCount > commaCount && tabCount > semiCount) delim = '\t';

  return lines.map(line => {
    const row: string[] = [];
    let insideQuotes = false;
    let current = '';

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (insideQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === delim && !insideQuotes) {
        row.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    row.push(current.trim());
    return row;
  });
}

function normalizeHeader(h: string): string {
  const norm = h.toLowerCase().trim();
  if (/^(μάθημα|μαθημα|course)/.test(norm)) return 'course';
  if (/^(περίοδος|περιοδος|ακαδημαϊκή|period|semester)/.test(norm)) return 'period';
  if (/^(ομάδα|ομαδα|τμήμα|group|section)/.test(norm)) return 'group';
  if (/^(φοιτητής|φοιτητης|ονοματεπώνυμο|ονομα|student|name|presenter|full_name)/.test(norm)) return 'full_name';
  if (/^(θέμα|θεμα|τίτλος|τιτλος|παρουσίαση|topic|title|subject)/.test(norm)) return 'presentation_title';
  return norm;
}

export function extractRows(matrix: string[][], mode: 'hierarchy' | 'students'): CsvRow[] {
  if (!matrix.length) return [];

  const firstRow = matrix[0];
  const hasHeaders = firstRow.some(col =>
    /μάθημα|μαθημα|περίοδος|ομάδα|φοιτητής|ονομα|course|period|group|student|name|title/i.test(col)
  );

  let headerMap: Record<number, string> = {};
  let startIndex = 0;

  if (hasHeaders) {
    firstRow.forEach((col, idx) => {
      headerMap[idx] = normalizeHeader(col);
    });
    startIndex = 1;
  } else {
    if (mode === 'students') {
      headerMap = { 0: 'full_name', 1: 'presentation_title' };
    } else {
      if (firstRow.length >= 5) {
        headerMap = { 0: 'period', 1: 'course', 2: 'group', 3: 'full_name', 4: 'presentation_title' };
      } else if (firstRow.length === 4) {
        headerMap = { 0: 'period', 1: 'course', 2: 'group', 3: 'full_name' };
      } else if (firstRow.length === 3) {
        headerMap = { 0: 'period', 1: 'course', 2: 'group' };
      } else {
        headerMap = { 0: 'full_name', 1: 'presentation_title' };
      }
    }
  }

  const results: CsvRow[] = [];
  for (let i = startIndex; i < matrix.length; i++) {
    const rawRow = matrix[i];
    const rowObj: CsvRow = {};
    for (let c = 0; c < rawRow.length; c++) {
      const field = headerMap[c];
      const val = (rawRow[c] || '').trim();
      if (field && val) {
        (rowObj as any)[field] = val;
      }
    }
    if (rowObj.full_name || rowObj.course || rowObj.group) {
      results.push(rowObj);
    }
  }
  return results;
}
