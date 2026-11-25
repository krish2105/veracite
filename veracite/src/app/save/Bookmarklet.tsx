"use client";

import { useEffect, useRef, useState } from "react";
import { BookmarkPlus } from "lucide-react";
import { bookmarkletHref } from "@/lib/library/bookmarklet";

/**
 * The drag-to-bookmarks button (A15, built in K27). React 19 refuses javascript: hrefs, so the link
 * gets its href from the DOM after it mounts. Clicking it here only explains what to do.
 */
export function SaveBookmarklet() {
  const ref = useRef<HTMLAnchorElement>(null);
  const [hint, setHint] = useState(false);
  useEffect(() => {
    ref.current?.setAttribute("href", bookmarkletHref(window.location.origin));
  }, []);
  return (
    <>
      <div className="xrx-row" style={{ marginTop: 0 }}>
        <a
          ref={ref}
          className="btn primary"
          onClick={(e) => {
            e.preventDefault();
            setHint(true);
          }}
          title="Drag me to your bookmarks bar"
        >
          <BookmarkPlus size={14} /> Save to Veracite
        </a>
        <span className="vx-tiny">Drag this button to your browser&apos;s bookmarks bar.</span>
      </div>
      {hint && <p className="xr-note" role="status">Drag the button to your bookmarks bar instead of clicking it here. Then click the bookmark on any article page.</p>}
      <p className="vx-tiny">
        On an article page, click the bookmark: Veracite reads the page&apos;s DOI (or its address and title), opens here and checks it first. Nothing is saved until you press <b>Add to my list</b>. On a phone, paste the DOI or link above instead.
      </p>
    </>
  );
}
