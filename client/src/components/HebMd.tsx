/**
 * HebMd — Hebrew-first GitHub Flavored Markdown renderer
 *
 * Features:
 * - RTL by default (Hebrew text auto-detected)
 * - H1–H5 hierarchy matching the user's visual spec (היררכיית-כותרות-בעברית.jpg)
 * - GFM: tables, task lists, strikethrough, autolinks
 * - Syntax-highlighted code blocks
 * - Colored callout blocks: NOTE / WARNING / IMPORTANT / TIP / CAUTION
 * - Wikilinks [[title]] rendered as internal links
 */

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import type { Components } from "react-markdown";
import "highlight.js/styles/github.css";

// ── Callout detection ────────────────────────────────────────────────────────
const CALLOUT_REGEX = /^\[!(NOTE|WARNING|IMPORTANT|TIP|CAUTION)\]\s*(.*)/i;
const CALLOUT_STYLES: Record<string, { bg: string; border: string; icon: string; label: string }> = {
  NOTE:      { bg: "#eff6ff", border: "#3b82f6", icon: "ℹ️", label: "הערה" },
  TIP:       { bg: "#f0fdf4", border: "#22c55e", icon: "💡", label: "טיפ" },
  IMPORTANT: { bg: "#faf5ff", border: "#a855f7", icon: "⚠️", label: "חשוב" },
  WARNING:   { bg: "#fffbeb", border: "#f59e0b", icon: "⚡", label: "אזהרה" },
  CAUTION:   { bg: "#fff1f2", border: "#f43f5e", icon: "🚨", label: "זהירות" },
};

// ── Wikilink pre-processing ──────────────────────────────────────────────────
function preprocessWikilinks(text: string): string {
  return text.replace(/\[\[([^\]]+)\]\]/g, (_, title) => {
    const slug = encodeURIComponent(title.trim());
    return `[${title}](/search?q=${slug})`;
  });
}

// ── RTL detection ────────────────────────────────────────────────────────────
function isHebrew(text: string): boolean {
  return /[\u0590-\u05FF]/.test(text);
}

// ── Custom components ────────────────────────────────────────────────────────
const components: Components = {
  // H1 — ממורכזת ומודגשת, הטקסט מתחיל בהזחה
  h1: ({ children }) => (
    <h1
      dir="rtl"
      style={{
        fontSize: "1.75rem",
        fontWeight: 800,
        color: "#1e293b",
        borderBottom: "3px solid #6366f1",
        paddingBottom: "0.35em",
        marginTop: "1.5em",
        marginBottom: "0.75em",
        letterSpacing: "-0.01em",
      }}
    >
      {children}
    </h1>
  ),

  // H2 — מוצמדת לימין ומודגשת, הטקסט מתחיל בהזחה
  h2: ({ children }) => (
    <h2
      dir="rtl"
      style={{
        fontSize: "1.4rem",
        fontWeight: 700,
        color: "#1e293b",
        borderRight: "4px solid #6366f1",
        paddingRight: "0.6em",
        marginTop: "1.3em",
        marginBottom: "0.6em",
      }}
    >
      {children}
    </h2>
  ),

  // H3 — מוצמדת לימין, מודגשת ומוטה, הטקסט מתחיל בהזחה
  h3: ({ children }) => (
    <h3
      dir="rtl"
      style={{
        fontSize: "1.2rem",
        fontWeight: 700,
        fontStyle: "italic",
        color: "#334155",
        borderRight: "3px solid #a5b4fc",
        paddingRight: "0.5em",
        marginTop: "1.1em",
        marginBottom: "0.5em",
      }}
    >
      {children}
    </h3>
  ),

  // H4 — מוצמדת, מודגשת ומסתיימת עם נקודה
  h4: ({ children }) => (
    <h4
      dir="rtl"
      style={{
        fontSize: "1.05rem",
        fontWeight: 700,
        color: "#475569",
        marginTop: "1em",
        marginBottom: "0.4em",
      }}
    >
      {children}.
    </h4>
  ),

  // H5 — מוצמדת, מודגשת ומוטה, מסתיימת עם נקודה
  h5: ({ children }) => (
    <h5
      dir="rtl"
      style={{
        fontSize: "0.95rem",
        fontWeight: 700,
        fontStyle: "italic",
        color: "#64748b",
        marginTop: "0.9em",
        marginBottom: "0.3em",
      }}
    >
      {children}.
    </h5>
  ),

  // Paragraphs — auto RTL + callout detection
  p: ({ children }) => {
    // Extract plain text from children for detection
    const extractText = (c: React.ReactNode): string => {
      if (typeof c === "string") return c;
      if (Array.isArray(c)) return c.map(extractText).join("");
      if (c && typeof c === "object" && "props" in (c as any)) {
        return extractText((c as any).props?.children ?? "");
      }
      return "";
    };
    const text = extractText(children);
    const match = text.match(CALLOUT_REGEX);
    if (match) {
      const type = match[1].toUpperCase();
      const body = match[2];
      const style = CALLOUT_STYLES[type] ?? CALLOUT_STYLES.NOTE;
      return (
        <div
          dir="rtl"
          style={{
            background: style.bg,
            borderRight: `4px solid ${style.border}`,
            borderRadius: "0 8px 8px 0",
            padding: "10px 14px",
            margin: "12px 0",
            display: "flex",
            gap: 8,
            alignItems: "flex-start",
          }}
        >
          <span style={{ fontSize: 16 }}>{style.icon}</span>
          <div>
            <strong style={{ color: style.border, fontSize: "0.85rem", display: "block", marginBottom: 2 }}>
              {style.label}
            </strong>
            <span style={{ fontSize: "0.9rem", color: "#334155" }}>{body}</span>
          </div>
        </div>
      );
    }
    const dir = isHebrew(text) ? "rtl" : "ltr";
    return (
      <p dir={dir} style={{ margin: "0.6em 0", lineHeight: 1.7, fontSize: "0.95rem", color: "#334155" }}>
        {children}
      </p>
    );
  },

  // Blockquotes
  blockquote: ({ children }) => (
    <blockquote
      dir="rtl"
      style={{
        borderRight: "4px solid #cbd5e1",
        paddingRight: "1em",
        margin: "0.75em 0",
        color: "#64748b",
        fontStyle: "italic",
      }}
    >
      {children}
    </blockquote>
  ),

  // Code blocks
  code: ({ className, children, ...props }) => {
    const isBlock = !!className;
    if (isBlock) {
      return (
        <code
          className={className}
          {...props}
          style={{
            display: "block",
            borderRadius: 8,
            fontSize: "0.82rem",
            direction: "ltr",
            textAlign: "left",
          }}
        >
          {children}
        </code>
      );
    }
    return (
      <code
        style={{
          background: "#f1f5f9",
          borderRadius: 4,
          padding: "1px 5px",
          fontSize: "0.85em",
          color: "#7c3aed",
          fontFamily: "monospace",
          direction: "ltr",
        }}
      >
        {children}
      </code>
    );
  },

  pre: ({ children }) => (
    <pre
      style={{
        background: "#f8fafc",
        border: "1px solid #e2e8f0",
        borderRadius: 10,
        padding: "12px 16px",
        overflowX: "auto",
        margin: "0.75em 0",
        direction: "ltr",
        textAlign: "left",
      }}
    >
      {children}
    </pre>
  ),

  // Lists
  ul: ({ children }) => (
    <ul dir="rtl" style={{ paddingRight: "1.4em", paddingLeft: 0, margin: "0.5em 0", listStyleType: "disc" }}>
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol dir="rtl" style={{ paddingRight: "1.4em", paddingLeft: 0, margin: "0.5em 0" }}>
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li style={{ margin: "0.25em 0", lineHeight: 1.6, fontSize: "0.95rem", color: "#334155" }}>
      {children}
    </li>
  ),

  // Tables
  table: ({ children }) => (
    <div style={{ overflowX: "auto", margin: "0.75em 0" }}>
      <table
        dir="rtl"
        style={{
          borderCollapse: "collapse",
          width: "100%",
          fontSize: "0.9rem",
        }}
      >
        {children}
      </table>
    </div>
  ),
  th: ({ children }) => (
    <th
      style={{
        background: "#f1f5f9",
        border: "1px solid #e2e8f0",
        padding: "8px 12px",
        fontWeight: 700,
        textAlign: "right",
        color: "#1e293b",
      }}
    >
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td
      style={{
        border: "1px solid #e2e8f0",
        padding: "7px 12px",
        textAlign: "right",
        color: "#334155",
      }}
    >
      {children}
    </td>
  ),

  // Links
  a: ({ href, children }) => (
    <a
      href={href}
      style={{ color: "#6366f1", textDecoration: "underline", textUnderlineOffset: 2 }}
    >
      {children}
    </a>
  ),

  // Horizontal rule
  hr: () => (
    <hr style={{ border: "none", borderTop: "1.5px solid #e2e8f0", margin: "1.2em 0" }} />
  ),

  // Strong / Em
  strong: ({ children }) => (
    <strong style={{ fontWeight: 700, color: "#1e293b" }}>{children}</strong>
  ),
  em: ({ children }) => (
    <em style={{ fontStyle: "italic", color: "#475569" }}>{children}</em>
  ),
};

// ── Main export ──────────────────────────────────────────────────────────────
interface HebMdProps {
  children: string;
  className?: string;
}

export default function HebMd({ children, className }: HebMdProps) {
  const processed = preprocessWikilinks(children ?? "");
  const dir = isHebrew(processed) ? "rtl" : "ltr";

  return (
    <div
      dir={dir}
      className={className}
      style={{ fontFamily: '"Heebo", "Arial Hebrew", Arial, sans-serif' }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={components}
      >
        {processed}
      </ReactMarkdown>
    </div>
  );
}
