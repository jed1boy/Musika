$path = "E:\STARTUPS\Musika\app\src\main\kotlin\com\musika\app"
$files = Get-ChildItem -Path $path -Recurse -Filter "*.kt"
$count = 0
foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    if ($content -match "iad1tya\.echo\.music") {
        $newContent = $content -replace "iad1tya\.echo\.music", "com.musika.app"
        Set-Content -Path $file.FullName -Value $newContent -NoNewline -Encoding UTF8
        $count++
    }
}
Write-Host "Updated $count files"
