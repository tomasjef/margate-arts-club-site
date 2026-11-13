"use client";

import { useSyncExternalStore } from "react";
import { useHours } from "@/components/HoursProvider";
import { openStatus } from "@/lib/week";
import { inkStyle } from "@/lib/ink";

// The header status ("Open today 12pm–11pm", or in red "Closed until 12pm"), worked out in the browser so a production build can't
// freeze it at build time. The server snapshot is empty, so the first client render matches the
// server's HTML and the text appears once the page has mounted. It re-checks every minute.
function subscribe(onChange: () => void) {
  const timer = setInterval(onChange, 60_000);
  return () => clearInterval(timer);
}

// A string, so the snapshot is the same value from one read to the next (an object would be new every time)
const getServerSnapshot = () => null;

export function OpenStatus({ className = "" }: { className?: string }) {
  const hours = useHours();
  const status = useSyncExternalStore(subscribe, () => openStatus(new Date(), hours).text, getServerSnapshot);
  if (!status) return null;
  return (
    // ink: in the open menu on phones its first letter's ink starts on the page margin (lib/ink.ts); elsewhere it doesn't move
    <p className={`t-open ink ${status.startsWith("Open") ? "text-open" : "text-(--sold)"} normal-case ${className}`} style={inkStyle(status, 500)}>
      {status}
    </p>
  );
}
