"use client";

import { setCiteStyle, useCiteStyle } from "@/lib/cite/styleStore";
import { isCiteStyle, STYLE_ORDER, STYLES } from "@/lib/cite/styles";

/** Citation style picker (K29). The choice is shared by the X-ray list, Write & cite and the Library. */
export function StyleSelect({ id = "vx-cite-style" }: { id?: string }) {
  const style = useCiteStyle();
  return (
    <label className="vx-style" htmlFor={id}>
      <span className="vx-tiny" style={{ margin: 0 }}>Citation style</span>
      <select id={id} value={style} onChange={(e) => isCiteStyle(e.target.value) && setCiteStyle(e.target.value)}>
        {STYLE_ORDER.map((s) => (
          <option key={s} value={s}>
            {STYLES[s].label}
            {s === "chicago" ? " (author-date)" : s === "harvard" ? " (Cite Them Right)" : ""}
          </option>
        ))}
      </select>
    </label>
  );
}
