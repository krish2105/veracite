import { describe, expect, it } from "vitest";
import { apaRetrieval, assertPublicUrl, checkLive, checkWayback, checkWebSource, extractTitle, isPrivateAddress, parsePublicUrl, webVerdict } from "./check";

const publicDns = async () => ["93.184.216.34"];
const html = (title: string) => `<html><head><title>${title}</title></head><body>x</body></html>`;
const page = (body: string, init: ResponseInit = {}) => new Response(body, { status: 200, headers: { "content-type": "text/html; charset=utf-8" }, ...init });

describe("URL safety (no server-side request forgery)", () => {
  it("flags private, loopback, link-local and metadata addresses", () => {
    for (const ip of ["127.0.0.1", "10.1.2.3", "172.16.0.1", "172.31.255.255", "192.168.1.1", "169.254.169.254", "100.64.0.1", "0.0.0.0", "::1", "fd00::1", "fe80::1", "::ffff:127.0.0.1"]) {
      expect(isPrivateAddress(ip), ip).toBe(true);
    }
    for (const ip of ["93.184.216.34", "8.8.8.8", "172.32.0.1", "2606:4700::1111"]) expect(isPrivateAddress(ip), ip).toBe(false);
  });

  it("rejects non-web schemes, local names, odd ports and credentials before any network call", () => {
    for (const u of ["file:///etc/passwd", "javascript:alert(1)", "ftp://example.org/x", "http://localhost:3000", "http://intranet/", "http://printer.local/", "http://example.org:8080/", "http://user:pw@example.org/", "http://127.0.0.1/", "http://[::1]/", "not a url"]) {
      expect(parsePublicUrl(u).ok, u).toBe(false);
    }
    expect(parsePublicUrl("https://www.unesco.org/en/articles/x").ok).toBe(true);
  });

  it("rejects a public-looking hostname that resolves to a private address (DNS check)", async () => {
    await expect(assertPublicUrl("https://evil.example.com/", async () => ["10.0.0.5"])).rejects.toThrow(/Private or local/);
    await expect(assertPublicUrl("https://ok.example.com/", publicDns)).resolves.toBeInstanceOf(URL);
  });

  it("re-checks every redirect hop, so a public page can't bounce the server to a private one", async () => {
    const fetchMock = (async (u: string) =>
      u.startsWith("https://short.example.com") ? new Response(null, { status: 302, headers: { location: "http://169.254.169.254/latest/meta-data" } }) : page(html("secret"))) as typeof fetch;
    const r = await checkLive("https://short.example.com/x", { fetch: fetchMock, resolve: publicDns });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/Private or local/);
    expect(r.title).toBeUndefined();
  });
});

describe("live check", () => {
  it("follows a safe redirect and reads the title", async () => {
    const fetchMock = (async (u: string) =>
      u === "https://a.example.com/" ? new Response(null, { status: 301, headers: { location: "/final" } }) : page(html("UNESCO &amp; AI guidance"))) as typeof fetch;
    const r = await checkLive("https://a.example.com/", { fetch: fetchMock, resolve: publicDns });
    expect(r).toEqual({ status: 200, ok: true, finalUrl: "https://a.example.com/final", title: "UNESCO & AI guidance" });
  });

  it("reports 404 and network errors honestly", async () => {
    const notFound = (async () => new Response("no", { status: 404, headers: { "content-type": "text/html" } })) as typeof fetch;
    expect((await checkLive("https://b.example.com/", { fetch: notFound, resolve: publicDns })).status).toBe(404);
    const down = (async () => {
      throw new TypeError("fetch failed");
    }) as typeof fetch;
    const r = await checkLive("https://c.example.com/", { fetch: down, resolve: publicDns });
    expect(r).toMatchObject({ status: 0, ok: false, error: "The page could not be reached." });
  });

  it("stops after too many redirects", async () => {
    let n = 0;
    const loop = (async () => new Response(null, { status: 302, headers: { location: `/hop${++n}` } })) as typeof fetch;
    expect((await checkLive("https://d.example.com/", { fetch: loop, resolve: publicDns })).error).toBe("Too many redirects.");
  });
});

describe("title extraction", () => {
  it("prefers og:title, strips tags and entities", () => {
    expect(extractTitle(`<meta property="og:title" content="How to cite ChatGPT"><title>APA Style</title>`)).toBe("How to cite ChatGPT");
    expect(extractTitle(`<meta content="Flipped order" property="og:title">`)).toBe("Flipped order");
    expect(extractTitle(`<title>\n  REST API -\n Crossref </title>`)).toBe("REST API - Crossref");
    expect(extractTitle(`<title>Caf&#233; &#x26; more</title>`)).toBe("Café & more");
    expect(extractTitle(`<html></html>`)).toBeUndefined();
  });
});

describe("Wayback", () => {
  it("returns the closest snapshot over https with an ISO date", async () => {
    const f = (async () =>
      Response.json({ archived_snapshots: { closest: { available: true, status: "200", timestamp: "20260513043030", url: "http://web.archive.org/web/20260513043030/https://u.ae/x" } } })) as typeof fetch;
    expect(await checkWayback("https://u.ae/x", { fetch: f })).toEqual({ available: true, url: "https://web.archive.org/web/20260513043030/https://u.ae/x", capturedAt: "2026-05-13T04:30:30Z" });
  });

  it("no snapshot, a non-200 snapshot, or an API failure → not available", async () => {
    expect(await checkWayback("x", { fetch: (async () => Response.json({ archived_snapshots: {} })) as typeof fetch })).toEqual({ available: false });
    expect(await checkWayback("x", { fetch: (async () => Response.json({ archived_snapshots: { closest: { available: true, status: "404", url: "u" } } })) as typeof fetch })).toEqual({ available: false });
    expect(await checkWayback("x", { fetch: (async () => { throw new Error("down"); }) as typeof fetch })).toEqual({ available: false });
  });
});

describe("verdict and APA", () => {
  it("live or archived → partial, never verified; neither → notfound", () => {
    expect(webVerdict({ status: 200, ok: true }, { available: false }).status).toBe("partial");
    expect(webVerdict({ status: 404, ok: false }, { available: true, url: "u" }).status).toBe("partial");
    const nf = webVerdict({ status: 404, ok: false }, { available: false });
    expect(nf.status).toBe("notfound");
    expect(nf.reasons).toContain("No Wayback Machine copy was found.");
  });

  it("APA 7 retrieval date in Dubai time", () => {
    expect(apaRetrieval("https://x.org/p", "2026-11-24T21:30:00Z")).toBe("Retrieved November 25, 2026, from https://x.org/p");
  });

  it("full check: dead page with an archive copy (like golden web-004)", async () => {
    const f = (async (u: string) =>
      u.startsWith("https://archive.org/")
        ? Response.json({ archived_snapshots: { closest: { available: true, status: "200", timestamp: "20260513043030", url: "http://web.archive.org/web/20260513043030/https://u.ae/x" } } })
        : new Response("gone", { status: 404, headers: { "content-type": "text/html" } })) as typeof fetch;
    const c = await checkWebSource("https://u.ae/x", { fetch: f, resolve: publicDns, now: () => "2026-11-25T08:00:00Z" });
    expect(c.status).toBe("partial");
    expect(c.live.status).toBe(404);
    expect(c.archive.available).toBe(true);
    expect(c.retrieval).toBe("Retrieved November 25, 2026, from https://u.ae/x");
    expect(c.saveUrl).toBe("https://web.archive.org/save/https://u.ae/x");
  });
});
