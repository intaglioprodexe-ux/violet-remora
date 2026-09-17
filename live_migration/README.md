# ITG live schedule SQLite refresh

This package refreshes a separate `live_schedule.sqlite` database from the converted workbook produced by `saveschedule.py`.

It does not modify `job_history_2023_2025.sqlite` and it never writes to the source workbook.

## Data source

```text
\\192.168.0.254\Public\PRINTING SCHEDULE 2026B.xlsx
Worksheet: LISTING 2025 & 2026
Header row: 2
```

The complete current worksheet is treated as authoritative. Both 2025 carry-over records and 2026 records are retained. The future Express lookup layer should prefer the live result when the same normalized job card also exists in the static history database.

## Refresh safety

The workbook is completely read and validated before the active rows are changed. Replacement happens inside one SQLite transaction. If reading, validation, or insertion fails, the previous successful live rows remain available.

The default safeguards reject a refresh when:

- the workbook or configured worksheet is missing;
- required headers are missing;
- fewer than 1,000 valid job rows are found;
- the new valid-job count falls by more than 50 percent from the previous successful refresh.

These thresholds are operational safeguards and can be changed in `config.example.json`.

## Files

```text
live_migration/
  README.md
  requirements.txt
  config.example.json
  run_live_import.bat
  scripts/
    import_live_schedule.py
    verify_live_database.py
  sql/
    schema.sql
  tests/
    test_live_import.py
  data/output/
    live_schedule.sqlite
  reports/
    live_import_summary.json
    live_import_rejections.csv
```

## Manual run

First run your existing converter:

```bat
py saveschedule.py
```

Then, from the repository folder, run:

```bat
py -m pip install --user -r live_migration\requirements.txt
py live_migration\scripts\import_live_schedule.py --config live_migration\config.example.json
py live_migration\scripts\verify_live_database.py live_migration\data\output\live_schedule.sqlite
py -m unittest live_migration\tests\test_live_import.py
```

If `py` is unavailable, replace it with `python`.

You can also run `live_migration\run_live_import.bat` from Command Prompt after `saveschedule.py` has finished successfully. The batch file does not pause, so it is safe to use with Windows Task Scheduler.

## Windows Task Scheduler

For the proof of concept, create one task that runs after schedule editing normally stops:

```text
Program/script: C:\Windows\System32\cmd.exe
Arguments: /c "C:\full\path\to\violet-remora\live_migration\run_live_import.bat"
Start in: C:\full\path\to\violet-remora
```

Schedule `saveschedule.py` first, then this import. Do not refresh SQLite if the workbook conversion failed.

## Rollback

The importer automatically preserves the previous live data when a refresh fails. For a manual rollback, stop the backend process, replace `live_schedule.sqlite` with a known-good backup, and restart the backend. Do not delete or modify the source XLSB/XLSX.

The active SQLite file should be kept on the backend computer's local disk. Do not use a writable SQLite database directly over the Windows network share.
