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

/* Where the pinned Projects sequence has finished fading to black. Its
   blackout tween ends with the pinned timeline itself, so this is simply
   the end of the pinned travel. */
export const PROJECTS_END_VIEWPORTS = PIN_VIEWPORTS;

/* SectionHandoff fades the outgoing section out over the first 46% of a
   range running from (incoming.top - vh) to incoming.top. Skills is
   therefore fully black 0.54vh before Contact's top, which is where the
   index should call it Contact. */
export const HANDOFF_OUT = 0.46;

/* Every section's small title lands the same distance below the top of
   the viewport. This used to be three hand-tuned offsets that drifted
   apart as the sections changed shape — measured at 150px for About,
   117px for Skills and 82px for Contact — because each was tuned against
   that section's own padding rather than against the thing the reader
   actually sees. The target is now computed from the label's position,
   so the clearance holds whatever the padding does. */
export const LABEL_CLEARANCE = 112;

/* Fallback travel for a section with no label of its own. A section that
   has one is positioned by its label, full stop: an earlier version took
   the greater of the two, which on a short viewport pushed Skills 48px
   PAST its clearance and put its title at 64px while the others sat at
   112. The clearance is the thing the reader sees, so it decides. */
const MIN_TRAVEL: Record<string, number> = {
  skills: 0.06,
  contact: 0.06,
};



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

  // Put the section's own small title exactly LABEL_CLEARANCE below the
  // top of the viewport. Sections without a label fall back to a fixed
  // share of the viewport.
  const label = el.querySelector<HTMLElement>(".section-label");
  if (!label) return start + window.innerHeight * (MIN_TRAVEL[id] ?? 0);

  const labelTop = label.getBoundingClientRect().top + window.scrollY;
  return labelTop - LABEL_CLEARANCE;
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

/**
 * Scroll all the way back to the top, travelling the page rather than
 * cutting to it. The cross-fade exists so a nav jump does not drag the
 * reader through every pinned sequence in between; going home from the
 * foot of the page is the opposite case, where seeing the page rewind is
 * the point.
 *
 * Duration scales with the distance actually being covered, so it reads
 * at a steady pace instead of racing on a long page and crawling on a
 * short one, and it is capped so it can never become a chore.
 */
export function smoothToTop() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    window.scrollTo(0, 0);
    return;
  }
  const lenis = getLenis();
  const distance = window.scrollY;
  const duration = Math.min(3.2, Math.max(1.4, distance / 3200));
  if (lenis) {
    lenis.scrollTo(0, { duration, easing: (x: number) => 1 - Math.pow(1 - x, 3) });
  } else {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}
