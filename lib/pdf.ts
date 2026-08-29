/**
 * Shared PDF.js loader for the case decks. One document promise is cached
 * per URL so every page/thumbnail of the same deck reuses a single
 * getDocument task. Range requests are enabled (disableAutoFetch), so
 * PDF.js pulls only the bytes for the pages actually viewed rather than
 * the whole file — the compressed masters are still tens of MB.
 *
 * Client-only: pdfjs-dist touches the DOM/Worker, so it is imported
 * dynamically the first time a page renders.
 */
type Pdfjs = typeof import("pdfjs-dist");
type PDFDocumentProxy = Awaited<ReturnType<Pdfjs["getDocument"]>["promise"]>;

let pdfjsPromise: Promise<Pdfjs> | null = null;
const docCache = new Map<string, Promise<PDFDocumentProxy>>();

async function getPdfjs(): Promise<Pdfjs> {
  if (!pdfjsPromise) {
    pdfjsPromise = import("pdfjs-dist").then((lib) => {
      // Version-matched worker copied to /public by the build.
      lib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
      return lib;
    });
  }
  return pdfjsPromise;
}

export async function getPdf(url: string): Promise<PDFDocumentProxy> {
  let doc = docCache.get(url);
  if (!doc) {
    doc = getPdfjs().then(
      (lib) =>
        lib.getDocument({
          url,
          rangeChunkSize: 262144,
          disableAutoFetch: true,
          disableStream: false,
        }).promise,
    );
    docCache.set(url, doc);
  }
  return doc;
}
