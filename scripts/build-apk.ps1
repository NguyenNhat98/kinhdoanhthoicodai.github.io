<#
  Đóng gói game web thành file APK bằng Capacitor.

  Chạy (PowerShell, từ thư mục gốc dự án):
    powershell -NoProfile -ExecutionPolicy Bypass -File scripts/build-apk.ps1            # APK debug (cài thử ngay được)
    powershell -NoProfile -ExecutionPolicy Bypass -File scripts/build-apk.ps1 -Release   # APK release đã ký (đưa lên Google Play / chia sẻ)
    ... -Install                                                                         # cài thẳng vào điện thoại đang cắm USB (bật Gỡ lỗi USB)

  Yêu cầu: Node.js 18+, JDK 17+ (đang dùng 21), Android SDK (biến ANDROID_HOME).
  Build chạy ở C:\ChoCoApkBuild (đường dẫn dự án có dấu ' nên Gradle không chạy được ở đó); thư mục game không bị sửa.
  Kết quả: apk/out/DynastyTycoon-debug.apk  hoặc  apk/out/DynastyTycoon-release.apk
#>
param(
  [switch]$Release,
  [switch]$Install,
  [switch]$Aab,                # build file .aab (đưa lên Google Play), luôn là bản release đã ký
  [string]$AppId = 'com.nagamestudio.dynastytycoon',
  [string]$AppName = 'Dynasty Tycoon',
  [string]$VersionName = '1.0.0',
  [int]$VersionCode = 6,
  [string]$Icon = (Join-Path $PSScriptRoot '..\apk\icon\mascot-1024.png'),   # ảnh PNG vuông >= 512px; mặc định là ảnh đại diện apk\icon\icon.png
  [string]$WorkDir = 'C:\ChoCoApkBuild'   # PHẢI là đường dẫn không có dấu nháy ' / ký tự lạ (gradlew.bat lỗi nếu có)
)
$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$work = $WorkDir
$www  = Join-Path $work 'www'
$out  = Join-Path $root 'apk\out'
function Save($path, $text) { [IO.File]::WriteAllText((Join-Path (Get-Location).Path $path), $text, (New-Object System.Text.UTF8Encoding($false))) }   # UTF-8 KHÔNG BOM (BOM làm Gradle/XML lỗi)
function Load($path) { [IO.File]::ReadAllText((Join-Path (Get-Location).Path $path)) }
function Step($t) { Write-Host "`n=== $t ===" -ForegroundColor Cyan }
function Need($cmd, $hint) { if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) { throw "Thiếu '$cmd'. $hint" } }

Step '1/7 Kiểm tra công cụ'
Need node 'Cài Node.js LTS từ https://nodejs.org'
Need npm  'Cài Node.js LTS từ https://nodejs.org'
Need java 'Cài JDK 17 hoặc 21 (Temurin) và thêm vào PATH'
$sdk = $env:ANDROID_HOME; if (-not $sdk) { $sdk = $env:ANDROID_SDK_ROOT }
if (-not $sdk -or -not (Test-Path $sdk)) { $sdk = Join-Path $env:LOCALAPPDATA 'Android\Sdk' }
if (-not (Test-Path $sdk)) { throw 'Không thấy Android SDK. Cài Android Studio rồi đặt biến ANDROID_HOME (thường là %LOCALAPPDATA%\Android\Sdk).' }
$env:ANDROID_HOME = $sdk; $env:ANDROID_SDK_ROOT = $sdk
$adb = Join-Path $sdk 'platform-tools\adb.exe'
Write-Host "Node $(node -v) · Java OK · SDK $sdk"

Step '2/7 Chép file game vào thư mục build (bỏ ảnh nguồn, test, tài liệu)'
New-Item -ItemType Directory -Force $work, $out | Out-Null
if (Test-Path $www) { Remove-Item -Recurse -Force $www }
New-Item -ItemType Directory -Force $www | Out-Null
$exclude = @('.git', '.idea', '.qa', 'apk', 'tests', 'docs', 'scripts', 'node_modules', 'source', '*.md', 'assets-review.html', '.gitignore')
foreach ($item in Get-ChildItem $root -Force) {
  if ($exclude | Where-Object { $item.Name -like $_ }) { continue }
  Copy-Item $item.FullName -Destination $www -Recurse -Force
}
# Quảng cáo Unity LevelPlay: ID lấy từ apk\ads-config.json (appKey, interstitialId, rewardedId), ghi ra js\ads-config.js trong bản build
$adsFile = Join-Path $root 'apk\ads-config.json'
if (-not (Test-Path $adsFile)) { throw "Thiếu $adsFile (appKey, interstitialId, rewardedId lấy trong dashboard LevelPlay)" }
$ads = [IO.File]::ReadAllText($adsFile) | ConvertFrom-Json
foreach ($k in 'appKey', 'interstitialId', 'rewardedId') { if (-not $ads.$k -or $ads.$k -notmatch '^[A-Za-z0-9]+$') { throw "apk\ads-config.json: '$k' không hợp lệ" } }
$noBom = New-Object System.Text.UTF8Encoding($false)
[IO.File]::WriteAllText((Join-Path $www 'js\ads-config.js'), 'window.DT_ADS_CONFIG = ' + ($ads | ConvertTo-Json -Compress) + ';', $noBom)
$idx = Join-Path $www 'index.html'; $h = [IO.File]::ReadAllText($idx); $adsTag = '<script src="js/ads.js"></script>'
if (-not $h.Contains($adsTag)) { throw "index.html không có $adsTag" }
[IO.File]::WriteAllText($idx, $h.Replace($adsTag, '<script src="js/ads-config.js"></script>' + "`n" + $adsTag), $noBom)
# ảnh nguồn lớn (bảng sprite gốc) và ảnh cảnh thô không dùng trong game
$src = Join-Path $www 'assets\source'; if (Test-Path $src) { Remove-Item -Recurse -Force $src }
Get-ChildItem (Join-Path $www 'assets\scenes') -Filter '*.png' -ErrorAction SilentlyContinue | Remove-Item -Force
Get-ChildItem (Join-Path $www 'assets\sprites') -Filter 'contact*.png' -ErrorAction SilentlyContinue | Remove-Item -Force
$mb = [math]::Round(((Get-ChildItem $www -Recurse -File | Measure-Object Length -Sum).Sum) / 1MB, 1)
Write-Host "Dung lượng web: $mb MB"

Step '3/7 Tạo dự án Capacitor (lần đầu mất vài phút)'
Push-Location $work
try {
  # Capacitor 8: targetSdk/compileSdk 36 (Google Play yêu cầu target >= 36). Bản cũ hơn thì nâng cấp và tạo lại dự án android.
  $capVer = $null
  if (Test-Path 'node_modules\@capacitor\core\package.json') { $capVer = (Get-Content 'node_modules\@capacitor\core\package.json' -Raw | ConvertFrom-Json).version }
  if (-not (Test-Path 'package.json')) { Save 'package.json' (@{ name = 'choco-apk'; version = $VersionName; private = $true } | ConvertTo-Json) }
  if (-not $capVer -or -not $capVer.StartsWith('8.') -or -not (Test-Path 'node_modules\@capacitor\haptics')) {
    npm install @capacitor/core@8 @capacitor/cli@8 @capacitor/android@8 @capacitor/haptics@8 --no-audit --no-fund
    if ($LASTEXITCODE) { throw 'npm install lỗi' }
    if (Test-Path 'android') { Remove-Item -Recurse -Force 'android' }
  }
  $cfg = @{ appId = $AppId; appName = $AppName; webDir = 'www'; backgroundColor = '#fde8ec'; android = @{ allowMixedContent = $false }; server = @{ androidScheme = 'https' } } | ConvertTo-Json -Depth 5
  Save capacitor.config.json $cfg
  # đổi tên gói thì phải tạo lại dự án android (namespace/thư mục Java gắn với tên gói cũ)
  if ((Test-Path 'android\app\build.gradle') -and ((Load 'android\app\build.gradle') -notmatch [regex]::Escape("applicationId ""$AppId"""))) { Remove-Item -Recurse -Force 'android' }
  if (-not (Test-Path 'android')) { npx cap add android; if ($LASTEXITCODE) { throw 'cap add android lỗi' } }
  npx cap sync android
  if ($LASTEXITCODE) { throw 'cap sync lỗi' }

  Step '4/7 Cấu hình Android: dọc, toàn màn hình, phiên bản'
  $manifest = 'android\app\src\main\AndroidManifest.xml'
  $m = Load $manifest
  if ($m -notmatch 'screenOrientation') { $m = $m -replace '<activity', '<activity android:screenOrientation="portrait"' }
  if ($m -notmatch 'android.permission.VIBRATE') { $m = $m -replace '</manifest>', "    <uses-permission android:name=`"android.permission.VIBRATE`" />`n</manifest>" }   # thiếu quyền này thì không rung được
  if ($m -notmatch 'permission.AD_ID') { $m = $m -replace '</manifest>', "    <uses-permission android:name=`"com.google.android.gms.permission.AD_ID`" />`n</manifest>" }   # LevelPlay cần quyền mã quảng cáo (Android 13+)
  Save $manifest $m
  # Plugin LevelPlay (Java) + đăng ký trong MainActivity
  $javaDir = 'android\app\src\main\java\' + $AppId.Replace('.', '\')
  New-Item -ItemType Directory -Force $javaDir | Out-Null
  Save "$javaDir\LevelPlayPlugin.java" ((Get-Content (Join-Path $root 'apk\native\LevelPlayPlugin.java') -Raw -Encoding UTF8).Replace('__APP_ID__', $AppId))
  Save "$javaDir\MainActivity.java" "package $AppId;`n`nimport android.os.Bundle;`nimport com.getcapacitor.BridgeActivity;`n`npublic class MainActivity extends BridgeActivity {`n    @Override`n    public void onCreate(Bundle savedInstanceState) {`n        registerPlugin(LevelPlayPlugin.class);`n        super.onCreate(savedInstanceState);`n    }`n}`n"
  $styles = 'android\app\src\main\res\values\styles.xml'
  if (Test-Path $styles) {
    $s = Load $styles
    if ($s -notmatch 'windowFullscreen') { $s = $s -replace '(<style name="AppTheme.NoActionBar"[^>]*>)', "`$1`n        <item name=`"android:windowFullscreen`">true</item>`n        <item name=`"android:windowLayoutInDisplayCutoutMode`">shortEdges</item>" }
    Save $styles $s
  }
  $gradle = 'android\app\build.gradle'
  $g = Load $gradle
  $g = $g -replace 'versionCode \d+', "versionCode $VersionCode" -replace 'versionName "[^"]*"', "versionName `"$VersionName`""
  # SDK quảng cáo Unity LevelPlay + bộ chuyển Unity Ads
  if ($g -notmatch 'ads-mediation:mediation-sdk') {
    $deps = "implementation 'com.unity3d.ads-mediation:mediation-sdk:9.7.0'`n    implementation 'com.unity3d.ads-mediation:unityads-adapter:5.15.0'`n    implementation 'com.google.android.gms:play-services-ads-identifier:18.1.0'`n    "
    $g = $g -replace "implementation project\(':capacitor-android'\)", ($deps + "implementation project(':capacitor-android')")
  }
  Save $gradle $g
  # Google Play (tự động bảo vệ) yêu cầu minSdk >= 24; Capacitor mặc định là 23
  $vars = 'android\variables.gradle'
  Save $vars ((Load $vars) -replace 'minSdkVersion = \d+', 'minSdkVersion = 24' -replace 'compileSdkVersion = \d+', 'compileSdkVersion = 36' -replace 'targetSdkVersion = \d+', 'targetSdkVersion = 36')
  # chặn nén ảnh/âm thanh để không hỏng sprite
  $props = 'android\gradle.properties'
  if ((Get-Content $props -Raw) -notmatch 'android.useAndroidX') { Add-Content $props "`nandroid.useAndroidX=true" }

  Step '5/7 Biểu tượng ứng dụng'
  if ($Icon -and (Test-Path $Icon)) {
    New-Item -ItemType Directory -Force assets | Out-Null
    # Icon thích ứng (adaptive): dùng sẵn 2 lớp do bạn thiết kế trong apk\icon (icon-foreground.png + icon-background.png), không tự dựng lại
    $iconDir = Split-Path (Resolve-Path $Icon).Path
    Copy-Item (Join-Path $iconDir 'icon-foreground.png') 'assets\icon-foreground.png' -Force
    Copy-Item (Join-Path $iconDir 'icon-background.png') 'assets\icon-background.png' -Force
    Copy-Item $Icon 'assets\icon-only.png' -Force
    npm install @capacitor/assets --no-save --no-audit --no-fund
    npx capacitor-assets generate --android --iconBackgroundColor '#fde8ec'
    # Bỏ inset 16.7% mà capacitor-assets tự thêm (làm icon bị thu nhỏ và hở viền): để 2 lớp phủ kín đúng như file gốc
    $adx = '<?xml version="1.0" encoding="utf-8"?>' + "`n" + '<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">' + "`n" + '    <background android:drawable="@mipmap/ic_launcher_background" />' + "`n" + '    <foreground android:drawable="@mipmap/ic_launcher_foreground" />' + "`n" + '</adaptive-icon>' + "`n"
    foreach ($n in 'ic_launcher','ic_launcher_round') { [IO.File]::WriteAllText((Join-Path (Get-Location).Path "android\app\src\main\res\mipmap-anydpi-v26\$n.xml"), $adx, (New-Object Text.UTF8Encoding $false)) }
  } else { Write-Host 'Không truyền -Icon nên dùng biểu tượng mặc định (truyền -Icon duongdan\icon.png để đổi).' }

  # Tên hiển thị dưới biểu tượng: dự án android được giữ lại giữa các lần build nên phải ghi đè strings.xml mỗi lần
  $strings = 'android\app\src\main\res\values\strings.xml'
  if (Test-Path $strings) {
    $x = Load $strings
    $x = [regex]::Replace($x, '(<string name="app_name">)[^<]*(</string>)', { param($m) $m.Groups[1].Value + $AppName + $m.Groups[2].Value })
    $x = [regex]::Replace($x, '(<string name="title_activity_main">)[^<]*(</string>)', { param($m) $m.Groups[1].Value + $AppName + $m.Groups[2].Value })
    Save $strings $x
  }

  Step '6/7 Chấp nhận giấy phép SDK + build'
  $sdkmgr = Join-Path $sdk 'cmdline-tools\latest\bin\sdkmanager.bat'
  if (Test-Path $sdkmgr) { cmd /c "(for /L %i in (1,1,30) do @echo y) | `"$sdkmgr`" --licenses" | Out-Null }
  "sdk.dir=$($sdk -replace '\\','/')" | Set-Content -Encoding ascii 'android\local.properties'
  # build.gradle (đã chèn signingConfigs ở lần build release) luôn đọc 2 biến này; thiếu thì build debug cũng lỗi "does not specify compileSdk"
  $env:CHOCO_KS = Join-Path $work 'choco-release.keystore'; $env:CHOCO_PASS = 'choco-2026-change-me'
  Push-Location android
  try {
    if ($Release -or $Aab) {
      $ks = Join-Path $work 'choco-release.keystore'; $pass = 'choco-2026-change-me'
      if (-not (Test-Path $ks)) {
        Write-Host 'Tạo khóa ký release (GIỮ KỸ file apk\choco-release.keystore, mất là không cập nhật được app trên Google Play)' -ForegroundColor Yellow
        keytool -genkeypair -v -keystore $ks -alias choco -keyalg RSA -keysize 2048 -validity 10000 -storepass $pass -keypass $pass -dname 'CN=Cho Co, OU=Game, O=ChoCo, C=VN' | Out-Null
      }
      $env:CHOCO_KS = $ks; $env:CHOCO_PASS = $pass
      $gp = Load 'app\build.gradle'
      if ($gp -notmatch 'signingConfigs') {
        $sign = "    signingConfigs {`n        release {`n            storeFile file(System.getenv('CHOCO_KS'))`n            storePassword System.getenv('CHOCO_PASS')`n            keyAlias 'choco'`n            keyPassword System.getenv('CHOCO_PASS')`n        }`n    }`n"
        $gp = $gp -replace '(?m)^android \{', "android {`n$sign"
        $gp = $gp -replace '(?m)(buildTypes \{\s*release \{)', "`$1`n            signingConfig signingConfigs.release"
        Save 'app\build.gradle' $gp
      }
      if ($Aab) {
        .\gradlew.bat bundleRelease --no-daemon
        if ($LASTEXITCODE) { throw 'Gradle bundleRelease lỗi' }
        $bundle = Get-ChildItem 'app\build\outputs\bundle\release' -Filter '*.aab' | Select-Object -First 1
        Copy-Item $bundle.FullName (Join-Path $out 'DynastyTycoon-release.aab') -Force; $final = Join-Path $out 'DynastyTycoon-release.aab'
        Copy-Item $ks (Join-Path $out 'choco-release.keystore') -Force   # sao lưu khóa ký cạnh file aab
      } else {
        .\gradlew.bat assembleRelease --no-daemon
        if ($LASTEXITCODE) { throw 'Gradle assembleRelease lỗi' }
        $apk = Get-ChildItem 'app\build\outputs\apk\release' -Filter '*.apk' | Select-Object -First 1
        Copy-Item $apk.FullName (Join-Path $out 'DynastyTycoon-release.apk') -Force; $final = Join-Path $out 'DynastyTycoon-release.apk'
      }
    } else {
      .\gradlew.bat assembleDebug --no-daemon
      if ($LASTEXITCODE) { throw 'Gradle assembleDebug lỗi' }
      $apk = Get-ChildItem 'app\build\outputs\apk\debug' -Filter '*.apk' | Select-Object -First 1
      Copy-Item $apk.FullName (Join-Path $out 'DynastyTycoon-debug.apk') -Force; $final = Join-Path $out 'DynastyTycoon-debug.apk'
    }
  } finally { Pop-Location }
} finally { Pop-Location }

Step '7/7 Hoàn tất'
$size = [math]::Round((Get-Item $final).Length / 1MB, 1)
Write-Host "APK: $final ($size MB)" -ForegroundColor Green
if ($Install -and -not $Aab) {
  if (-not (Test-Path $adb)) { throw "Không thấy adb tại $adb" }
  & $adb devices
  & $adb install -r $final
  & $adb shell monkey -p $AppId -c android.intent.category.LAUNCHER 1 | Out-Null
  Write-Host 'Đã cài và mở game trên điện thoại.' -ForegroundColor Green
} else {
  Write-Host 'Chép file APK vào điện thoại và mở để cài (cho phép "cài từ nguồn không rõ"), hoặc chạy lại với -Install khi đã cắm USB.'
}
