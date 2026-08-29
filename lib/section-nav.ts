import { getLenis } from "@/components/SmoothScroll";

/**
 * Nav jumps between homepage sections.
 *
 * Travelling to a section used to mean scrolling the whole way there, so
 * choosing "Contact" from the hero dragged the reader back through every
 * pinned sequence in between. Instead the page fades to black, jumps with
 * no animation while nothing is visible, and fades back up in the target
 * section, which arrives already settled.
 *
 * Cover is quicker than reveal on purpose: the exit should feel decisive
 * and the arrival unhurried.
 *
 * Reduced motion gets the jump with no veil.
 */

const COVER_MS = 460;

/* Ordered list of the homepage's navigable sections. */
export const SECTION_IDS = ["about", "work", "skills", "contact"] as const;

/* The work sequence is one long pinned timeline, so jumping to #work lands
   on the pills. 0.80 of its pinned travel puts the reader in the folder's
   hold: past the caption (ends ~0.745) and the background wordmark's colour
   ramp (ends ~0.733), but before the closing blackout (starts ~0.897) — so
   the section arrives fully settled rather than mid-transition. */
export const PIN_VIEWPORTS = 4.2;
const FOLDER_AT = 0.8;

/* The pinned sequence opens on the "I am a…" pills and only becomes the
   Projects folder about half way through: on a 332-unit timeline the
   pills fade out by 166 and the folder has arrived by 212. To a reader
   the pills are the tail of About, not the head of Projects, so the
   scroll index splits the pin here rather than at the section boundary,
   which would have shown the pills as part of Projects. */
export const PILLS_END = 0.52;

/* Skills rows finish as each row's top passes the middle of the viewport.
   The old 0.45 offset was chosen to guarantee that, but the section is
   only ~895px tall: landing 0.45vh in pushed the first two category rows
   clean above the viewport, so the reader arrived at the last row with no
   idea what they had missed. Measured across the range, everything is
   fully revealed from 0.10vh. The section grew when it was scaled up, so
   0.10 is now the setting that keeps the first heading clear of the top
   edge while the last row still lands above the nav bar. */
const SKILLS_OFFSET = 0.1;

/* Contact's reveal is driven by rp = (0.45vh - top) / 0.6vh, which at
   top = 0 is only 0.75 — and "together." does not start until 0.5 and the
   CTA not until 0.72. rp reaches 1 at 0.15vh past the top; 0.22 leaves
   margin. */
const CONTACT_OFFSET = 0.22;

/**
 * Where a section lands, as an absolute page position. Plain blocks land
 * at their own top; the scrubbed sequences land at the offset into their
 * travel where they read as finished rather than mid-transition.
 */
export function sectionTarget(id: string): number | null {
  const el = document.getElementById(id);
  if (!el) return null;
  const start = el.getBoundingClientRect().top + window.scrollY;
  if (id === "work") {
    return start + PIN_VIEWPORTS * window.innerHeight * FOLDER_AT;
  }
  if (id === "skills") return start + window.innerHeight * SKILLS_OFFSET;
  if (id === "contact") return start + window.innerHeight * CONTACT_OFFSET;
  return start;
}

let veilEl: HTMLElement | null = null;

function veil(): HTMLElement {
  if (veilEl?.isConnected) return veilEl;
  veilEl = document.createElement("div");
  veilEl.className = "nav-veil";
  veilEl.setAttribute("aria-hidden", "true");
  document.body.appendChild(veilEl);
  return veilEl;
}

/** Jump the page to `target` with no intermediate scrolling. */
function jump(target: number) {
  const lenis = getLenis();
  if (lenis) lenis.scrollTo(target, { immediate: true, force: true });
  else window.scrollTo(0, target);
}

export function crossFadeTo(target: number) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    jump(target);
    return;
  }

  const el = veil();
  // Force a frame with the veil mounted but transparent, so the browser
  // has a start value to transition from. Without it a freshly created
  // element goes straight to opaque with no fade.
  void el.offsetWidth;
  el.classList.add("is-on");

  window.setTimeout(() => {
    jump(target);
    // Two frames at the destination before revealing: one for the scroll
    // to land, one for every scroll-driven reveal to read its new
    // position and paint its settled state. Uncovering any sooner shows
    // the section mid-way through its own entrance.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => el.classList.remove("is-on"));
    });
  }, COVER_MS);
}
