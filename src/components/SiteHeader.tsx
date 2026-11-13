"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LogoMark } from "@/components/LogoMark";
import { OpenStatus } from "@/components/OpenStatus";
import { EmailLink } from "@/components/EmailLink";
import { useSiteData } from "@/components/HoursProvider";
import { menu as fixedMenu, pageTitles as fixedTitles, siteName } from "@/lib/site";
import { titleWordStyle } from "@/lib/title-width";
import { inkStyle } from "@/lib/ink";

// Phones: one row, the name at the left and the menu bars at the right. The bars open a list under the row (What's On, Visit, Music,
// About, Contact, Instagram, then the open status) that pushes the page down, and the page's name has a line of its own under the row.
// Pages without a name in the menu (Privacy, Accessibility, Company) have no such line. With `rule`, a hairline sits under the header
// (and under the open menu), inset by the page margin, once the page has scrolled.
// Tablets and desktop (the user's design, 6 Nov 2026): no bars. The row has the name at the left, the page you are on in the middle
// (from lg) and the open status at the right; under it the menu is a row of boxed buttons, where What's On had its date filters, on
// every page (the page you are on is the black one): the pages at the left, Contact and Instagram at the right. As before the menu
// row, only the row with the name stays at the top of the window; the buttons scroll away with the page (the user's choice, 6 Nov
// 2026, after trying the whole header sliding away and back), with no hairline under the row.
export function SiteHeader({ rule = false }: { rule?: boolean }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  // the menu as the club has ordered it in the studio (the fixed pages when there is none)
  const site = useSiteData();
  const { instagramUrl } = site;
  const menu = site.menu.length ? site.menu : fixedMenu;
  const pageTitles = [...fixedTitles, ...menu];
  // The hairline shows only once the page has scrolled; at the top the content sits right under the bar
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 0);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  useEffect(() => {
    if (!open) return;
    // The menu stays open while the page scrolls; it closes with the bars, Escape or a chosen link
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // The menu's page links: all black, underlined on hover; the current page is not marked (aria-current
  // still tells screen readers)
  const link = (item: { label: string; href: string }, onClick?: () => void) => {
    const current = pathname === item.href;
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onClick}
        aria-current={current ? "page" : undefined}
        className="hover:underline hover:decoration-[3px] hover:underline-offset-[0.1em]"
      >
        {item.label}
      </Link>
    );
  };

  // The page you are on
  const current = pageTitles.find((item) => item.href === pathname)?.label;

  return (
    <>
    <header className="site-header relative z-40 bg-(--page-bg)">
      <div
        className="t-nav grid grid-cols-[1fr_auto] items-center gap-4 px-(--pad) md:grid-cols-[1fr_auto_1fr]"
        style={{ height: "var(--header-h)" }}
      >
        <Link href="/" className="justify-self-start whitespace-nowrap t-headline">
          <LogoMark />
          {siteName}
        </Link>
        {/* the page you are on, in the middle (from lg; phones have two columns, so the narrowest have room for the bars) */}
        <p className="hidden justify-self-center whitespace-nowrap text-center lg:block">{current}</p>
        <div className="flex items-center justify-self-end gap-(--pad) md:col-start-3">
          <OpenStatus className="hidden md:block" />
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="site-menu"
            onClick={() => setOpen((o) => !o)}
            style={{ "--cap": "0.686em" } as React.CSSProperties}
            className="t-headline block outline-none! focus-visible:*:*:bg-muted md:hidden"
          >
            {/* The bars span the name's capitals (0.686em in Archivo) and stand on its baseline, as the logo mark does: the button is a line
                of the name's size, and the bars' box is an inline block as tall as the capitals with its foot on that line's baseline. Name and
                bars so share one baseline, whatever the browser rounds the font's measurements to (centring the two in the bar left the bars
                up to 0.8px low). open: the outer bars move to the middle and cross, the middle one goes, so the bars become an X */}
            <span aria-hidden className="relative inline-block h-(--cap) w-[25px] align-baseline">
              <span className={`absolute inset-x-0 top-0 h-[3px] bg-ink ${open ? "translate-y-[calc((var(--cap)-3px)/2)] rotate-45" : ""}`} />
              <span className={`absolute inset-x-0 top-[calc(50%-1.5px)] h-[3px] bg-ink ${open ? "opacity-0" : ""}`} />
              <span className={`absolute inset-x-0 bottom-0 h-[3px] bg-ink ${open ? "-translate-y-[calc((var(--cap)-3px)/2)] -rotate-45" : ""}`} />
            </span>
          </button>
        </div>
      </div>

      {open && (
        <nav
          id="site-menu"
          aria-label="Menu"
          className={`md:hidden t-nav text-(length:--headline-fs) mt-(--menu-top) bg-(--page-bg) px-(--pad) pb-[0.98em] ${pathname === "/" ? "max-md:pb-[1.07em]" : "max-md:pb-[0.87em]"}`}
        >
          <ul>
            {menu.map((item) => (
              <li key={item.href} className="ink" style={inkStyle(item.label, 600, true)}>
                {link(item, () => setOpen(false))}
              </li>
            ))}
            <li className="ink" style={inkStyle("Contact", 600, true)}>
              <EmailLink className="hover:underline hover:decoration-[3px] hover:underline-offset-[0.1em]">Contact</EmailLink>
            </li>
            <li className="ink" style={inkStyle("Instagram", 600, true)}>
              <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="hover:underline hover:decoration-[3px] hover:underline-offset-[0.1em]">
                Instagram
              </a>
            </li>
          </ul>
          <OpenStatus className="mt-[1.05em] block" />
        </nav>
      )}
      {/* Phones: the hairline under the header, with `rule`, once the page has scrolled or the menu is open. Without it (What's On,
          Visit, Music, About, the legal pages) there is never one. Tablets and desktop have none: the page passes under the name's row's
          white (the user's choice, 6 Nov 2026). */}
      {(rule || open) && (
        <div
          className={`mx-(--pad) border-b md:hidden ${rule && (scrolled || open) ? "border-ink" : "border-transparent"}`}
        />
      )}
    </header>
    {/* tablets and desktop: the menu as boxed buttons (globals.css, .bar), under the header (not in it, so they scroll away with the
        page while the name's row stays). The pages at the left; Contact and Instagram at the right, under the open status: they leave
        the site (the email app, Instagram), so they stand apart from the pages (6 Nov 2026; no arrow on Instagram, as an arrow
        character can turn into an emoji on iPhones and iPads) */}
    <nav aria-label="Menu" className="hidden px-(--pad) md:block">
      <div className="bar flex flex-wrap items-center gap-x-(--pad) border-y border-ink">
        <ul className="flex flex-1 flex-wrap gap-x-(--pad)">
          {menu.map((item) => {
            const here = pathname === item.href;
            return (
              <li key={item.href}>
                <Link href={item.href} aria-current={here ? "page" : undefined} className={`bar-item t-filter flex h-12 items-center ${here ? "text-ink" : "text-muted hover:text-ink"}`}>
                  {item.label}
                </Link>
              </li>
            );
          })}
          <li className="ml-auto">
            <EmailLink className="bar-item t-filter flex h-12 items-center text-muted hover:text-ink">Contact</EmailLink>
          </li>
          <li>
            <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="bar-item t-filter flex h-12 items-center text-muted hover:text-ink">
              Instagram
            </a>
          </li>
        </ul>
      </div>
    </nav>
    {/* phones: the page you are on, on a line under the header's row (not in it, so it scrolls away with the page while the row
        stays); it gives way to the menu while that is open. Large (.page-title). With `rule` the header has the hairline's 1px under
        the row, taken off here. */}
    {current && !open && (
      <p className={`t-nav page-title ink px-(--pad) md:hidden ${rule ? "[--title-rule:1px]" : ""}`} style={{ ...titleWordStyle(current), ...inkStyle(current, 600, true) }}>
        {current}
      </p>
    )}
    </>
  );
}
