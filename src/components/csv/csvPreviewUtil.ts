export function parsePreview(text: string) {
  const clean = text.replace(/^\ufeff/, '').trim();
  if (!clean) return { headers: [], rows: [], total: 0 };
  const lines = clean.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (!lines.length) return { headers: [], rows: [], total: 0 };
  const sample = lines[0];
  const delim = sample.includes(';') ? ';' : sample.includes('\t') ? '\t' : ',';

  const splitLine = (line: string) => {
    const cols: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        inQuotes = !inQuotes;
      } else if (c === delim && !inQuotes) {
        cols.push(cur.trim());
        cur = '';
      } else {
        cur += c;
      }
    }
    cols.push(cur.trim());
    return cols;
  };

  const headers = splitLine(lines[0]);
  const dataLines = lines.slice(1).filter(l => l.trim().length > 0);
  const rows = dataLines.slice(0, 3).map(splitLine);
  return { headers, rows, total: dataLines.length };
}
