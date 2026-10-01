// pdfjs-dist (the copy in build/pdf.worker.min.mjs, see lib/pdf.ts) calls
// Map/WeakMap.prototype.getOrInsertComputed — a TC39 proposal method too
// new for Safari on the device this broke on, silently swallowed by
// PdfPage.tsx's render catch as an indistinguishable blank canvas.
//
// This file exists only because that worker script is a static file
// pdf.worker.entry.mjs imports raw, not bundled by Next — the app's own
// code gets the real npm shims (weakmap.prototype.getorinsertcomputed,
// map.prototype.getorinsertcomputed) via lib/pdf.ts instead, since those
// run through Next's bundler and can pull in their real dependency
// chain. Both packages' own algorithm is exactly this get-or-compute-
// and-insert; hand-written here rather than trying to bundle a
// CommonJS-based shim into a static worker script for the same three
// lines.
if (!Map.prototype.getOrInsertComputed) {
  Map.prototype.getOrInsertComputed = function (key, callback) {
    if (!this.has(key)) this.set(key, callback(key));
    return this.get(key);
  };
}
if (typeof WeakMap !== "undefined" && !WeakMap.prototype.getOrInsertComputed) {
  WeakMap.prototype.getOrInsertComputed = function (key, callback) {
    if (!this.has(key)) this.set(key, callback(key));
    return this.get(key);
  };
}
