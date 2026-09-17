from __future__ import annotations

import argparse
import sqlite3
from pathlib import Path


def main() -> int:
    parser = argparse.ArgumentParser(description="Verify ITG live schedule SQLite database.")
    parser.add_argument("database")
    args = parser.parse_args()
    database = Path(args.database).resolve()
    if not database.is_file():
        raise FileNotFoundError(database)

    connection = sqlite3.connect(f"file:{database.as_posix()}?mode=ro", uri=True)
    try:
        integrity = connection.execute("PRAGMA integrity_check").fetchone()[0]
        foreign_keys = connection.execute("PRAGMA foreign_key_check").fetchall()
        jobs = connection.execute("SELECT COUNT(*) FROM live_jobs").fetchone()[0]
        sources = connection.execute("SELECT COUNT(*) FROM live_source_rows").fetchone()[0]
        rejections = connection.execute("SELECT COUNT(*) FROM live_import_rejections").fetchone()[0]
        duplicate_locations = connection.execute(
            """
            SELECT source_file, source_sheet, source_row, COUNT(*)
            FROM live_source_rows
            GROUP BY source_file, source_sheet, source_row
            HAVING COUNT(*) > 1
            """
        ).fetchall()
        latest = connection.execute(
            """
            SELECT source_file, source_file_sha256, completed_at_utc, status, rows_loaded
            FROM live_import_batches
            WHERE status='completed'
            ORDER BY completed_at_utc DESC LIMIT 1
            """
        ).fetchone()
        passed = (
            integrity == "ok" and not foreign_keys and not duplicate_locations
            and jobs > 0 and latest is not None and latest[3] == "completed"
        )
        print(f"Database: {database}")
        print(f"Integrity: {integrity}")
        print(f"Foreign-key violations: {len(foreign_keys)}")
        print(f"Duplicate source locations: {len(duplicate_locations)}")
        print(f"live_jobs: {jobs}")
        print(f"live_source_rows: {sources}")
        print(f"live_import_rejections: {rejections}")
        print(f"Latest completed import: {latest}")
        print("Verification: PASS" if passed else "Verification: FAIL")
        return 0 if passed else 1
    finally:
        connection.close()


if __name__ == "__main__":
    raise SystemExit(main())

