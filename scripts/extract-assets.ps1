param([string]$Source = (Join-Path $PSScriptRoot '../../Anh'))
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Collections.Generic;
public static class SpriteCut {
 public static void Export(string source, string output, int x, int y, int w, int h) {
  using(var original = new Bitmap(source)) using(var b = original.Clone(new Rectangle(x,y,w,h), PixelFormat.Format32bppArgb)) {
   // Remove only light, neutral background connected to the crop boundary.
   // Dark outlines and enclosed white details remain original pixels.
   bool checker=source.Contains("Trà Đá") || source.Contains("Mì Cay");
   var seen = new bool[w*h]; var q = new Queue<int>();
   for(int i=0;i<w;i++){q.Enqueue(i);q.Enqueue((h-1)*w+i);}
   for(int j=0;j<h;j++){q.Enqueue(j*w);q.Enqueue(j*w+w-1);}
   while(q.Count>0){int p=q.Dequeue();if(seen[p])continue;seen[p]=true;
    int px=p%w,py=p/w;var c=b.GetPixel(px,py);
    int hi=Math.Max(c.R,Math.Max(c.G,c.B)),lo=Math.Min(c.R,Math.Min(c.G,c.B));
    bool background=checker ? lo>=180 && hi-lo<=6 : (lo>=235 && hi-lo<=25) || (c.R>=238 && c.G>=224 && c.B>=200 && c.R>=c.G && c.G>=c.B && hi-lo<=50);
    if(c.A>0 && !background)continue;
    b.SetPixel(px,py,Color.FromArgb(0,c.R,c.G,c.B));
    if(px>0)q.Enqueue(p-1);if(px<w-1)q.Enqueue(p+1);if(py>0)q.Enqueue(p-w);if(py<h-1)q.Enqueue(p+w);
   }
   // A crop can include a detached tip of its neighbour. Keep the principal
   // connected silhouette only, never a second icon or panel corner.
   var visited=new bool[w*h];var best=new List<int>();
   for(int k=0;k<w*h;k++) {
    if(visited[k] || b.GetPixel(k%w,k/w).A==0)continue;
    var component=new List<int>();q.Enqueue(k);visited[k]=true;
    while(q.Count>0){int p=q.Dequeue();component.Add(p);int px=p%w,py=p/w;
     for(int yy=Math.Max(0,py-1);yy<=Math.Min(h-1,py+1);yy++)
      for(int xx=Math.Max(0,px-1);xx<=Math.Min(w-1,px+1);xx++) {
       int j=yy*w+xx;if(!visited[j] && b.GetPixel(xx,yy).A>0){visited[j]=true;q.Enqueue(j);}
      }
    }
    if(component.Count>best.Count)best=component;
   }
   var keep=new bool[w*h];foreach(int k in best)keep[k]=true;
   for(int k=0;k<w*h;k++)if(!keep[k])b.SetPixel(k%w,k/w,Color.Transparent);
   // Transparent gutter prevents rectangular tray sprites from touching other
   // UI assets when packed or scaled. Copy pixels without interpolation.
   using(var padded=new Bitmap(w+4,h+4,PixelFormat.Format32bppArgb)) {
    for(int py=0;py<h;py++)for(int px=0;px<w;px++)padded.SetPixel(px+2,py+2,b.GetPixel(px,py));
    padded.Save(output,ImageFormat.Png);
   }
  }
 }
}
'@
$out = Join-Path $PSScriptRoot '../assets/sprites'
New-Item -ItemType Directory -Force $out | Out-Null
$sheets = @{
 trada='Bộ tài sản game Trà Đá Việt Nam.png'; trasua='Bộ giao diện game tiệm trà sữa cổ phong-2.png';
 banhmi='Bộ tài sản game Bánh Mì Cổ Phong.png'; xoi='Bộ tài sản game quán Xôi Ngũ Sắc.png';
 mycay='Bộ Sprite Game Quán Mì Cay Bảy Cấp.png'; trasua2='Tiệm Trà Sữa Cổ Phong – Giao Diện Game Chibi-1.png'
}
$manifest = [System.Collections.Generic.List[object]]::new()
function Cut($sheet,$name,$x,$y,$w,$h) {
 $src=Join-Path $Source $sheets[$sheet]
 $file="$sheet-$name.png"
 [SpriteCut]::Export($src,(Join-Path $out $file),$x,$y,$w,$h)
 $manifest.Add([PSCustomObject]@{id="$sheet-$name";sheet=$sheets[$sheet];rect=@($x,$y,$w,$h);padding=2;url="assets/sprites/$file"})
}
# Irregular sheets: per-row bounds, not a blind grid over the complete image.
function Row($sheet,$names,$edges,$y,$bottom,$padding=0) {
 for($i=0;$i -lt $names.Count;$i++){
  $left=[Math]::Max(0,$edges[$i]-$padding);$right=[Math]::Min(1536,$edges[$i+1]+$padding)
  Cut $sheet $names[$i] $left $y ($right-$left) ($bottom-$y)
 }
}
Row trada @('drink-tea','drink-lemon','drink-kumquat','drink-peach','drink-black','drink-lotus','drink-matcha','drink-herbal','drink-soy','drink-milk','drink-lychee') @(740,816,889,965,1041,1116,1186,1250,1320,1390,1459,1532) 241 348
Row trada @('lime','kumquat','peach','lychee','aloe','lotus','pearl-white','pearl-black','fruit-jelly','coconut-jelly','pudding') @(701,784,855,933,1008,1084,1159,1235,1310,1385,1463,1530) 533 618
Row trada @('leaves','mint','jasmine','butterfly','chrysanthemum','longan','basil','chia','grass-jelly','cheese') @(699,774,851,929,1006,1083,1162,1242,1323,1427,1530) 619 703
Row trada @('sunflower','peanut','cruller','rice-cake','melon-seed','dried-chicken','dried-mango','salted-fruit','ginger','dried-jackfruit') @(636,738,831,915,1002,1088,1172,1259,1351,1442,1530) 706 791
# Full body pedestrians, separated from mood indicators and drink row.
Row trada @('walker-0','walker-1','walker-2','walker-3','walker-4','walker-5','walker-6','walker-7','walker-8','walker-9') @(1037,1086,1137,1187,1238,1288,1338,1389,1439,1489,1535) 166 241 7
Row trasua @('pearl-black','pearl-white','pearl-gold','pearl-fruit','cheese','matcha-jelly','strawberry-jelly','coconut-jelly','water-chestnut','grass-jelly') @(17,100,184,267,349,423,498,575,654,733,814) 468 543
Row trasua @('pudding','chocolate-pudding','flan','lotus','red-bean','mung-bean','taro','sweet-potato','fruit-jelly','ice') @(16,100,184,265,347,423,499,576,655,733,814) 548 633
Row trasua @('milk','condensed','yogurt','cream','taro-cream') @(834,900,961,1022,1082,1151) 473 546
Row trasua @('chocolate','caramel','vanilla','strawberry','peach','mango') @(830,880,938,992,1048,1103,1159) 550 634
Row trasua @('ice-cubes','tea-leaves','brown-sugar') @(1198,1279,1358,1438) 474 551
Cut trasua 'matcha-powder' 1190 550 119 80
Cut trasua 'taro-powder' 1309 550 114 80
Cut trasua 'cocoa-powder' 1424 541 108 89
Row banhmi @('grilled-meat','char-siu','pate','chicken','sausage','ham','egg','beef','fish','fish-can') @(815,899,973,1045,1118,1190,1263,1335,1405,1477,1535) 431 518
Row banhmi @('cucumber','tomato','coriander','pickle','chili','scallion','herbs','herbs-extra') @(820,915,1006,1093,1181,1266,1350,1432,1521) 551 637
Row banhmi @('chili-sauce','soy-sauce','ketchup','mayonnaise','garlic-sauce','sesame-sauce','special-sauce') @(24,86,149,211,273,337,399,451) 624 747
Row banhmi @('bread-meat','bread-char-siu','bread-pate','bread-chicken','bread-vegan','bread-special') @(952,1046,1142,1240,1334,1428,1531) 674 776
Row xoi @('rice','chicken','sausage','mung-bean','red-bean','lotus','coconut','fried-onion','coconut-milk','spices') @(16,87,157,225,295,365,435,502,571,642,701) 435 517
Row xoi @('purple','red','yellow','green','white') @(16,89,156,224,293,368) 519 599
Row xoi @('quail-egg','floss','peanut','scallion','ribs','braised-meat') @(385,440,495,549,603,653,704) 545 620
Row mycay @('noodle-egg','noodle-fresh','noodle-rice','noodle-udon','noodle-black','noodle-green') @(767,882,995,1105,1213,1321,1434) 409 506
Row mycay @('beef','pork','shrimp','squid','crab','meatball','egg','enoki','shiitake') @(771,850,926,1000,1068,1138,1205,1269,1351,1441) 511 594
Row mycay @('mustard','spinach','sprouts','cabbage','scallion','coriander','mixed-vegetables') @(768,881,973,1062,1161,1256,1350,1432) 600 692
# Sixth supplied board has its own geometry; keep these variants distinct.
Row trasua2 @('pearl-black','pearl-white','coconut-jelly','matcha-jelly','peach-jelly','fruit-jelly') @(973,1071,1169,1274,1371,1454,1526) 432 522
Row trasua2 @('pudding','red-bean','mung-bean','taro','sweet-potato','flan') @(972,1067,1174,1276,1370,1451,1526) 527 606
Row trasua2 @('ui-shop','ui-upgrade','ui-quest','ui-map','ui-trophy','ui-settings','ui-coin','ui-gem','ui-energy','ui-ticket','ui-decor','ui-bag','ui-store','ui-exit') @(18,87,157,228,302,367,435,502,575,628,694,752,821,885,950) 912 971
# Backdrops preserve every source pixel; they are scenes, not cutout icons.
$sceneOut=Join-Path $PSScriptRoot '../assets/scenes'
New-Item -ItemType Directory -Force $sceneOut | Out-Null
foreach($spec in @(@('trada',739,428),@('trasua',790,440),@('banhmi',808,465),@('xoi',696,404),@('mycay',767,406))) {
 $original=[Drawing.Bitmap]::new((Join-Path $Source $sheets[$spec[0]]))
 $scene=$original.Clone([Drawing.Rectangle]::new(0,0,$spec[1],$spec[2]),[Drawing.Imaging.PixelFormat]::Format32bppArgb)
 $scene.Save((Join-Path $sceneOut ($spec[0]+'.png')),[Drawing.Imaging.ImageFormat]::Png)
 $scene.Dispose();$original.Dispose()
}
$utf8 = [System.Text.UTF8Encoding]::new($false)
[IO.File]::WriteAllText((Join-Path $out 'manifest.json'),($manifest | ConvertTo-Json -Depth 5),$utf8)
[IO.File]::WriteAllText((Join-Path $out 'manifest.js'),('window.SPRITES = '+($manifest | ConvertTo-Json -Depth 5 -Compress)+';'),$utf8)
Write-Output "Extracted $($manifest.Count) sprites. Inspect assets-review.html before adding new bounds."
