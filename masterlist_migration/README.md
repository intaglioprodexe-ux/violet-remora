# ITG master-list SQLite importer

This package reads only `MASTERLIST!tbl_SourceMasterlist` from
`MASTERLIST_WITH STICKERS_2026D-FINAL.xlsm` and refreshes a local SQLite database.
It never writes to or modifies the Excel source.

## Output

The default database is:

```text
%LOCALAPPDATA%\ITG-Production\data\masterlist.sqlite
```

Keep the active SQLite database on the backend computer's local disk. Do not put
the active database on the network share.

## Requirements

- Python 3.10 or later
- `openpyxl` 3.1 or later
- No administrator rights are required

Check the dependency:

```powershell
py -c "import openpyxl; print(openpyxl.__version__)"
```

If it is missing:

```powershell
py -m pip install --user -r .\masterlist_migration\requirements.txt
```

## Run from PowerShell

From the `violet-remora` repository root:

```powershell
py .\masterlist_migration\scripts\import_masterlist.py `
  --config .\masterlist_migration\config.example.json

py .\masterlist_migration\scripts\verify_masterlist_database.py `
  "$env:LOCALAPPDATA\ITG-Production\data\masterlist.sqlite"
```

You can also double-click `run_masterlist_import.bat`. It uses `pushd`, so it can
start from a UNC repository path while still writing SQLite locally.

## Power Query translation

The importer reproduces the supplied query calculations:

- layer weights: `L1P1T1` through `L4P4T4`
- `LPT`, `M2R`, `M2P`
- width-adjusted layer weights
- `PCSKg`, `MKg`, `JMKg`, `PtKg`
- process flags `51.Printing` through `57.Packing`
- first-occurrence de-duplication by text-normalized `ProductCode`

Two apparent query defects are corrected deliberately:

1. PVC thickness is read before replacing the field, so eligible 40 µm PVC rows
   can become 38 µm.
2. The derived numeric colour count reads the original `ColourQuantity` value
   after its conceptual rename to `ColourQuant`; values such as `8C` become `8`.

The original cached Excel values and formulas remain preserved in `source_rows`.
All 126 source fields are also retained as JSON in `source_rows.raw_payload_json`
and each current item's `raw_payload_json`.

## Repeat and failure behaviour

- An unchanged workbook hash is skipped without changing current data.
- A changed workbook replaces `master_items` inside one SQLite transaction.
- Validation or database errors roll back the transaction, retaining the last
  successful data.
- The first source row for a duplicated product code is retained, matching
  `Table.Distinct` ordering; later rows appear in the rejection report.
- The last seven successful imports are retained by default.

## Reports

```text
masterlist_migration\reports\masterlist_import_summary.json
masterlist_migration\reports\masterlist_import_rejections.csv
```

## Tests

```powershell
py -m unittest discover -s .\masterlist_migration\tests -v
```

## Rollback

The importer does not change the workbook. To roll back the generated database,
stop the backend process and rename or delete only this local file:

```text
%LOCALAPPDATA%\ITG-Production\data\masterlist.sqlite
```

Then restore your previous copy if you made one. Never delete or overwrite the
source `.xlsm` workbook.
