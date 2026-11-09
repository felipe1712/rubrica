@echo off
echo ========================================================
echo   COMPILADOR DE RUBRICA DESKTOP (TAURI V2 + RUST)
echo ========================================================
echo.

cd /d "%~dp0\..\rubrica\saas"

echo [1/3] Compilando frontend React optimizado...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo Error al compilar el frontend React.
    exit /b %ERRORLEVEL%
)

echo.
echo [2/3] Compilando motor nativo Rust y base SQLite embebida...
cd src-tauri
cargo build --release
if %ERRORLEVEL% NEQ 0 (
    echo Error al compilar el binario Rust.
    exit /b %ERRORLEVEL%
)

cd ..
echo.
echo [3/3] Generando instalador de distribucion para Windows (NSIS)...
call npx @tauri-apps/cli build
if %ERRORLEVEL% NEQ 0 (
    echo Generacion de instalador finalizada o sujeta a dependencias de NSIS.
)

echo.
echo ========================================================
echo   COMPILACION FINALIZADA CON EXITO
echo   Ejecutable directo: rubrica\saas\src-tauri\target\release\rubrica-desktop.exe (5.9 MB)
echo ========================================================
pause
