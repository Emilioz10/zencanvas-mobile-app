/**
 * MermaidBlock — renders a Mermaid diagram from a code string
 * Used inside HebMd for ```mermaid code blocks
 */
import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";

let initialized = false;

function ensureInit() {
  if (!initialized) {
    mermaid.initialize({
      startOnLoad: false,
      theme: "default",
      fontFamily: "'Heebo', 'Assistant', sans-serif",
      fontSize: 14,
      flowchart: { htmlLabels: true, curve: "basis" },
      securityLevel: "loose",
    });
    initialized = true;
  }
}

let diagramCounter = 0;

export default function MermaidBlock({ code }: { code: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [svg, setSvg] = useState<string>("");
  const idRef = useRef(`mermaid-${++diagramCounter}`);

  useEffect(() => {
    ensureInit();
    let cancelled = false;

    async function render() {
      try {
        const { svg: rendered } = await mermaid.render(idRef.current, code.trim());
        if (!cancelled) {
          setSvg(rendered);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "שגיאה בציור הגרף");
        }
      }
    }

    render();
    return () => { cancelled = true; };
  }, [code]);

  if (error) {
    return (
      <div style={{
        background: "#fef2f2", border: "1px solid #fca5a5",
        borderRadius: 8, padding: "10px 14px",
        fontSize: 12, color: "#dc2626", direction: "rtl",
        fontFamily: "monospace",
      }}>
        ⚠️ שגיאה בגרף Mermaid: {error}
        <pre style={{ marginTop: 8, fontSize: 11, color: "#64748b", whiteSpace: "pre-wrap" }}>{code}</pre>
      </div>
    );
  }

  if (!svg) {
    return (
      <div style={{
        background: "#f8fafc", border: "1px solid #e2e8f0",
        borderRadius: 8, padding: 20, textAlign: "center",
        color: "#94a3b8", fontSize: 13,
      }}>
        ⏳ מעבד גרף...
      </div>
    );
  }

  return (
    <div
      ref={ref}
      style={{
        background: "#fff", border: "1px solid #e2e8f0",
        borderRadius: 12, padding: "16px 12px",
        overflowX: "auto", margin: "12px 0",
        textAlign: "center",
      }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
