/** Spreadsheets evaluate a cell as a formula when its first visible character is one of these. */
function isFormula(text: string): boolean {
  for (const char of text) {
    if (char.charCodeAt(0) <= 32) continue
    return '=+-@'.includes(char)
  }
  return false
}

function csvCell(value: unknown): string {
  let text = value == null ? '' : String(value)
  if (typeof value === 'string' && isFormula(text)) text = `'${text}`
  return `"${text.replace(/"/g, '""')}"`
}

export function toCSV(rows: unknown[][]): string {
  return rows.map(row => row.map(csvCell).join(',')).join('\n')
}
