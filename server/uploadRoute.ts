/**
 * File upload route: POST /api/upload
 * Accepts multipart/form-data with a "file" field.
 * Stores the file in S3 via storagePut and returns the URL.
 */
import { type Express } from "express";
import { storagePut } from "./storage";
import { createContext } from "./_core/context";
import { createServer } from "http";

export function registerUploadRoute(app: Express) {
  app.post("/api/upload", async (req, res) => {
    try {
      // Parse multipart manually using raw body approach
      // We use the built-in express raw body parser approach
      const chunks: Buffer[] = [];
      req.on("data", (chunk: Buffer) => chunks.push(chunk));
      req.on("end", async () => {
        try {
          const body = Buffer.concat(chunks);
          const contentType = req.headers["content-type"] || "application/octet-stream";

          // Parse boundary from content-type header
          const boundaryMatch = contentType.match(/boundary=([^\s;]+)/);
          if (!boundaryMatch) {
            res.status(400).json({ error: "No boundary in content-type" });
            return;
          }
          const boundary = boundaryMatch[1];

          // Simple multipart parser
          const boundaryBuf = Buffer.from(`--${boundary}`);
          const parts = splitBuffer(body, boundaryBuf);

          let fileBuffer: Buffer | null = null;
          let fileName = "upload";
          let fileMime = "application/octet-stream";

          for (const part of parts) {
            const headerEnd = indexOfSequence(part, Buffer.from("\r\n\r\n"));
            if (headerEnd === -1) continue;
            const headerStr = part.slice(0, headerEnd).toString("utf8");
            const fileData = part.slice(headerEnd + 4);
            // Remove trailing \r\n
            const cleanData = fileData.slice(0, fileData.length - 2);

            if (headerStr.includes('name="file"')) {
              fileBuffer = cleanData;
              const nameMatch = headerStr.match(/filename="([^"]+)"/);
              if (nameMatch) fileName = nameMatch[1];
              const mimeMatch = headerStr.match(/Content-Type:\s*([^\r\n]+)/i);
              if (mimeMatch) fileMime = mimeMatch[1].trim();
            }
          }

          if (!fileBuffer) {
            res.status(400).json({ error: "No file found in upload" });
            return;
          }

          const key = `canvas-attachments/${Date.now()}-${fileName.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
          const { url } = await storagePut(key, fileBuffer, fileMime);

          res.json({ url, name: fileName, type: fileMime });
        } catch (err: any) {
          console.error("Upload error:", err);
          res.status(500).json({ error: err.message });
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
}

function splitBuffer(buf: Buffer, delimiter: Buffer): Buffer[] {
  const parts: Buffer[] = [];
  let start = 0;
  while (true) {
    const idx = indexOfSequence(buf, delimiter, start);
    if (idx === -1) break;
    if (idx > start) parts.push(buf.slice(start, idx));
    start = idx + delimiter.length;
    // skip \r\n after boundary
    if (buf[start] === 13 && buf[start + 1] === 10) start += 2;
  }
  return parts.filter(p => p.length > 4);
}

function indexOfSequence(buf: Buffer, seq: Buffer, offset = 0): number {
  outer: for (let i = offset; i <= buf.length - seq.length; i++) {
    for (let j = 0; j < seq.length; j++) {
      if (buf[i + j] !== seq[j]) continue outer;
    }
    return i;
  }
  return -1;
}
