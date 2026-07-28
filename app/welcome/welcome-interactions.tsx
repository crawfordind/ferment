"use client";

import { useEffect } from "react";

/**
 * Progressive enhancement for the /welcome landing page. The markup is fully
 * server-rendered and readable with no JS; this island layers on scroll reveals,
 * the interactive sensory chips, the voice-note "saved" pop, and the ambient
 * health-engine demo. Everything is guarded for `prefers-reduced-motion`.
 */
export function WelcomeInteractions() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".mf-page");
    if (!root) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    // Marks the page as JS-enhanced so the reveal styles engage (they stay
    // invisible only once we can guarantee we'll reveal them).
    root.setAttribute("data-mf-js", "on");

    const cleanups: Array<() => void> = [];

    // Scroll reveals
    const revealEls = Array.from(root.querySelectorAll<HTMLElement>(".mf-reveal"));
    if (reduceMotion || !("IntersectionObserver" in window)) {
      revealEls.forEach((el) => el.classList.add("mf-in"));
    } else {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((en) => {
            if (en.isIntersecting) {
              en.target.classList.add("mf-in");
              io.unobserve(en.target);
            }
          });
        },
        { threshold: 0.14 },
      );
      revealEls.forEach((el) => io.observe(el));
      cleanups.push(() => io.disconnect());
    }

    // Interactive sensory chips
    const chipRow = root.querySelector<HTMLElement>("#mf-chip-row");
    const onChipClick = (e: Event) => {
      const target = e.target as HTMLElement;
      const chip = target.closest<HTMLButtonElement>(".mf-chip");
      if (!chip) return;
      chip.setAttribute(
        "aria-pressed",
        chip.getAttribute("aria-pressed") === "true" ? "false" : "true",
      );
    };
    if (chipRow) {
      chipRow.addEventListener("click", onChipClick);
      cleanups.push(() => chipRow.removeEventListener("click", onChipClick));
    }

    // Voice button -> "saved" confirmation pop
    const voiceBtn = root.querySelector<HTMLButtonElement>("#mf-voice-btn");
    const savePop = root.querySelector<HTMLElement>("#mf-save-pop");
    const onVoiceClick = () => {
      if (reduceMotion || !savePop) return;
      savePop.classList.remove("mf-show");
      void savePop.offsetWidth; // restart the animation
      savePop.classList.add("mf-show");
    };
    if (voiceBtn) {
      voiceBtn.addEventListener("click", onVoiceClick);
      cleanups.push(() => voiceBtn.removeEventListener("click", onVoiceClick));
    }

    // Ambient demo: once the hero card is in view, advance Day 7 -> Day 8 and
    // shift the status from Watch to Needs action, to show the health engine.
    const card = root.querySelector<HTMLElement>("#mf-hero-card");
    if (card && !reduceMotion && "IntersectionObserver" in window) {
      let played = false;
      let timer: ReturnType<typeof setTimeout> | undefined;
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((en) => {
            if (!en.isIntersecting || played) return;
            played = true;
            timer = setTimeout(() => {
              const dayNum = root.querySelector("#mf-day-num");
              const dot = root.querySelector("#mf-status-dot");
              const label = root.querySelector<HTMLElement>("#mf-status-label");
              const note = root.querySelector("#mf-status-note");
              if (dayNum) dayNum.textContent = "8";
              if (dot) dot.className = "mf-status-dot mf-st-action";
              if (label) {
                label.textContent = "Needs action";
                label.style.color = "var(--mf-action)";
              }
              if (note) note.textContent = "strain overdue";
              card.animate(
                [
                  { transform: "scale(1)" },
                  { transform: "scale(1.012)" },
                  { transform: "scale(1)" },
                ],
                { duration: 520, easing: "cubic-bezier(.22,1,.36,1)" },
              );
            }, 2200);
          });
        },
        { threshold: 0.5 },
      );
      io.observe(card);
      cleanups.push(() => {
        io.disconnect();
        if (timer) clearTimeout(timer);
      });
    }

    return () => cleanups.forEach((fn) => fn());
  }, []);

  return null;
}
