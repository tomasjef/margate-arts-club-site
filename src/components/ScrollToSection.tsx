"use client";

import { useEffect } from "react";

// The legal pages are one long page (see LegalPage), so /accessibility and /company open at their own part of it: on phones at its
// name above its box, on tablets and desktop (where that name is hidden) at its part of the one box
export function ScrollToSection({ id }: { id: string }) {
  useEffect(() => {
    const phone = window.matchMedia("(max-width: 767px)").matches;
    (phone ? document.getElementById(id) : document.querySelector(`[data-legal="${id}"]`))?.scrollIntoView();
  }, [id]);
  return null;
}
