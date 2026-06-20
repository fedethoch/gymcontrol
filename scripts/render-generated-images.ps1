param(
  [string]$Manifest = "scripts/media/generated-image-manifest.json"
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$ProjectRoot = (Get-Location).Path
$ManifestPath = [System.IO.Path]::GetFullPath((Join-Path $ProjectRoot $Manifest))
$ManifestJson = Get-Content -Raw -LiteralPath $ManifestPath | ConvertFrom-Json
$Width = 1536
$Height = 864

function Get-StableHash([string]$Value) {
  [uint64]$hash = 2166136261
  foreach ($char in $Value.ToCharArray()) {
    $hash = ($hash -bxor [uint64][int][char]$char)
    $hash = ($hash * 16777619) % 4294967296
  }
  return [uint32]$hash
}

function New-Color([int]$R, [int]$G, [int]$B, [int]$A = 255) {
  return [System.Drawing.Color]::FromArgb($A, $R, $G, $B)
}

function Blend-Color([System.Drawing.Color]$Color, [int]$Amount) {
  return New-Color `
    ([Math]::Min(255, [Math]::Max(0, $Color.R + $Amount))) `
    ([Math]::Min(255, [Math]::Max(0, $Color.G + $Amount))) `
    ([Math]::Min(255, [Math]::Max(0, $Color.B + $Amount))) `
    $Color.A
}

function Get-Palette($Asset) {
  $key = "$($Asset.kind)|$($Asset.name)|$($Asset.prompt)"
  $hash = Get-StableHash $key
  $palettes = @(
    @((New-Color 25 34 45), (New-Color 224 135 73), (New-Color 93 178 121)),
    @((New-Color 18 30 42), (New-Color 81 144 214), (New-Color 238 188 84)),
    @((New-Color 32 26 43), (New-Color 181 112 215), (New-Color 86 189 173)),
    @((New-Color 35 31 27), (New-Color 213 100 88), (New-Color 234 192 96)),
    @((New-Color 16 39 35), (New-Color 80 181 129), (New-Color 234 151 73))
  )
  return $palettes[$hash % $palettes.Count]
}

function Fill-Background($Graphics, $Palette) {
  $rect = New-Object System.Drawing.Rectangle 0, 0, $Width, $Height
  $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush $rect, $Palette[0], (Blend-Color $Palette[0] 34), 28
  $Graphics.FillRectangle($brush, $rect)
  $brush.Dispose()

  for ($i = 0; $i -lt 6; $i++) {
    $alpha = 22 + ($i * 8)
    $color = New-Color $Palette[1].R $Palette[1].G $Palette[1].B $alpha
    $orbBrush = New-Object System.Drawing.SolidBrush $color
    $x = 100 + (($i * 271) % 1200)
    $y = 70 + (($i * 149) % 560)
    $size = 180 + (($i * 57) % 240)
    $Graphics.FillEllipse($orbBrush, $x, $y, $size, $size)
    $orbBrush.Dispose()
  }
}

function Draw-FoodImage($Graphics, $Asset, $Palette) {
  Fill-Background $Graphics $Palette

  $tableBrush = New-Object System.Drawing.SolidBrush (New-Color 11 15 22 155)
  $Graphics.FillRectangle($tableBrush, 0, 550, $Width, 314)
  $tableBrush.Dispose()

  $plateShadow = New-Object System.Drawing.SolidBrush (New-Color 0 0 0 95)
  $Graphics.FillEllipse($plateShadow, 365, 565, 820, 170)
  $plateShadow.Dispose()

  $plate = New-Object System.Drawing.SolidBrush (New-Color 234 232 224)
  $Graphics.FillEllipse($plate, 345, 180, 850, 500)
  $plate.Dispose()

  $inner = New-Object System.Drawing.SolidBrush (New-Color 214 211 202)
  $Graphics.FillEllipse($inner, 430, 240, 680, 380)
  $inner.Dispose()

  $seed = Get-StableHash "$($Asset.name)|$($Asset.prompt)"
  $foodColors = @(
    (New-Color 236 186 76),
    (New-Color 218 92 73),
    (New-Color 87 170 102),
    (New-Color 245 239 214),
    (New-Color 138 82 48),
    (New-Color 238 132 95),
    (New-Color 112 70 43)
  )

  for ($i = 0; $i -lt 18; $i++) {
    $color = $foodColors[($seed + $i) % $foodColors.Count]
    $brush = New-Object System.Drawing.SolidBrush $color
    $x = 470 + (($seed + $i * 83) % 500)
    $y = 285 + (($seed + $i * 47) % 260)
    $w = 70 + (($seed + $i * 29) % 120)
    $h = 34 + (($seed + $i * 37) % 92)
    $Graphics.FillEllipse($brush, $x, $y, $w, $h)
    $brush.Dispose()
  }

  $accent = New-Object System.Drawing.SolidBrush $Palette[2]
  for ($i = 0; $i -lt 10; $i++) {
    $x = 520 + (($seed + $i * 113) % 430)
    $y = 305 + (($seed + $i * 71) % 220)
    $Graphics.FillEllipse($accent, $x, $y, 32, 18)
  }
  $accent.Dispose()
}

function Draw-RoutineImage($Graphics, $Asset, $Palette) {
  Fill-Background $Graphics $Palette

  $floorBrush = New-Object System.Drawing.SolidBrush (New-Color 7 10 16 185)
  $Graphics.FillRectangle($floorBrush, 0, 560, $Width, 304)
  $floorBrush.Dispose()

  $linePen = New-Object System.Drawing.Pen (New-Color 255 255 255 24), 3
  for ($i = 0; $i -lt 8; $i++) {
    $y = 610 + $i * 34
    $Graphics.DrawLine($linePen, 0, $y, $Width, $y + 52)
  }
  $linePen.Dispose()

  $metal = New-Object System.Drawing.Pen (New-Color 217 223 232), 28
  $Graphics.DrawLine($metal, 290, 455, 1245, 455)
  $metal.Dispose()

  $plateBrush = New-Object System.Drawing.SolidBrush $Palette[1]
  $darkPlate = New-Object System.Drawing.SolidBrush (Blend-Color $Palette[1] -55)
  foreach ($x in @(230, 270, 1210, 1250)) {
    $Graphics.FillRectangle($darkPlate, $x, 340, 32, 230)
    $Graphics.FillRectangle($plateBrush, $x + 12, 320, 34, 270)
  }
  $plateBrush.Dispose()
  $darkPlate.Dispose()

  $benchBrush = New-Object System.Drawing.SolidBrush (New-Color 26 34 48)
  $Graphics.FillRectangle($benchBrush, 560, 520, 420, 54)
  $Graphics.FillRectangle($benchBrush, 625, 575, 38, 190)
  $Graphics.FillRectangle($benchBrush, 885, 575, 38, 190)
  $benchBrush.Dispose()

  $accentPen = New-Object System.Drawing.Pen $Palette[2], 14
  $Graphics.DrawArc($accentPen, 610, 185, 310, 310, 210, 120)
  $Graphics.DrawArc($accentPen, 700, 160, 310, 310, 210, 120)
  $accentPen.Dispose()
}

function Render-Asset($Asset) {
  $bitmap = New-Object System.Drawing.Bitmap $Width, $Height
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

  $palette = Get-Palette $Asset
  if ($Asset.kind -eq "routine" -or $Asset.kind -eq "dashboard") {
    Draw-RoutineImage $graphics $Asset $palette
  } else {
    Draw-FoodImage $graphics $Asset $palette
  }

  $outputPath = [System.IO.Path]::GetFullPath((Join-Path $ProjectRoot $Asset.localPath))
  New-Item -ItemType Directory -Force -Path ([System.IO.Path]::GetDirectoryName($outputPath)) | Out-Null
  $bitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $graphics.Dispose()
  $bitmap.Dispose()
}

foreach ($asset in $ManifestJson.assets) {
  Render-Asset $asset
  if (-not $asset.bucket) {
    $asset.status = "generated"
  }
}

$ManifestJson | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $ManifestPath -Encoding utf8
Write-Host "Rendered $($ManifestJson.assets.Count) generated images."
