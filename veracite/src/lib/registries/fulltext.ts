/**
 * Free full text (K33): a legal open-access copy, only when a registry reports one. Pure; never guesses a link.
 * arXiv preprints always have a free PDF; other works use the open-access location OpenAlex reports
 * (OpenAlex now runs on the same data as Unpaywall).
 */
export interface FullText {
  url: string;
  kind: "pdf" | "page";
  via: "arXiv" | "open-access copy";
}

const ARXIV = /^10\.48550\/arxiv\.(.+)$/i;

export function fullTextLink(r: { doi?: string; oaUrl?: string; openAccess?: boolean }): FullText | undefined {
  const ax = r.doi?.match(ARXIV)?.[1];
  if (ax) return { url: `https://arxiv.org/pdf/${ax}`, kind: "pdf", via: "arXiv" };
  if (!r.oaUrl) return undefined;
  let u: URL;
  try {
    u = new URL(r.oaUrl);
  } catch {
    return undefined;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return undefined;
  return { url: u.toString(), kind: /\.pdf($|\?)|\/pdf\//i.test(u.pathname + u.search) ? "pdf" : "page", via: "open-access copy" };
}
