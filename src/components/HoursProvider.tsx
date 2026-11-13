"use client";

import { createContext, useContext, type ReactNode } from "react";
import { defaultSchedule, type Hours } from "@/lib/week";

// What the client-side header needs from Sanity, handed down from the layout (which reads it): the opening hours for the
// Open/Closed line, the menu's pages in the club's order, and the Instagram link
export type SiteData = { hours: Hours; menu: { label: string; href: string }[]; instagramUrl: string };

const SiteContext = createContext<SiteData | null>(null);

export const HoursProvider = ({ value, children }: { value: SiteData; children: ReactNode }) => (
  <SiteContext.Provider value={value}>{children}</SiteContext.Provider>
);

const fallback: SiteData = { hours: defaultSchedule.hours, menu: [], instagramUrl: "" };
export const useSiteData = () => useContext(SiteContext) ?? fallback;
export const useHours = () => useSiteData().hours;
