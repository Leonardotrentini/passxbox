@echo off
echo ========================================
echo DEPLOY NA VERCEL - LINK TRACKER
echo ========================================
echo.
echo Instalando Vercel CLI...
call npm install -g vercel
echo.
echo Fazendo login na Vercel...
call vercel login
echo.
echo Fazendo deploy...
call vercel --prod
echo.
echo ========================================
echo Deploy concluido!
echo ========================================
pause
