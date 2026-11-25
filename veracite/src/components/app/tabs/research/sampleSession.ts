/**
 * The SAMPLE research session (K32): a real live session on the demo question, recorded with ?record=1 on
 * /research and pasted here, shown read-only under a SAMPLE banner if the venue Wi-Fi or the AI is slow.
 * It is null until a live AI session has been recorded; the button only appears once it exists.
 * Never write or edit a session here by hand: it must be exactly what the agents and the Verifier returned.
 */
import type { RecordedSession } from "@/lib/session/useResearch";

export const SAMPLE_SESSION: RecordedSession | null = null;
