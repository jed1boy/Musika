$files = Get-ChildItem 'E:\STARTUPS\Musika\lrclib' -Recurse -Filter '*.kt'
foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    $newContent = $content -replace 'com\.Musika\.lrclib', 'com.musika.lrclib' -replace 'com\.echo\.lrclib', 'com.musika.lrclib'
    if ($content -ne $newContent) {
        Set-Content $file.FullName -Value $newContent -NoNewline -Encoding UTF8
        Write-Output "Updated: $($file.Name)"
    }
}
Write-Output "Done!"
