"use client";

import type { ReactNode } from "react";
import { emailParts } from "@/lib/site";

// A link that opens the visitor's email app without the address ever being in the page: it is not in the HTML
// (no mailto: link, no written address), and is put together only when the link is pressed, so address-harvesting
// bots reading the page find nothing to collect. Without JavaScript the link does nothing.
export function EmailLink({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <a
      href="#email"
      onClick={(e) => {
        e.preventDefault();
        window.location.href = `mailto:${emailParts.join("@")}`;
      }}
      className={className}
    >
      {children}
    </a>
  );
}
