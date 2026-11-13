"use client";

import { useState } from "react";

// How often the email comes: weekly, monthly or both (the digest is built from the events, see README)
const frequencies = ["Weekly", "Monthly"] as const;

// Newsletter sign-up for the footer: the email field with a hairline under it (0.3em below the text, so it clears the type), then a choice of how
// often (Weekly, Monthly, or both) with Subscribe at the end of that line, so it comes last, after the choices.
// The grey prompt "Join our mailing list" (the form has no heading) is the field's placeholder and goes as soon as someone types. It follows the
// same logic as the date filters. Nothing is chosen for them. Each
// frequency is a checkbox: a white box with a 1px black stroke, a black square inside once chosen,
// then the word. Subscribe is drawn as a button in the same language, a white box with a 1px black stroke
// (black type and stroke, always: it is never greyed out, so it reads as clickable; pressing it without a frequency shows the red message), (its height hangs outside the line, so the choices stay on the text lines of the neighbouring columns), which fills black on hover.
// Sent to /api/subscribe, which emails a confirmation link: nobody is on the list until they press it.
// `standalone` (the form on a page of its own, the Newsletter page), on phones: the whole form a step up, 18px where the footer has 16px (the email
// field, Weekly and Monthly, their boxes, which are sized in em, and the spacing in em); Subscribe the size of What’s On’s Book Tickets and Add to
// Calendar on phones (13px above and below the words), on its own line under Weekly and Monthly, one and a half margins below them, at the left.
export function NewsletterSignup({ className = "", standalone = false }: { className?: string; standalone?: boolean }) {
  const [email, setEmail] = useState("");
  const [chosen, setChosen] = useState<string[]>([]);
  // Set when Subscribe is pressed with no frequency chosen: the boxes turn red and "Choose: Weekly, Monthly or both" appears on the same line
  const [missing, setMissing] = useState(false);
  // Set once the form has been sent: a green line confirms it, until the visitor starts a new entry
  const [done, setDone] = useState<false | "sent" | "queued">(false);
  // Set when the sign-up could not be saved (a red line says so)
  const [failed, setFailed] = useState(false);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (chosen.length === 0) {
          setMissing(true);
          return;
        }
        setFailed(false);
        fetch("/api/subscribe", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email, frequencies: chosen.map((c) => c.toLowerCase()) }),
        })
          .then(async (res) => {
            if (!res.ok) throw new Error("sign-up failed");
            const answer = await res.json().catch(() => ({}));
            setDone(answer.queued ? "queued" : "sent");
            setEmail("");
            setChosen([]);
          })
          .catch(() => setFailed(true));
      }}
      className={`${className} ${standalone ? "max-md:text-(length:--fs-text)" : ""}`}
    >
      <div className="border-b border-ink pb-[0.3em]">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => {
            setDone(false);
            setFailed(false);
            setEmail(e.target.value);
          }}
          placeholder="Join our mailing list"
          aria-label="Email address for the newsletter"
          autoComplete="email"
          className="search-field block w-full bg-transparent text-left text-ink placeholder:text-muted"
        />
      </div>
      {/* phones, in the footer: Subscribe is Book Tickets' size (below), so the row is as tall as the button and Weekly and Monthly sit
          on its text's baseline (6 Nov 2026); on the narrowest phones, where the three don't fit on one line, Subscribe goes under them */}
      {/* from 768px: one empty line under the field's line (less its hairline and the 0.3em above it), so the row is on the footer's
          third line, as Mon–Thu and 276 Northdown Road are */}
      <div className={`mt-[calc(1lh-2px-0.3em)] md:mt-[calc(1lh-1px-0.3em)] flex items-center justify-between gap-x-(--pad) ${standalone ? "max-md:flex-col max-md:items-start" : "max-md:flex-wrap max-md:items-baseline max-md:gap-y-(--pad)"}`}>
        <fieldset className="flex items-center gap-x-(--pad)" aria-describedby={missing ? "frequency-error" : undefined}>
          <legend className="sr-only">How often</legend>
          {frequencies.map((name) => (
            <label key={name} className="flex cursor-pointer items-center gap-[0.5em]">
              <input
                type="checkbox"
                checked={chosen.includes(name)}
                onChange={(e) => {
                  setMissing(false);
                  setDone(false);
                  setChosen((c) => (e.target.checked ? [...c, name] : c.filter((n) => n !== name)));
                }}
                aria-invalid={missing && !chosen.includes(name)}
                className="peer sr-only"
              />
              {/* the box: white with a 1px black stroke, a black square inside once chosen */}
              <span
                aria-hidden
                className={`box-border flex h-[0.8em] w-[0.8em] shrink-0 items-center justify-center border bg-white ${missing ? "border-(--sold) outline outline-1 outline-(--sold)" : "border-ink"} peer-focus-visible:outline peer-focus-visible:outline-1 peer-focus-visible:outline-offset-4 peer-checked:*:block`}
              >
                <span className="hidden h-[0.4em] w-[0.4em] bg-ink" />
              </span>
              {/* the word, not the box, gives the line its baseline (so Weekly and Monthly line up with Subscribe's word on phones) */}
              <span className="self-baseline">{name}</span>
            </label>
          ))}
          {done && (
            <span role="status" className="text-open">
              {done === "queued" ? "Thanks, we’ll email you to confirm" : "Thanks, check your email to confirm"}
            </span>
          )}
          {failed && (
            <span role="alert" className="text-(--sold)">
              Sorry, that didn’t work. Please try again later
            </span>
          )}
          {missing && (
            // on phones only the red boxes show it (the words are still read out by screen readers)
            <span id="frequency-error" role="alert" className="text-(--sold) max-md:sr-only">
              Choose: Weekly, Monthly or both
            </span>
          )}
        </fieldset>
        {/* phones: the size of What's On's Book Tickets (the Text size, 18px, 13px above and below the words); in the footer it no longer
            hangs outside the row there. From 768px it hangs outside the row, its border too (so the row is one line tall and its word
            sits on Weekly's baseline). From 768 to 1280px: the smaller size, half an em above and below the words (37px; the
            user's choice, 6 Nov 2026, extended from 1023 to 1280px the same day), so it stays clear of the field's hairline; above 1280px the site's
            button size (44px, 48px from 1440px) */}
        <button type="submit" className={`shrink-0 border border-ink bg-white my-[calc(var(--btn-py)*-1-1px)] md:max-[80.0625rem]:[--btn-py:0.5em] max-md:py-[13px] max-md:text-(length:--fs-text) ${standalone ? "max-md:mt-[calc(var(--pad)*1.5)] max-md:mb-0" : "max-md:my-0"} px-(--btn-px) py-(--btn-py) leading-(--mid-lh) text-ink hover:bg-ink hover:text-white`}>
          Subscribe
        </button>
      </div>
    </form>
  );
}
