import { marked } from "marked";

// Configure marked for GitHub Flavored Markdown
marked.setOptions({
  breaks: true,
  gfm: true,
  pedantic: false,
});

/**
 * Parse wikilinks [[node-title]] and convert to internal links
 * Returns both HTML and extracted node references
 */
export function parseWikilinks(text: string): {
  html: string;
  nodeReferences: string[];
} {
  const wikiLinkRegex = /\[\[([^\]]+)\]\]/g;
  const nodeReferences: string[] = [];
  let html = text;

  let match;
  while ((match = wikiLinkRegex.exec(text)) !== null) {
    const nodeTitle = match[1];
    nodeReferences.push(nodeTitle);
    // Replace with markdown link format for marked to process
    html = html.replace(
      match[0],
      `[${nodeTitle}](/search?q=${encodeURIComponent(nodeTitle)})`
    );
  }

  return { html, nodeReferences };
}

/**
 * Convert Markdown with GFM support to HTML
 * Includes callouts, tables, strikethrough, task lists, etc.
 */
export function markdownToHtml(markdown: string): string {
  // Parse wikilinks first
  const { html: withLinks } = parseWikilinks(markdown);

  // Add callout support (GitHub style)
  let processed = withLinks.replace(
    /> \[!(NOTE|WARNING|IMPORTANT|CAUTION|TIP)\]\s*/gi,
    (match, type) => {
      const calloutType = type.toUpperCase();
      return `<div class="callout callout-${calloutType.toLowerCase()}"><strong>${calloutType}:</strong> `;
    }
  );

  // Close callout divs
  processed = processed.replace(/\n(?=\n|$)/g, (match, offset, str) => {
    if (offset > 0 && str[offset - 1] === ">") {
      return "</div>\n";
    }
    return match;
  });

  // Parse with marked (includes GFM)
  const html = marked(processed) as string;

  return html;
}

/**
 * Extract all node references from markdown (wikilinks and mentions)
 */
export function extractNodeReferences(markdown: string): string[] {
  const { nodeReferences } = parseWikilinks(markdown);
  return Array.from(new Set(nodeReferences)); // Remove duplicates
}

/**
 * Convert HTML back to Markdown (basic)
 */
export function htmlToMarkdown(html: string): string {
  // This is a simplified version - for production, use turndown library
  let markdown = html;

  // Remove HTML tags
  markdown = markdown.replace(/<[^>]*>/g, "");

  // Decode HTML entities
  markdown = markdown
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  return markdown;
}

/**
 * Sanitize markdown to prevent XSS
 */
export function sanitizeMarkdown(markdown: string): string {
  // Remove script tags and dangerous content
  return markdown
    .replace(/<script[^>]*>.*?<\/script>/gi, "")
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "")
    .replace(/javascript:/gi, "");
}
