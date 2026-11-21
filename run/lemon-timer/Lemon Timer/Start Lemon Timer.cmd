@echo off
rem Lemon Timer. Made by Benjamin Lennon (lennonapps@outlook.com), author and project lead, with Hillary Lennon.
rem Opens Lemon Timer in its own window (Microsoft Edge or Google Chrome "app" mode).
rem Runs from any folder or flash drive; nothing is installed and no admin rights are needed.
rem "Start Lemon Timer.cmd --dry-run" only prints the command it would run.
setlocal EnableDelayedExpansion
set "PAGE=%~dp0System\app\index.html"
if not exist "!PAGE!" (
  echo Cannot find "!PAGE!".
  echo Keep this file in the "Lemon Timer" folder, next to the System folder.
  pause
  exit /b 1
)
rem file:/// URL: forward slashes, spaces and # escaped
set "URL=!PAGE:\=/!"
set "URL=!URL: =%%20!"
set "URL=!URL:#=%%23!"
set "URL=file:///!URL!"

set "BROWSER="
for %%B in (
  "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
  "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
  "%LocalAppData%\Microsoft\Edge\Application\msedge.exe"
  "%ProgramFiles%\Google\Chrome\Application\chrome.exe"
  "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
  "%LocalAppData%\Google\Chrome\Application\chrome.exe"
) do (
  if not defined BROWSER if exist "%%~B" set "BROWSER=%%~B"
)

if /i "%~1"=="--dry-run" (
  if defined BROWSER (echo "!BROWSER!" --app="!URL!" --start-maximized) else (echo fallback: "%~dp0Start in browser.html")
  exit /b 0
)
if defined BROWSER (
  start "" "!BROWSER!" --app="!URL!" --start-maximized
) else (
  rem No Edge or Chrome found: open in the default browser instead
  start "" "%~dp0Start in browser.html"
)
endlocal
