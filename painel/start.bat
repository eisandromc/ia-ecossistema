@echo off
rem Inicia o painel. Antes, mostra se e preciso instalar os modulos do Node.
rem   start.bat            verifica, instala se voce confirmar e inicia
rem   start.bat --check    so mostra a verificacao, sem instalar nem iniciar
rem   start.bat --install  reinstala os modulos e inicia
setlocal
chcp 65001 >nul
cd /d "%~dp0"

set "MODO=%~1"
if "%MODO%"=="" goto modo_ok
if /i "%MODO%"=="--check" goto modo_ok
if /i "%MODO%"=="-c" goto modo_ok
if /i "%MODO%"=="--install" goto modo_ok
if /i "%MODO%"=="-i" goto modo_ok
if /i "%MODO%"=="--help" goto ajuda
if /i "%MODO%"=="-h" goto ajuda
echo Opcao desconhecida: %MODO% (use --check, --install ou --help)
exit /b 1

:ajuda
echo   start.bat            verifica, instala se voce confirmar e inicia
echo   start.bat --check    so mostra a verificacao, sem instalar nem iniciar
echo   start.bat --install  reinstala os modulos e inicia
exit /b 0

:modo_ok
where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo   Node.js nao encontrado. Instale a versao 20 ou mais nova em https://nodejs.org
  echo.
  pause
  exit /b 1
)

if /i "%MODO%"=="--check" goto so_verificar
if /i "%MODO%"=="-c" goto so_verificar

call node scripts\verificar.js --criar-env
set "CODIGO=%ERRORLEVEL%"
if "%CODIGO%"=="1" (
  pause
  exit /b 1
)

if /i "%MODO%"=="--install" goto instalar
if /i "%MODO%"=="-i" goto instalar
if not "%CODIGO%"=="2" goto iniciar

set "RESPOSTA=s"
set /p "RESPOSTA=  Instalar os modulos agora? [S/n] "
if /i "%RESPOSTA%"=="n" goto cancelado
if /i "%RESPOSTA%"=="nao" goto cancelado

:instalar
echo   Instalando os modulos do Node...
call npm ci --no-audit --no-fund
if errorlevel 1 call npm install --no-audit --no-fund
if errorlevel 1 (
  echo   Nao foi possivel instalar os modulos.
  pause
  exit /b 1
)

:iniciar
node server.js --abrir
exit /b %ERRORLEVEL%

:so_verificar
call node scripts\verificar.js
set "CODIGO=%ERRORLEVEL%"
if "%CODIGO%"=="2" (
  echo   Rode start.bat para instalar e iniciar.
  echo.
)
exit /b %CODIGO%

:cancelado
echo   Instalacao cancelada. O painel precisa dos modulos para iniciar.
exit /b 0
