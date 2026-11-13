#!/usr/bin/env python3
"""Imports a contact list (CSV) into the mailing list as monthly subscribers who already agreed. Prints counts only, never addresses.

  python3 scripts/import-contacts.py FILE.csv --source outsavvy [--yes-col CanEmail] [--date-col DateAdded] [--write]
  python3 scripts/import-contacts.py FILE.csv --source mailerlite --email-col Subscriber --date-col Subscribed --yes-col -   (an export of active subscribers has no consent column: --yes-col - takes every row)

Without --write nothing is changed: it reads the live list, works out who would be added and who skipped, and says so. With --write it
adds them (confirmed, monthly only, consent date = the date in the file) with `wrangler d1 execute --remote`. Anyone already on the list
(including people who unsubscribed) is left exactly as they are. The generated SQL holds addresses, so it goes to a temporary file that is deleted.
Run it with Node 24 and the Cloudflare token from .secrets sourced."""
import argparse, csv, json, os, re, secrets, subprocess, sys, tempfile

DB = "margate-arts-club-newsletter"
ap = argparse.ArgumentParser()
ap.add_argument("file")
ap.add_argument("--source", required=True)
ap.add_argument("--email-col", default="Email")
ap.add_argument("--yes-col", default="CanEmail")
ap.add_argument("--date-col", default="DateAdded")
ap.add_argument("--write", action="store_true")
a = ap.parse_args()

rows = list(csv.DictReader(open(a.file, encoding="utf-8-sig")))
agreed, no, bad, seen = {}, 0, 0, set()
for r in rows:
    if a.yes_col != "-" and (r.get(a.yes_col) or "").strip().lower() not in ("yes", "true", "1"):
        no += 1
        continue
    email = (r.get(a.email_col) or "").strip().lower()
    if not re.fullmatch(r"[^@\s,;'\"<>]+@[^@\s,;'\"<>]+\.[^@\s,;'\"<>]+", email):
        bad += 1
        continue
    d = (r.get(a.date_col) or "").strip()[:10]
    agreed.setdefault(email, d if re.fullmatch(r"\d{4}-\d{2}-\d{2}", d) else "")
    seen.add(email)

def d1(sql=None, file=None):
    cmd = ["npx", "wrangler", "d1", "execute", DB, "--remote", "--json"] + (["--command", sql] if sql else ["--file", file])
    out = subprocess.run(cmd, capture_output=True, text=True)
    if out.returncode:
        sys.exit("wrangler failed:\n" + out.stderr[-600:])
    return json.loads(out.stdout) if sql else None

existing = {r["email"].lower() for r in d1("SELECT email FROM subscribers")[0]["results"]}
new = {e: d for e, d in agreed.items() if e not in existing}
print(f"rows in file: {len(rows)}; said no: {no}; said yes: {len(rows) - no}; unusable address: {bad}")
print(f"agreed and distinct: {len(agreed)}; already on the list (left alone): {len(agreed) - len(new)}; to add: {len(new)}")
if not a.write:
    print("dry run: nothing written (add --write)")
    sys.exit()

q = lambda s: "'" + s.replace("'", "''") + "'"
lines = []
for e, d in new.items():
    consent = q(d + " 12:00:00") if d else "datetime('now')"
    lines.append(f"INSERT OR IGNORE INTO subscribers (email, weekly, monthly, status, token, consent_at, confirmed_at, confirmation_sent_at, source) VALUES ({q(e)}, 0, 1, 'confirmed', {q(secrets.token_hex(32))}, {consent}, {consent}, {consent}, {q(a.source)});")
fd, path = tempfile.mkstemp(suffix=".sql")
try:
    with os.fdopen(fd, "w") as f:
        f.write("\n".join(lines) + "\n")
    d1(file=path)
finally:
    os.remove(path)
n = d1("SELECT COUNT(*) AS n FROM subscribers WHERE source = " + q(a.source) + " AND status = 'confirmed'")[0]["results"][0]["n"]
print(f"done: {len(new)} written; the list now has {n} confirmed people from '{a.source}'")
