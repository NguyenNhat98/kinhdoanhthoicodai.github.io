param([int]$Width=390,[int]$Height=844,[string]$Page='tests/browser.html',[string]$Name='browser',[string]$Mode='market',[string]$Shop='trasua')
$ErrorActionPreference='Stop'
$root=(Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$qa=Join-Path $root '.qa';New-Item -ItemType Directory -Force $qa | Out-Null
$browser='C:/Program Files/Google/Chrome/Application/chrome.exe'
if(!(Test-Path $browser)){$browser='C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'}
$profile=Join-Path $qa ('profile-'+[Guid]::NewGuid().ToString('N'))
$url=([Uri](Join-Path $root $Page)).AbsoluteUri+"?width=$Width&height=$Height&mode=$Mode&shop=$Shop"
try {
$args=@('--headless','--no-sandbox','--disable-gpu','--no-first-run','--allow-file-access-from-files',('--user-data-dir="'+$profile+'"'),"--window-size=$Width,$Height",'--virtual-time-budget=7000','--hide-scrollbars',('--screenshot="'+(Join-Path $qa "$Name.png")+'"'),'--dump-dom',$url)
$process=Start-Process -FilePath $browser -ArgumentList $args -PassThru -WindowStyle Hidden -RedirectStandardOutput (Join-Path $qa "$Name.html") -RedirectStandardError (Join-Path $qa "$Name.log")
if(!$process.WaitForExit(25000)){Stop-Process -Id $process.Id;throw 'Browser check timed out.'}
$html=''
for($attempt=0;$attempt -lt 50;$attempt++){
 $stream=[IO.File]::Open((Join-Path $qa "$Name.html"),[IO.FileMode]::Open,[IO.FileAccess]::Read,[IO.FileShare]::ReadWrite)
 $reader=[IO.StreamReader]::new($stream);$html=$reader.ReadToEnd();$reader.Dispose()
 if($html.Contains('</html>')){break}
 Start-Sleep -Milliseconds 100
}
if($Page -in @('tests/browser.html','tests/market.html')){
 $match=[regex]::Match($html,'<pre id="result">([\s\S]*?)</pre>')
 if(!$match.Success){throw 'No browser result.'}
 $result=[System.Net.WebUtility]::HtmlDecode($match.Groups[1].Value) | ConvertFrom-Json
 $result | ConvertTo-Json -Depth 6 | Set-Content -Encoding utf8 (Join-Path $qa "$Name.json")
 if($result.status -ne 'PASS'){$result | ConvertTo-Json -Depth 6;throw 'Browser checks failed.'}
 Write-Output "PASS: $($result.count) checks at ${Width}x${Height}"
}else {Write-Output "Captured $Page at ${Width}x${Height}"}
} finally {
 # Each check uses a disposable browser profile; keep only reports/screenshots.
 $profilePath=[IO.Path]::GetFullPath($profile)
 $qaPath=[IO.Path]::GetFullPath($qa)+[IO.Path]::DirectorySeparatorChar
 if(!$profilePath.StartsWith($qaPath,[StringComparison]::OrdinalIgnoreCase)){throw 'Profile cleanup path is outside .qa.'}
 if(Test-Path -LiteralPath $profilePath){
  try {Remove-Item -LiteralPath $profilePath -Recurse -Force -ErrorAction Stop}
  catch {Write-Warning "Could not remove temporary browser profile: $profilePath"}
 }
}
