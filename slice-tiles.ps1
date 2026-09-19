Add-Type -AssemblyName System.Drawing

$src = [System.Drawing.Bitmap]::FromFile("$PSScriptRoot\sample-captcha.png")
Write-Output "Image size: $($src.Width) x $($src.Height)"

# Grid starts around y=44 and x=15, height is around 300, width is around 344
# Let's find exact bounding of the outer grey border
$minX = $src.Width
$maxX = 0
$minY = $src.Height
$maxY = 0

for ($y = 30; $y -lt $src.Height; $y++) {
    for ($x = 5; $x -lt $src.Width; $x++) {
        $p = $src.GetPixel($x, $y)
        # Check if not background (background is near black #10151f approx)
        if ($p.R -gt 40 -or $p.G -gt 40 -or $p.B -gt 40) {
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
}

Write-Output "Grid detected: X=$minX..$maxX, Y=$minY..$maxY"

$gridW = $maxX - $minX
$gridH = $maxY - $minY
$tileW = [math]::Floor($gridW / 3)
$tileH = [math]::Floor($gridH / 3)

$tilesDir = "$PSScriptRoot\tiles"
if (-not (Test-Path $tilesDir)) {
    New-Item -ItemType Directory -Path $tilesDir | Out-Null
}

$tileNum = 1
for ($row = 0; $row -lt 3; $row++) {
    for ($col = 0; $col -lt 3; $col++) {
        $x = $minX + ($col * $tileW)
        $y = $minY + ($row * $tileH)
        
        $rect = New-Object System.Drawing.Rectangle($x, $y, $tileW, $tileH)
        $crop = $src.Clone($rect, $src.PixelFormat)
        $crop.Save("$tilesDir\tile$tileNum.png", [System.Drawing.Imaging.ImageFormat]::Png)
        $crop.Dispose()
        Write-Output "Saved tile$tileNum.png"
        $tileNum++
    }
}

$src.Dispose()
Write-Output "Done slicing tiles!"
