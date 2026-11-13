"use client";

import { useSyncExternalStore } from "react";
import { launchYear } from "@/lib/site";

// The year in the copyright line, worked out in the browser (London time, so it turns over at midnight
// on New Year's Day here) so it moves on by itself every year and a production build can't freeze it.
// The server snapshot is the launch year, so the line never has a gap and the first client render
// matches the server's HTML; from 2027 the new year replaces it as soon as the page has mounted.
// It re-checks every hour, in case a page is left open over New Year.
function subscribe(onChange: () => void) {
  const timer = setInterval(onChange, 3_600_000);
  return () => clearInterval(timer);
}

const getSnapshot = () =>
  Number(new Intl.DateTimeFormat("en-GB", { year: "numeric", timeZone: "Europe/London" }).format(new Date()));
const getServerSnapshot = () => launchYear;

export function CopyrightYear() {
  return <>{useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)}</>;
}
