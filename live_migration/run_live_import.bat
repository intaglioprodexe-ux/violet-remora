@echo off
setlocal
cd /d "%~dp0.."

py live_migration\scripts\import_live_schedule.py --config live_migration\config.example.json
if errorlevel 1 (
    echo.
    echo LIVE SCHEDULE IMPORT FAILED.
    echo The previous successful SQLite data was retained.
    exit /b 1
)

py live_migration\scripts\verify_live_database.py live_migration\data\output\live_schedule.sqlite
if errorlevel 1 (
    echo.
    echo LIVE SCHEDULE VERIFICATION FAILED.
    exit /b 1
)

echo.
echo Live schedule refresh completed successfully.
exit /b 0
