import { describe, expect, it } from 'vitest'
import { toCSV } from '../../app/utils/csv'

describe('toCSV', () => {
  it('quotes every cell and escapes quotes', () => {
    expect(toCSV([['a', 'b,c', 'say "hi"'], [1, null, undefined]]))
      .toBe('"a","b,c","say ""hi"""\n"1","",""')
  })

  it('neutralizes spreadsheet formulas', () => {
    for (const value of ['=1+1', '+1', '-1', '@SUM(A1)', ' =1', '\t=1', '\r=1', '\u0000=1']) {
      expect(toCSV([[value]])).toBe(`"'${value.replace(/"/g, '""')}"`)
    }
  })

  it('leaves numbers and plain text alone', () => {
    expect(toCSV([[-2.5, '/docs/getting-started', 'a=b']])).toBe('"-2.5","/docs/getting-started","a=b"')
  })
})
