import * as pdfjsLib from 'pdfjs-dist'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import mammoth from 'mammoth'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker

async function extractPdfText(file) {
  const buffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise
  const pages = []

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const pageText = content.items.map((item) => item.str).join(' ')
    pages.push(pageText)
  }

  return pages.join('\n\n')
}

async function extractDocxText(file) {
  const buffer = await file.arrayBuffer()
  const result = await mammoth.extractRawText({ arrayBuffer: buffer })
  return result.value
}

async function extractTxtText(file) {
  return file.text()
}

export async function extractTextFromFile(file) {
  const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase()

  if (ext === '.pdf' || file.type === 'application/pdf') {
    return extractPdfText(file)
  }

  if (
    ext === '.docx' ||
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    return extractDocxText(file)
  }

  if (ext === '.txt' || file.type === 'text/plain') {
    return extractTxtText(file)
  }

  throw new Error('Unsupported file type. Please upload PDF, DOCX, or TXT.')
}
