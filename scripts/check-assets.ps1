$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'
using System;
using System.Drawing;
using System.Collections.Generic;
public static class SpriteVerify {
 static Dictionary<string,Bitmap> cache=new Dictionary<string,Bitmap>();
 public static void Check(string file,string source,int x,int y,int width,int height,int padding) {
  if(!cache.ContainsKey(source))cache[source]=new Bitmap(source);
  Bitmap original=cache[source];
  using(var b=new Bitmap(file)) {
   if(b.Width!=width+padding*2||b.Height!=height+padding*2)throw new Exception("Wrong dimensions: "+file);
   int visible=0,clear=0;
   for(int j=0;j<b.Height;j++)for(int i=0;i<b.Width;i++) {
    var c=b.GetPixel(i,j);if(c.A==0){clear++;continue;}visible++;
    if(i<padding||j<padding||i>=width+padding||j>=height+padding)throw new Exception("Nontransparent gutter: "+file);
    var s=original.GetPixel(x+i-padding,y+j-padding);
    if(c.ToArgb()!=s.ToArgb())throw new Exception("Changed source pixel: "+file);
   }
   if(visible<30||clear<10)throw new Exception("Empty sprite or missing transparency: "+file);
  }
 }
 public static void Close(){foreach(var b in cache.Values)b.Dispose();cache.Clear();}
}
'@
$root=(Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$entries=Get-Content -Encoding utf8 (Join-Path $root 'assets/sprites/manifest.json') -Raw | ConvertFrom-Json
$seen=@{}
try {
 foreach($asset in $entries) {
  if($seen.ContainsKey($asset.id)){throw "Duplicate ID $($asset.id)"};$seen[$asset.id]=$true
  $rect=$asset.rect
  if($asset.kind -in @('portrait','queue')){
   foreach($other in $entries){
    if($other.id -eq $asset.id -or $other.sheet -ne $asset.sheet -or $other.kind -notin @('portrait','queue')){continue}
    $r=$other.rect
    if($rect[0] -lt ($r[0]+$r[2]) -and ($rect[0]+$rect[2]) -gt $r[0] -and $rect[1] -lt ($r[1]+$r[3]) -and ($rect[1]+$rect[3]) -gt $r[1]){throw "Overlapping character bounds: $($asset.id), $($other.id)"}
   }
  }
  [SpriteVerify]::Check((Join-Path $root $asset.url),(Join-Path $root ('assets/source/'+$asset.sheet)),$rect[0],$rect[1],$rect[2],$rect[3],$asset.padding)
 }
} finally {[SpriteVerify]::Close()}
Write-Output "PASS: $($entries.Count) PNGs, unique IDs, alpha, dimensions, and unchanged retained pixels."
