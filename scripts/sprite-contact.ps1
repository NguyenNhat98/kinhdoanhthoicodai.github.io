$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
$root=Join-Path $PSScriptRoot '..'
$entries=Get-Content -Encoding utf8 (Join-Path $root 'assets/sprites/manifest.json') -Raw | ConvertFrom-Json
$cols=10;$cellW=140;$cellH=120;$rows=[Math]::Ceiling($entries.Count/$cols)
$bitmap=[Drawing.Bitmap]::new($cols*$cellW,$rows*$cellH)
$g=[Drawing.Graphics]::FromImage($bitmap);$g.Clear([Drawing.Color]::LightGray)
$font=[Drawing.Font]::new('Arial',8)
for($i=0;$i -lt $entries.Count;$i++){
 $x=($i%$cols)*$cellW;$y=[Math]::Floor($i/$cols)*$cellH
 $im=[Drawing.Image]::FromFile((Join-Path $root $entries[$i].url))
 $scale=[Math]::Min(120/$im.Width,90/$im.Height)
 $g.FillRectangle([Drawing.Brushes]::White,$x,$y,139,119)
 $g.DrawImage($im,[single]($x+10),[single]($y+2),[single]($im.Width*$scale),[single]($im.Height*$scale))
 $g.DrawString("$i $($entries[$i].id)",$font,[Drawing.Brushes]::Black,[single]($x+2),[single]($y+94))
 $im.Dispose()
}
$bitmap.Save((Join-Path $root 'assets/sprites/contact.png'),[Drawing.Imaging.ImageFormat]::Png)
$g.Dispose();$font.Dispose();$bitmap.Dispose()
