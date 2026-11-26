/**
 * The reference list as a stand-alone A4 page (K56). The browser's own print dialog turns it into a PDF
 * ("Save as PDF"), so no PDF library is needed and nothing leaves the device.
 */
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function printDoc(listHtml: string, title: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title><style>
@page { size: A4; margin: 25mm; }
body { font-family: "Times New Roman", Times, serif; font-size: 12pt; line-height: 1.5; color: #000; margin: 0; }
p { orphans: 3; widows: 3; }
.src { margin-top: 18pt; font-size: 9pt; color: #444; border-top: .5pt solid #999; padding-top: 6pt; }
</style></head><body>${listHtml}<p class="src">Formatted by Veracite from public registry records (Crossref, OpenAlex, arXiv). Check capitalisation and details against your style guide before you submit.</p></body></html>`;
}

/** Open the browser's print dialog on that page, through a hidden frame (no pop-up window). */
export function printAsPdf(listHtml: string, title: string): void {
  const frame = document.createElement("iframe");
  Object.assign(frame.style, { position: "fixed", right: "0", bottom: "0", width: "0", height: "0", border: "0" });
  frame.setAttribute("aria-hidden", "true");
  frame.srcdoc = printDoc(listHtml, title);
  frame.onload = () => {
    frame.contentWindow?.focus();
    frame.contentWindow?.print();
    setTimeout(() => frame.remove(), 60_000); // the dialog is modal in most browsers; keep the frame until it is long done
  };
  document.body.appendChild(frame);
}
