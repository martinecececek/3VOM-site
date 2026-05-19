Add-Type -AssemblyName System.Drawing

$imageFolder = "$PSScriptRoot\assets\image"
$maxWidth    = 1500
$maxHeight   = 1500
$jpegQuality = 80

$encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
$encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter(
    [System.Drawing.Imaging.Encoder]::Quality, [long]$jpegQuality
)
$jpegCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
    Where-Object { $_.MimeType -eq 'image/jpeg' }

Get-ChildItem $imageFolder -Recurse -Include "*.jpg","*.jpeg","*.JPG","*.JPEG" | ForEach-Object {
    $file = $_
    $sizeBefore = [math]::Round($file.Length / 1KB, 1)

    $img = [System.Drawing.Image]::FromFile($file.FullName)
    $w = $img.Width
    $h = $img.Height

    if ($w -le $maxWidth -and $h -le $maxHeight -and $file.Length -lt 500KB) {
        $img.Dispose()
        Write-Host "SKIP  $($file.Name) (${sizeBefore}KB, already small)" -ForegroundColor DarkGray
        return
    }

    $ratio = [math]::Min($maxWidth / $w, $maxHeight / $h)
    if ($ratio -ge 1) { $ratio = 1 }
    $newW = [int]($w * $ratio)
    $newH = [int]($h * $ratio)

    $bmp = New-Object System.Drawing.Bitmap($newW, $newH)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.DrawImage($img, 0, 0, $newW, $newH)
    $g.Dispose()
    $img.Dispose()

    $bmp.Save($file.FullName, $jpegCodec, $encoderParams)
    $bmp.Dispose()

    $sizeAfter = [math]::Round((Get-Item $file.FullName).Length / 1KB, 1)
    $saved = [math]::Round(($sizeBefore - $sizeAfter) / 1KB * 1024 / 1024, 1)
    Write-Host "OK    $($file.Name)  ${sizeBefore}KB -> ${sizeAfter}KB  (saved ~${saved}MB)" -ForegroundColor Green
}

Write-Host "`nDone. Note: PNG files were skipped - compress Kolat-shuzky.png manually at squoosh.app" -ForegroundColor Yellow
