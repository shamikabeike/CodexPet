param(
  [string]$OutputDirectory = (Join-Path $PSScriptRoot "..\assets")
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

function New-MiaoMasterBitmap {
  $bitmap = [System.Drawing.Bitmap]::new(1024, 1024, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  $graphics.Clear([System.Drawing.Color]::Transparent)
  $graphics.ScaleTransform(4, 4)

  $outline = [System.Drawing.Drawing2D.GraphicsPath]::new()
  $outline.StartFigure()
  $outline.AddBezier(40, 94, 36, 72, 27, 36, 35, 15)
  $outline.AddBezier(35, 15, 38, 8, 44, 9, 50, 13)
  $outline.AddLine(50, 13, 98, 52)
  $outline.AddBezier(98, 52, 118, 46, 138, 46, 158, 52)
  $outline.AddLine(158, 52, 206, 13)
  $outline.AddBezier(206, 13, 212, 9, 218, 8, 221, 15)
  $outline.AddBezier(221, 15, 229, 36, 220, 72, 216, 94)
  $outline.AddBezier(216, 94, 234, 115, 242, 140, 238, 166)
  $outline.AddBezier(238, 166, 232, 216, 193, 240, 128, 240)
  $outline.AddBezier(128, 240, 63, 240, 24, 216, 18, 166)
  $outline.AddBezier(18, 166, 14, 140, 22, 115, 40, 94)
  $outline.CloseFigure()

  $surfaceBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 3, 26, 24))
  $outlinePen = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(255, 97, 232, 173), 9)
  $outlinePen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
  $graphics.FillPath($surfaceBrush, $outline)
  $graphics.DrawPath($outlinePen, $outline)

  $innerEarBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 13, 58, 54))
  $leftEar = [System.Drawing.Drawing2D.GraphicsPath]::new()
  $leftEar.AddPolygon([System.Drawing.PointF[]]@(
    [System.Drawing.PointF]::new(42, 25),
    [System.Drawing.PointF]::new(50, 76),
    [System.Drawing.PointF]::new(88, 51)
  ))
  $rightEar = [System.Drawing.Drawing2D.GraphicsPath]::new()
  $rightEar.AddPolygon([System.Drawing.PointF[]]@(
    [System.Drawing.PointF]::new(214, 25),
    [System.Drawing.PointF]::new(206, 76),
    [System.Drawing.PointF]::new(168, 51)
  ))
  $graphics.FillPath($innerEarBrush, $leftEar)
  $graphics.FillPath($innerEarBrush, $rightEar)

  $eyeBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 139, 244, 199))
  $pupilBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 3, 26, 24))
  $highlightBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(230, 238, 255, 248))
  $graphics.FillEllipse($eyeBrush, 68, 104, 48, 55)
  $graphics.FillEllipse($eyeBrush, 140, 104, 48, 55)
  $graphics.FillEllipse($pupilBrush, 91, 115, 15, 34)
  $graphics.FillEllipse($pupilBrush, 150, 115, 15, 34)
  $graphics.FillEllipse($highlightBrush, 94, 118, 6, 8)
  $graphics.FillEllipse($highlightBrush, 153, 118, 6, 8)

  $facePen = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(255, 139, 244, 199), 7)
  $facePen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $facePen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $noseBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 139, 244, 199))
  $nose = [System.Drawing.Drawing2D.GraphicsPath]::new()
  $nose.AddPolygon([System.Drawing.PointF[]]@(
    [System.Drawing.PointF]::new(128, 160),
    [System.Drawing.PointF]::new(121, 154),
    [System.Drawing.PointF]::new(135, 154)
  ))
  $graphics.FillPath($noseBrush, $nose)
  $graphics.DrawBezier($facePen, 128, 160, 128, 174, 113, 180, 106, 168)
  $graphics.DrawBezier($facePen, 128, 160, 128, 174, 143, 180, 150, 168)
  $graphics.DrawLine($facePen, 55, 139, 35, 135)
  $graphics.DrawLine($facePen, 55, 151, 34, 154)
  $graphics.DrawLine($facePen, 201, 139, 221, 135)
  $graphics.DrawLine($facePen, 201, 151, 222, 154)

  @(
    $graphics,
    $surfaceBrush,
    $outlinePen,
    $innerEarBrush,
    $leftEar,
    $rightEar,
    $eyeBrush,
    $pupilBrush,
    $highlightBrush,
    $facePen,
    $noseBrush,
    $nose,
    $outline
  ) | ForEach-Object { $_.Dispose() }

  return $bitmap
}

function Convert-ToPngBytes {
  param(
    [System.Drawing.Bitmap]$Source,
    [int]$Size
  )

  $bitmap = [System.Drawing.Bitmap]::new($Size, $Size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
  $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $padding = [Math]::Max(1, [int][Math]::Round($Size / 128))
  $contentSize = $Size - (2 * $padding)
  $destination = [System.Drawing.Rectangle]::new($padding, $padding, $contentSize, $contentSize)
  $imageAttributes = [System.Drawing.Imaging.ImageAttributes]::new()
  $imageAttributes.SetWrapMode([System.Drawing.Drawing2D.WrapMode]::TileFlipXY)
  $graphics.DrawImage(
    $Source,
    $destination,
    0,
    0,
    $Source.Width,
    $Source.Height,
    [System.Drawing.GraphicsUnit]::Pixel,
    $imageAttributes
  )

  $stream = [System.IO.MemoryStream]::new()
  $bitmap.Save($stream, [System.Drawing.Imaging.ImageFormat]::Png)
  $bytes = $stream.ToArray()
  $stream.Dispose()
  $imageAttributes.Dispose()
  $graphics.Dispose()
  $bitmap.Dispose()
  return $bytes
}

function Write-MultiSizeIcon {
  param(
    [hashtable]$Images,
    [string]$Path
  )

  $sizes = @($Images.Keys | ForEach-Object { [int]$_ } | Sort-Object)
  $stream = [System.IO.File]::Open($Path, [System.IO.FileMode]::Create)
  $writer = [System.IO.BinaryWriter]::new($stream)
  $writer.Write([uint16]0)
  $writer.Write([uint16]1)
  $writer.Write([uint16]$sizes.Count)

  $offset = 6 + (16 * $sizes.Count)
  foreach ($size in $sizes) {
    $bytes = [byte[]]$Images[$size]
    $writer.Write([byte]$(if ($size -ge 256) { 0 } else { $size }))
    $writer.Write([byte]$(if ($size -ge 256) { 0 } else { $size }))
    $writer.Write([byte]0)
    $writer.Write([byte]0)
    $writer.Write([uint16]1)
    $writer.Write([uint16]32)
    $writer.Write([uint32]$bytes.Length)
    $writer.Write([uint32]$offset)
    $offset += $bytes.Length
  }

  foreach ($size in $sizes) {
    $writer.Write([byte[]]$Images[$size])
  }

  $writer.Dispose()
  $stream.Dispose()
}

$resolvedOutput = [System.IO.Path]::GetFullPath($OutputDirectory)
[System.IO.Directory]::CreateDirectory($resolvedOutput) | Out-Null

$master = New-MiaoMasterBitmap
$images = @{}
foreach ($size in @(16, 20, 24, 32, 48, 64, 128, 256)) {
  $images[$size] = Convert-ToPngBytes -Source $master -Size $size
}

[System.IO.File]::WriteAllBytes((Join-Path $resolvedOutput "miao-tray.png"), [byte[]]$images[32])
[System.IO.File]::WriteAllBytes((Join-Path $resolvedOutput "miao-app.png"), [byte[]]$images[256])
[System.IO.File]::WriteAllBytes(
  (Join-Path $resolvedOutput "miao-mac.png"),
  [byte[]](Convert-ToPngBytes -Source $master -Size 1024)
)
Write-MultiSizeIcon -Images $images -Path (Join-Path $resolvedOutput "miao.ico")
$master.Dispose()

Write-Output "Generated Miao transparent cat-head icons: $resolvedOutput"
