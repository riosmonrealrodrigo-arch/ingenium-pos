@echo off
title INGENIUM POS - Iniciando Sistema de Escritorio
echo ====================================================
echo        INICIANDO INGENIUM POS (WINDOWS DESKTOP)
echo ====================================================
echo.
cd /d "%~dp0"

echo [1/2] Verificando servidor local...
netstat -ano | findstr :3000 | findstr LISTENING >nul
if %ERRORLEVEL% NEQ 0 (
    echo Servidor no detectado. Iniciando motor de INGENIUM POS en segundo plano...
    start /min "INGENIUM_SERVER" node .next\standalone\server.js
    echo Esperando a que el sistema este listo...
    timeout /t 3 /nobreak >nul
) else (
    echo Servidor ya activo en puerto 3000.
)

echo [2/2] Abriendo pantalla de punto de venta...
start msedge --app="http://localhost:3000/pos" 2>nul || start chrome --app="http://localhost:3000/pos" 2>nul || start http://localhost:3000/pos

exit
