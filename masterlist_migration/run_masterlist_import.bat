@echo off
setlocal

pushd "%~dp0" || (
  echo ERROR: Could not open the masterlist_migration folder.
  exit /b 1
)

py scripts\import_masterlist.py --config config.example.json
if errorlevel 1 (
  echo.
  echo Import failed. The previous SQLite data was retained.
  popd
  exit /b 1
)

py scripts\verify_masterlist_database.py "%LOCALAPPDATA%\ITG-Production\data\masterlist.sqlite"
set "VERIFY_EXIT=%ERRORLEVEL%"
popd
exit /b %VERIFY_EXIT%
