import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { formatDate, formatCurrency, localIsoDate } from './format'

describe('formatDate', () => {
  it('turns an ISO date into dd.MM.yyyy without a timezone shift', () => {
    expect(formatDate('2026-09-24')).toBe('24.09.2026')
    expect(formatDate('2026-09-24T23:30:00Z')).toBe('24.09.2026')
  })

  it('treats the 4D empty date and missing values as empty', () => {
    expect(formatDate('!00-00-00!')).toBe('')
    expect(formatDate('0000-00-00')).toBe('')
    expect(formatDate(null)).toBe('')
    expect(formatDate(undefined)).toBe('')
  })
})


describe('formatCurrency', () => {
  it('formats known currencies with Intl, unknown codes as number + code', () => {
    expect(formatCurrency(949, 'EUR')).toMatch(/^949,00\s€$/)
    expect(formatCurrency(12, 'XYZ1')).toBe('12,00 XYZ1')
  })
})

describe('localIsoDate', () => {
  const originalTz = process.env.TZ
  beforeAll(() => {
    process.env.TZ = 'Europe/Vienna'
  })
  afterAll(() => {
    process.env.TZ = originalTz
  })

  it('is the local calendar day, not the UTC one, just after midnight', () => {
    const justAfterMidnight = new Date('2026-09-23T22:30:00Z') // 00:30 in Vienna
    // Counter-check: the UTC slice is still the previous day at this instant.
    expect(justAfterMidnight.toISOString().slice(0, 10)).toBe('2026-09-23')
    expect(localIsoDate(justAfterMidnight)).toBe('2026-09-24')
  })

  it('pads month and day', () => {
    expect(localIsoDate(new Date(2026, 0, 5))).toBe('2026-01-05')
  })
})

