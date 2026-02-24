@echo off
set PGPASSWORD=1234
psql -U postgres -d buisness_events -f create-admin.sql
echo.
echo Verification du compte cree:
psql -U postgres -d buisness_events -c "SELECT email, name, role FROM \"User\" WHERE email = 'alexalix58@gmail.com';"
pause
