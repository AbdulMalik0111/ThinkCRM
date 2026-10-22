Add-Type -AssemblyName System.Drawing
$imgPath = Resolve-Path "ThinkCRM-Admin\public\logo.webp"
# Load webp using Windows imaging or check if System.Drawing can load it
try {
    $bmp = [System.Drawing.Bitmap]::FromFile($imgPath)
    Write-Host "Width: $($bmp.Width), Height: $($bmp.Height), PixelFormat: $($bmp.PixelFormat)"
    $bmp.Dispose()
} catch {
    Write-Host "System.Drawing error: $_"
}
