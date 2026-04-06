import { PDFParse } from "pdf-parse";
import { getDownloadUrl } from "@/lib/r2";

const MAX_EXTRACTED_LENGTH = 6000;

export async function extractTextFromPDF(r2Key: string): Promise<string | null> {
  try {
    const url = await getDownloadUrl(r2Key, 60);
    const response = await fetch(url);

    if (!response.ok) {
      console.error("[document-extractor] PDF download failed:", response.status);
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    const parser = new PDFParse({ data: Buffer.from(arrayBuffer) });

    try {
      const parsed = await parser.getText();
      const cleaned = parsed.text.replace(/\s+/g, " ").trim();

      return cleaned.slice(0, MAX_EXTRACTED_LENGTH);
    } finally {
      await parser.destroy().catch(() => undefined);
    }
  } catch (error) {
    console.error("[document-extractor] PDF extraction failed:", error);
    return null;
  }
}
