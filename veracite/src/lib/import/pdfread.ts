"use client";

/**
 * Read a PDF's text in the browser with pdf.js (K37). Nothing is uploaded. Loaded only when a student drops a
 * PDF. pdf.js's worker module is imported into the page, so it runs on the main thread with no separate file.
 */
import { linesFromItems } from "./pdftext";

export const MAX_PDF_BYTES = 20_000_000;
const MAX_PAGES = 80;

export async function readPdfText(file: File, onPage?: (done: number, total: number) => void): Promise<{ text: string; pages: number; read: number }> {
  const [pdfjs] = await Promise.all([import("pdfjs-dist"), import("pdfjs-dist/build/pdf.worker.min.mjs")]);
  const task = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
  const doc = await task.promise;
  const read = Math.min(doc.numPages, MAX_PAGES);
  const lines: string[] = [];
  try {
    for (let i = 1; i <= read; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      const items = content.items.flatMap((it) => ("str" in it ? [{ str: it.str, x: it.transform[4], y: it.transform[5] }] : []));
      lines.push(...linesFromItems(items));
      onPage?.(i, read);
    }
  } finally {
    await task.destroy();
  }
  return { text: lines.join("\n"), pages: doc.numPages, read };
}
