import { describe, it, expect } from "vitest";
import {
  parseWikilinks,
  extractNodeReferences,
  markdownToHtml,
  sanitizeMarkdown,
} from "./markdown";

describe("Markdown Utilities", () => {
  describe("parseWikilinks", () => {
    it("should extract wikilinks from text", () => {
      const text = "Check out [[Project Alpha]] and [[Meeting Notes]]";
      const { nodeReferences } = parseWikilinks(text);
      expect(nodeReferences).toEqual(["Project Alpha", "Meeting Notes"]);
    });

    it("should handle text with no wikilinks", () => {
      const text = "This is just regular text";
      const { nodeReferences } = parseWikilinks(text);
      expect(nodeReferences).toEqual([]);
    });

    it("should convert wikilinks to markdown links", () => {
      const text = "See [[Node Title]]";
      const { html } = parseWikilinks(text);
      expect(html).toContain("[Node Title]");
      expect(html).toContain("/search?q=");
    });
  });

  describe("extractNodeReferences", () => {
    it("should extract unique node references", () => {
      const markdown = "[[Task A]] relates to [[Task B]] and [[Task A]] again";
      const refs = extractNodeReferences(markdown);
      expect(refs).toHaveLength(2);
      expect(refs).toContain("Task A");
      expect(refs).toContain("Task B");
    });

    it("should return empty array for no wikilinks", () => {
      const markdown = "No links here";
      const refs = extractNodeReferences(markdown);
      expect(refs).toEqual([]);
    });
  });

  describe("markdownToHtml", () => {
    it("should convert basic markdown to HTML", () => {
      const markdown = "# Heading\n\n**bold** and *italic*";
      const html = markdownToHtml(markdown);
      expect(html).toContain("<h1>");
      expect(html).toContain("<strong>");
      expect(html).toContain("<em>");
    });

    it("should handle GFM tables", () => {
      const markdown = "| Header 1 | Header 2 |\n|----------|----------|\n| Cell 1   | Cell 2   |";
      const html = markdownToHtml(markdown);
      expect(html).toContain("<table>");
    });

    it("should handle task lists", () => {
      const markdown = "- [x] Completed\n- [ ] Not completed";
      const html = markdownToHtml(markdown);
      expect(html).toContain("li");
    });

    it("should handle strikethrough", () => {
      const markdown = "~~deleted text~~";
      const html = markdownToHtml(markdown);
      expect(html).toContain("del");
    });
  });

  describe("sanitizeMarkdown", () => {
    it("should remove script tags", () => {
      const markdown = "Text <script>alert('xss')</script> more text";
      const sanitized = sanitizeMarkdown(markdown);
      expect(sanitized).not.toContain("<script>");
      expect(sanitized).toContain("Text");
    });

    it("should remove event handlers", () => {
      const markdown = '<div onclick="alert(1)">Click me</div>';
      const sanitized = sanitizeMarkdown(markdown);
      expect(sanitized).not.toContain("onclick");
    });

    it("should remove javascript: URLs", () => {
      const markdown = '<a href="javascript:alert(1)">Click</a>';
      const sanitized = sanitizeMarkdown(markdown);
      expect(sanitized).not.toContain("javascript:");
    });
  });
});
