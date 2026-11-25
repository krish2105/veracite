# Veracite public API and MCP server (K13)

Free, no key, read-only. Code only: every answer comes from Crossref, OpenAlex and arXiv, never from an AI model.

## 1. `GET /api/v1/verify`
```bash
curl "https://veracite.vercel.app/api/v1/verify?doi=10.1038/nature14539"
curl "https://veracite.vercel.app/api/v1/verify?ref=LeCun, Y., Bengio, Y., & Hinton, G. (2015). Deep learning. Nature, 521, 436–444."
```
Answer (shortened):
```json
{ "ok": true, "api": "veracite/v1", "status": "verified", "label": "Verified",
  "exists": true, "verified": true, "retracted": false, "retraction": null,
  "record": { "title": "Deep learning", "authors": ["LeCun, Yann", "Bengio, Yoshua", "Hinton, Geoffrey"], "year": 2015, "venue": "Nature", "doi": "10.1038/nature14539" },
  "registries": ["crossref", "openalex"], "reasons": ["…"], "note": "Checked by code … No AI was used." }
```
- `exists`: a real record matches what was cited (not retracted, not stitched together). `verified`: two registries agree on title, first author and year. A DOI alone exists but is not `verified` (nothing to compare).
- `record` is the registry's record, never the cited text; `null` for chimeras, retractions and not-found references.
- Open CORS. DOI answers are cached at the edge for an hour. Errors: `400` bad input, `502` a registry did not answer.

## 2. MCP server: `POST /api/mcp`
Veracite as a remote MCP server (Streamable HTTP, stateless, JSON responses). Add `https://veracite.vercel.app/api/mcp` as a custom connector in an MCP client. One tool:

| Tool | Input | Returns |
|---|---|---|
| `verify_reference` | `doi` or `reference` (full text) | the same verdict as `/api/v1/verify`, as text + `structuredContent` |

The server's instructions tell the assistant: verify every paper before citing it, cite only `exists: true`, and use the returned record. This is how an AI checks before it cites, instead of inventing a reference.

```bash
curl -X POST https://veracite.vercel.app/api/mcp -H "Content-Type: application/json" -H "Accept: application/json, text/event-stream" \
  --data '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"verify_reference","arguments":{"doi":"10.1056/NEJMoa2007621"}}}'
# → "Retracted. exists: false · verified: false · retracted: true …"
```
