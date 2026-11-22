import { describe, expect, it } from 'vitest'
import {
  MAX_RESUME_SIZE,
  RESUME_VALIDATION_ERROR,
  validateResumeFile,
} from './resumeRules'

const DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

describe('validateResumeFile', () => {
  it('accepts a PDF, DOC and DOCX', () => {
    expect(validateResumeFile(new File(['x'], 'a.pdf', { type: 'application/pdf' }))).toBeNull()
    expect(validateResumeFile(new File(['x'], 'a.doc', { type: 'application/msword' }))).toBeNull()
    expect(validateResumeFile(new File(['x'], 'a.DOCX', { type: DOCX }))).toBeNull()
  })

  it('accepts a Word file when the browser gives no MIME type', () => {
    expect(validateResumeFile(new File(['x'], 'a.docx', { type: '' }))).toBeNull()
  })

  it('rejects a file without an extension', () => {
    expect(validateResumeFile(new File(['x'], 'resume'))).toBe(RESUME_VALIDATION_ERROR)
  })

  it('rejects an unsupported extension', () => {
    expect(validateResumeFile(new File(['x'], 'a.txt', { type: 'text/plain' }))).toBe(
      RESUME_VALIDATION_ERROR,
    )
  })

  it('rejects a file whose MIME type does not match its extension', () => {
    expect(validateResumeFile(new File(['x'], 'a.pdf', { type: 'image/png' }))).toBe(
      RESUME_VALIDATION_ERROR,
    )
  })

  it('rejects an empty file', () => {
    expect(validateResumeFile(new File([], 'a.pdf', { type: 'application/pdf' }))).toBe(
      RESUME_VALIDATION_ERROR,
    )
  })

  it('rejects a file over 5 MB but accepts exactly 5 MB', () => {
    const big = new File([new Uint8Array(MAX_RESUME_SIZE + 1)], 'a.pdf', { type: 'application/pdf' })
    const exact = new File([new Uint8Array(MAX_RESUME_SIZE)], 'a.pdf', { type: 'application/pdf' })
    expect(validateResumeFile(big)).toBe(RESUME_VALIDATION_ERROR)
    expect(validateResumeFile(exact)).toBeNull()
  })
})
