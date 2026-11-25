import type { Metadata, Viewport } from "next";
import { fontVariables } from "./fonts";
import "./globals.css";
import "./app.css";

export const metadata: Metadata = {
  title: "Veracite · honest AI research assistant",
  description: "Every reference real. Every claim traceable. You stay in charge.",
};

/** Daylight is ours to draw: browsers must not repaint it for a phone in dark mode (see globals.css). */
export const viewport: Viewport = { colorScheme: "only light", themeColor: "#EDF1EE" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${fontVariables} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
