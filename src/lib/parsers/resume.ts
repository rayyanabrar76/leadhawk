// Server-side resume text extraction. Accepts a Buffer + mime type, returns
// plain text. Used by /api/profile/resume to populate profiles.resume_text.

const MAX_TEXT_CHARS = 20_000

export const ALLOWED_MIME = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
} as const

export function isAllowedMime(mime: string): boolean {
  return mime === ALLOWED_MIME.pdf || mime === ALLOWED_MIME.docx
}

export async function parseResume(buffer: Buffer, mimeType: string): Promise<string> {
  if (mimeType === ALLOWED_MIME.pdf) {
    return parsePdf(buffer)
  }
  if (mimeType === ALLOWED_MIME.docx) {
    return parseDocx(buffer)
  }
  throw new Error(`Unsupported mime type: ${mimeType}`)
}

async function parsePdf(buffer: Buffer): Promise<string> {
  // pdf-parse v2 — class-based: `new PDFParse({ data }).getText()`
  const { PDFParse } = await import('pdf-parse')
  const parser = new PDFParse({ data: new Uint8Array(buffer) })
  try {
    const result = await parser.getText()
    return cleanText(result.text)
  } finally {
    await parser.destroy().catch(() => {})
  }
}

async function parseDocx(buffer: Buffer): Promise<string> {
  const mod = await import('mammoth')
  const mammoth = (mod.default ?? mod) as typeof import('mammoth')
  const result = await mammoth.extractRawText({ buffer })
  return cleanText(result.value)
}

function cleanText(raw: string): string {
  return raw
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, MAX_TEXT_CHARS)
}
