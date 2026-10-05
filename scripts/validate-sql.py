#!/usr/bin/env python3
"""validate-sql.py — P1 migration hygiene checks (zero third-party deps).

Checks per migration file:
  1. Every CREATE TABLE has ENABLE ROW LEVEL SECURITY.
  2. Every CREATE TABLE has a comment (denied tables need explicit justification).
  3. No DROP TABLE / DROP TYPE without a comment line 'MIGRATION-SAFE:' nearby.
  4. Ledger/audit tables have immutability triggers.
  5. Balanced parens per statement (rough syntax sanity).
"""
import re
import sys
from pathlib import Path

MIGRATIONS = Path(__file__).resolve().parent.parent / "supabase" / "migrations"

def statements(sql: str):
    # crude splitter: semicolons outside of $$ bodies
    out, depth, cur = [], 0, []
    in_dollar = False
    for ch in sql:
        if ch == "$" and cur and cur[-1] == "$":
            in_dollar = not in_dollar
        if not in_dollar:
            if ch == "(":
                depth += 1
            elif ch == ")":
                depth -= 1
                if depth < 0:
                    raise ValueError("unbalanced parens")
            elif ch == ";" and depth == 0:
                out.append("".join(cur).strip())
                cur = []
                continue
        cur.append(ch)
    if cur and "".join(cur).strip():
        out.append("".join(cur).strip())
    return out

def check_file(path: Path) -> list[str]:
    errors = []
    sql = path.read_text()
    tables = re.findall(r"create table\s+(?:if not exists\s+)?(public\.\w+)", sql, re.I)
    rls_enabled = set(re.findall(r"alter table\s+(public\.\w+)\s+enable row level security", sql, re.I))
    comments = set(re.findall(r"comment on table\s+(public\.\w+)", sql, re.I))

    for t in tables:
        if t not in rls_enabled:
            errors.append(f"{path.name}: table {t} has no ENABLE ROW LEVEL SECURITY")
        if t not in comments:
            errors.append(f"{path.name}: table {t} has no COMMENT (required for deny-all/audit tables)")

    # immutability triggers for append-only tables
    for ledger in ("audit_logs", "volunteer_hours_ledger", "volunteer_points_ledger"):
        if f"public.{ledger}" in tables and f"trg_{ledger.split('_')[0]}_immutable" not in sql and f"{ledger}" in sql:
            if "immutable" not in sql:
                errors.append(f"{path.name}: {ledger} lacks an immutability trigger")

    for i, stmt in enumerate(statements(sql)):
        if re.search(r"\bdrop\s+table\b|\bdrop\s+type\b", stmt, re.I):
            errors.append(f"{path.name} stmt#{i}: destructive DROP needs MIGRATION-SAFE justification comment")

    try:
        statements(sql)
    except ValueError as e:
        errors.append(f"{path.name}: {e}")

    return errors

def main() -> int:
    files = sorted(MIGRATIONS.glob("*.sql"))
    if not files:
        print("no migrations found")
        return 1
    all_errors: list[str] = []
    for f in files:
        all_errors.extend(check_file(f))
    if all_errors:
        for e in all_errors:
            print(f"SQL-ERROR {e}")
        return 1
    print(f"validate-sql PASSED ({len(files)} migrations, RLS + comments verified)")
    return 0

if __name__ == "__main__":
    sys.exit(main())
