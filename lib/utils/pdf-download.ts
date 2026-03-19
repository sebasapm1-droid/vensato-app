/**
 * Generates a PDF blob from a React-PDF document and triggers a browser download.
 * This bypasses PDFDownloadLink's SSR/dynamic-import compatibility issues in Next.js.
 */
export async function downloadPDF(
  documentElement: React.ReactElement,
  fileName: string
) {
  // Dynamically import to keep it client-side only
  const { pdf } = await import("@react-pdf/renderer");
  const blob = await pdf(documentElement).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
