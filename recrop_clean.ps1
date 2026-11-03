Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\Bryand\.gemini\antigravity\brain\80324854-86b0-4c9c-8408-6ee395d78adc\.user_uploaded\media_1793625191618_99f4d231.jpg"
$outPath = "c:\Users\Bryand\Documents\Tests\Portofolio Kevin\assets\images\top-cyan-droplet.png"

$src = [System.Drawing.Image]::FromFile($srcPath)

# Locate the droplet in 1024x442 image:
# Looking closely at the image:
# Left edge of droplet is around x=336, Right edge is around x=734 (width ~ 398)
# Top starts at y=0, bottom reaches down to around y=190
$rect = New-Object System.Drawing.Rectangle(330, 0, 410, 192)
$bmp = New-Object System.Drawing.Bitmap($rect.Width, $rect.Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.DrawImage($src, (New-Object System.Drawing.Rectangle(0, 0, $rect.Width, $rect.Height)), $rect, [System.Drawing.GraphicsUnit]::Pixel)
$g.Dispose()

# Feathered / smooth alpha masking based on color distance from droplet cyan/blue
# Droplet has cyan/blue content (B > R, G > R). Outside is light cream paper (R ~ 248, G ~ 247, B ~ 243)
for ($y = 0; $y -lt $bmp.Height; $y++) {
    for ($x = 0; $x -lt $bmp.Width; $x++) {
        $c = $bmp.GetPixel($x, $y)
        
        # Calculate saturation or distance to cyan/blue
        # Background is nearly neutral gray/cream (R, G, B are very close and > 220)
        $diffRG = [Math]::Abs($c.R - $c.G)
        $diffGB = [Math]::Abs($c.G - $c.B)
        $isPaper = ($c.R -gt 225 -and $c.G -gt 225 -and $c.B -gt 220 -and $diffRG -lt 15 -and $diffGB -lt 25)
        # Also black grid dots outside droplet
        $isDot = ($c.R -lt 40 -and $c.G -lt 40 -and $c.B -lt 40 -and ($x -lt 40 -or $x -gt 370 -or $y -gt 160))
        
        if ($isPaper -or $isDot) {
            $bmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
        } else {
            # Check edge antialiasing: if it's near the transition
            if ($c.R -gt 210 -and $c.G -gt 215) {
                # Calculate transparency based on blue intensity
                $blueDominance = [Math]::Max(0, ($c.B - $c.R))
                if ($blueDominance -lt 10) {
                    $bmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
                } elseif ($blueDominance -lt 40) {
                    $alpha = [int](($blueDominance / 40.0) * 255)
                    $bmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($alpha, $c.R, $c.G, $c.B))
                }
            }
        }
    }
}

$bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
$src.Dispose()
Write-Host "Recropped droplet cleanly!"

