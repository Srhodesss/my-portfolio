// pdfjs-dist 5.6.205 calls Map/WeakMap.prototype.getOrInsertComputed (a
// TC39 proposal method not yet shipped in every Safari this site is
// tested on) — confirmed by grepping node_modules/pdfjs-dist's built
// output, which is what silently blanked the deck viewer there: the
// render promise rejected on the missing method and PdfPage.tsx's catch
// swallowed it identically to an intentional cancel. Real, spec-shim
// polyfills (not a hand-rolled version) for the main thread, which Next
// bundles normally; the worker needs its own copy, since it runs in a
// separate global scope these don't reach — see pdf.worker.entry.mjs /
// pdfjs-worker-polyfills.mjs in public/.
import "weakmap.prototype.getorinsertcomputed/auto";
import "map.prototype.getorinsertcomputed/auto";

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
      // Version-matched worker copied to /public by the build. Loaded
      // through the wrapper entry so the worker's own realm gets the
      // getOrInsertComputed polyfill before the real worker script runs
      // — see the comment above and pdf.worker.entry.mjs.
      lib.GlobalWorkerOptions.workerSrc = "/pdf.worker.entry.mjs";
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
