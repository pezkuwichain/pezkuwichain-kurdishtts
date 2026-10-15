"""How far visitors got on the way to a donation, day by day.

  python tools/funnel.py          # the last 14 days
  python tools/funnel.py 30

Links with ?k=<channel> (kurdishtts.dks.news/bexsh?k=telegram) are also counted
by channel, so the second table says which channel brought people who recorded.

Database: KTTS_DATA (default /opt/kurdishtts/data)/kurdishtts.db. Counts only;
the funnel table holds no identity (ktts/donate.py, /api/funnel).
"""
from __future__ import annotations

import os
import sqlite3
import sys
from pathlib import Path

DB = Path(os.environ.get("KTTS_DATA", "/opt/kurdishtts/data")) / "kurdishtts.db"
STEPS = ("visit", "start", "consent", "first_rec", "sent", "share")


def main(days: int) -> None:
    db = sqlite3.connect(f"file:{DB}?mode=ro", uri=True)
    rows = db.execute("SELECT day, step, n FROM funnel WHERE day >= date('now', ?) ORDER BY day",
                      (f"-{days - 1} days",)).fetchall()
    table: dict[str, dict[str, int]] = {}
    for day, step, n in rows:
        table.setdefault(day, {})[step] = n
    print("day         " + "".join(f"{s:>11}" for s in STEPS))
    total = dict.fromkeys(STEPS, 0)
    for day in sorted(table):
        print(day + "  " + "".join(f"{table[day].get(s, 0):>11}" for s in STEPS))
        for s in STEPS:
            total[s] += table[day].get(s, 0)
    print("total       " + "".join(f"{total[s]:>11}" for s in STEPS))
    if total["visit"]:
        print("of visits   " + "".join(f"{total[s] / total['visit']:>10.0%} " for s in STEPS))
    # Where they came from: the ?k= of the link they followed, for the same days.
    refs = db.execute("SELECT ref, step, SUM(n) FROM funnel_ref WHERE day >= date('now', ?) GROUP BY ref, step",
                      (f"-{days - 1} days",)).fetchall()
    if refs:
        by: dict[str, dict[str, int]] = {}
        for ref, step, n in refs:
            by.setdefault(ref, {})[step] = n
        print()
        print("from        " + "".join(f"{s:>11}" for s in STEPS))
        for ref in sorted(by, key=lambda r: -by[r].get("sent", 0)):
            print(f"{ref[:11]:<12}" + "".join(f"{by[ref].get(s, 0):>11}" for s in STEPS))


if __name__ == "__main__":
    main(int(sys.argv[1]) if len(sys.argv) > 1 else 14)
