@echo off
cd C:\p\client

echo === Step 1: Fix app name ===
echo ^<resources^>^<string name="app_name"^>Psyche Tech^</string^>^</resources^> > android\app\src\main\res\values\strings.xml

echo === Step 2: Backup packagingOptions ===
type android\app\build.gradle | findstr "libworklets"

echo === Step 3: Delete old android dir ===
rd /s /q android

echo === Step 4: Re-prebuild ===
call npx expo prebuild --platform android

echo === Step 5: Re-apply packagingOptions ===
echo Add this to android\app\build.gradle inside android { } block:
echo     packagingOptions {
echo         pickFirst '**/libworklets.so'
echo     }
echo.
echo Please manually add packagingOptions, then press any key to continue...
pause

echo === Step 6: Build APK ===
cd android
.\gradlew assembleDebug --no-daemon

echo === Done ===
pause
