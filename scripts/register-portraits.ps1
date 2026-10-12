$ErrorActionPreference='Stop'
$root=(Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'
using System;using System.Drawing;using System.Drawing.Imaging;using System.Collections.Generic;
public static class DeskPortraitCut {
 public static void Export(string source,string target,int x,int y,int w,int h){
 using(var original=new Bitmap(source))using(var b=original.Clone(new Rectangle(x,y,w,h),PixelFormat.Format32bppArgb)){
 var seen=new bool[w*h];var q=new Queue<int>();for(int i=0;i<w;i++){q.Enqueue(i);q.Enqueue((h-1)*w+i);}for(int j=0;j<h;j++){q.Enqueue(j*w);q.Enqueue(j*w+w-1);}
 while(q.Count>0){int p=q.Dequeue();if(seen[p])continue;seen[p]=true;int px=p%w,py=p/w;var c=b.GetPixel(px,py);int hi=Math.Max(c.R,Math.Max(c.G,c.B)),lo=Math.Min(c.R,Math.Min(c.G,c.B));
 bool bg=(lo>=235&&hi-lo<=25)||(c.A<=96&&lo>=170&&hi-lo<=65)||(c.R>=235&&c.G>=210&&c.B>=175&&c.R>=c.G&&c.G>=c.B&&hi-lo<=70);
 if(c.A>8&&!bg)continue;b.SetPixel(px,py,Color.Transparent);if(px>0)q.Enqueue(p-1);if(px<w-1)q.Enqueue(p+1);if(py>0)q.Enqueue(p-w);if(py<h-1)q.Enqueue(p+w);}
 seen=new bool[w*h];var best=new List<int>();for(int i=0;i<w*h;i++){if(seen[i]||b.GetPixel(i%w,i/w).A==0)continue;var part=new List<int>();q.Enqueue(i);seen[i]=true;
 while(q.Count>0){int p=q.Dequeue(),px=p%w,py=p/w;part.Add(p);for(int yy=Math.Max(0,py-1);yy<=Math.Min(h-1,py+1);yy++)for(int xx=Math.Max(0,px-1);xx<=Math.Min(w-1,px+1);xx++){int k=yy*w+xx;if(!seen[k]&&b.GetPixel(xx,yy).A>0){seen[k]=true;q.Enqueue(k);}}}if(part.Count>best.Count)best=part;}
 var keep=new bool[w*h];foreach(int k in best)keep[k]=true;using(var output=new Bitmap(w+4,h+4,PixelFormat.Format32bppArgb)){for(int j=0;j<h;j++)for(int i=0;i<w;i++)if(keep[j*w+i])output.SetPixel(i+2,j+2,b.GetPixel(i,j));output.Save(target,ImageFormat.Png);}
 }}
}
'@
foreach($name in @('01_banh_mi.png','02_xoi_ngu_sac.png','03_tra_sua_a.png','04_tra_sua_b.png')){
 $source=Join-Path $root "../Anh/4_sprite_sheets_png/$name"
 if(Test-Path -LiteralPath $source){Copy-Item -LiteralPath $source -Destination (Join-Path $root "assets/source/$name")}
 elseif(!(Test-Path -LiteralPath (Join-Path $root "assets/source/$name"))){throw "Missing source sheet: $name"}
}
$file=Join-Path $root 'assets/sprites/manifest.json'
$entries=[Collections.Generic.List[object]]::new()
$raw=Get-Content -Encoding utf8 $file -Raw | ConvertFrom-Json
foreach($candidate in $raw){foreach($entry in @($candidate)){if($entry.id -and $entry.kind -notin @('portrait','queue')){$entries.Add($entry)}}}
function Register($sheet,$source,$kind,$rects){
 for($i=0;$i -lt $rects.Count;$i++){
  $r=$rects[$i];$id="$sheet-$kind-$i";$url="assets/sprites/$id.png"
  [DeskPortraitCut]::Export((Join-Path $root "assets/source/$source"),(Join-Path $root $url),($r[0]+24),($r[1]+24),$r[2],$r[3])
  $entries.Add([PSCustomObject]@{id=$id;sheet=$source;sheetWidth=1584;sheetHeight=1072;kind=$kind;rect=@(($r[0]+24),($r[1]+24),$r[2],$r[3]);padding=2;url=$url})
 }
}
Register banhmi '01_banh_mi.png' portrait @(@(815,43,81,79),@(896,43,78,79),@(974,43,78,79),@(1052,43,78,79),@(1130,43,81,79),@(1211,43,84,79))
Register xoi '02_xoi_ngu_sac.png' portrait @(@(704,44,70,101),@(779,44,66,101),@(848,44,68,101),@(919,44,64,101),@(988,44,73,101),@(1067,44,69,101),@(1140,44,65,101))
Register trasua '03_tra_sua_a.png' portrait @(@(797,44,66,72),@(863,40,64,76),@(927,40,60,76),@(993,40,59,76),@(1052,40,63,76),@(1116,40,59,76),@(1177,40,62,76))
Register trasua2 '04_tra_sua_b.png' portrait @(@(793,43,88,83),@(881,43,90,83),@(971,43,89,83),@(1060,43,78,83),@(1138,43,65,83),@(1203,43,65,83))
Register banhmi '01_banh_mi.png' queue @(@(1296,50,56,64),@(1352,51,38,62),@(1394,51,37,62),@(1438,51,42,63))
Register xoi '02_xoi_ngu_sac.png' queue @(@(1226,68,52,59),@(1280,70,29,53),@(1310,70,31,53),@(1341,71,34,51),@(1393,66,34,57),@(1428,70,25,53),@(1456,68,34,54))
Register trasua '03_tra_sua_a.png' queue @(@(1256,50,55,60),@(1316,50,42,56),@(1362,50,39,56),@(1408,50,40,56),@(1455,50,37,56))
Register trasua2 '04_tra_sua_b.png' queue @(@(892,197,46,44),@(938,197,46,44),@(984,197,46,44),@(1030,197,46,44),@(1076,197,46,44),@(1122,197,46,44),@(1168,197,46,44),@(1214,197,46,44))
$utf8=[Text.UTF8Encoding]::new($false)
[IO.File]::WriteAllText($file,($entries | ConvertTo-Json -Depth 6),$utf8)
[IO.File]::WriteAllText((Join-Path $root 'assets/sprites/manifest.js'),('window.SPRITES = '+($entries | ConvertTo-Json -Depth 6 -Compress)+';'),$utf8)
Write-Output "Registered 50 isolated characters; total $($entries.Count) assets."
