// The actual workerSrc (see lib/pdf.ts). A module worker's own top-level
// imports run in the worker's own global scope, which is a separate
// realm from the main thread — a polyfill applied on the page's own
// window (lib/pdf.ts's static imports) never reaches code running in
// here, so it has to be re-applied on this side of the boundary too,
// before pdf.worker.min.mjs's own top-level code (which calls
// getOrInsertComputed while setting up its message handler) runs.
import "./pdfjs-worker-polyfills.mjs";
import "./pdf.worker.min.mjs";
