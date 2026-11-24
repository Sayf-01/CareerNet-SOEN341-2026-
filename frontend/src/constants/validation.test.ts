import { describe, expect, it } from 'vitest'
import { EMAIL_REGEX } from './validation'

describe('EMAIL_REGEX', () => {
  it('accepts normal emails', () => {
    for (const email of ['ada@example.com', 'a.b@mail.co.uk', 'first+tag@uni.ca', 'ada@x.c']) {
      expect(EMAIL_REGEX.test(email)).toBe(true)
    }
  })

  it('rejects emails with a missing or wrong part', () => {
    for (const email of ['not-an-email', 'ada@example', '@example.com', 'ada@', 'a da@x.com', 'ada@ex ample.com']) {
      expect(EMAIL_REGEX.test(email)).toBe(false)
    }
  })

  it('rejects empty parts around the dots', () => {
    // the old pattern let these through
    expect(EMAIL_REGEX.test('ada@example..com')).toBe(false)
    expect(EMAIL_REGEX.test('ada@.com')).toBe(false)
    expect(EMAIL_REGEX.test('ada@example.com.')).toBe(false)
  })

  it('answers fast on a long bad input (Sonar S5852)', () => {
    // the old pattern took ~0.8 s on this; the new one is instant
    const longBadInput = 'a@' + '.'.repeat(32000) + ' '
    const start = performance.now()
    expect(EMAIL_REGEX.test(longBadInput)).toBe(false)
    expect(performance.now() - start).toBeLessThan(100)
  })
})
