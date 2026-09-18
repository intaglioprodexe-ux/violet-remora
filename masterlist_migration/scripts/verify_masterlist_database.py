#!/usr/bin/env python3
"""Verify masterlist.sqlite integrity, lineage, uniqueness, and current counts."""

from __future__ import annotations

import argparse
import json
import sqlite3
from pathlib import Path


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("database", type=Path)
    args = parser.parse_args()
    if not args.database.is_file():
        print(f"Verification: FAIL\nDatabase not found: {args.database}")
        return 1

    connection = sqlite3.connect(args.database)
    connection.row_factory = sqlite3.Row
    failures: list[str] = []
    try:
        integrity = connection.execute("PRAGMA integrity_check").fetchone()[0]
        foreign_keys = connection.execute("PRAGMA foreign_key_check").fetchall()
        item_count = connection.execute("SELECT COUNT(*) FROM master_items").fetchone()[0]
        duplicate_count = connection.execute(
            "SELECT COUNT(*) FROM (SELECT product_code_normalized FROM master_items GROUP BY product_code_normalized HAVING COUNT(*) > 1)"
        ).fetchone()[0]
        orphan_count = connection.execute(
            "SELECT COUNT(*) FROM master_items m LEFT JOIN source_rows s ON s.id = m.source_row_id WHERE s.id IS NULL"
        ).fetchone()[0]
        batch = connection.execute(
            "SELECT * FROM import_batches WHERE status = 'success' ORDER BY imported_at DESC, id DESC LIMIT 1"
        ).fetchone()
        if integrity != "ok": failures.append(f"integrity_check returned {integrity}")
        if foreign_keys: failures.append(f"foreign_key_check returned {len(foreign_keys)} row(s)")
        if item_count == 0: failures.append("master_items is empty")
        if duplicate_count: failures.append(f"found {duplicate_count} duplicate normalized product code(s)")
        if orphan_count: failures.append(f"found {orphan_count} item(s) without source lineage")
        if batch is None: failures.append("no successful import batch exists")
        elif item_count != batch["rows_loaded"]:
            failures.append(f"master_items count {item_count} does not match latest batch rows_loaded {batch['rows_loaded']}")

        result = {
            "database": str(args.database.resolve()), "integrity_check": integrity,
            "foreign_key_violations": len(foreign_keys), "master_items": item_count,
            "duplicate_product_codes": duplicate_count, "lineage_orphans": orphan_count,
            "latest_batch": dict(batch) if batch else None,
            "verification": "PASS" if not failures else "FAIL", "failures": failures,
        }
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return 0 if not failures else 1
    finally:
        connection.close()


if __name__ == "__main__":
    raise SystemExit(main())
