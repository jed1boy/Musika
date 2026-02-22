$files = Get-ChildItem 'E:\STARTUPS\Musika\app\src\main\kotlin\com\musika\app' -Recurse -Filter '*.kt'
foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    $newContent = $content -replace 'iad1tya\.echo\.innertube', 'com.musika.innertube' -replace 'com\.echo\.innertube', 'com.musika.innertube' -replace 'com\.Musika\.innertube', 'com.musika.innertube'
    $newContent = $newContent -replace 'iad1tya\.echo\.kugou', 'com.musika.kugou' -replace 'com\.echo\.kugou', 'com.musika.kugou'
    $newContent = $newContent -replace 'iad1tya\.echo\.lrclib', 'com.musika.lrclib' -replace 'com\.echo\.lrclib', 'com.musika.lrclib'
    if ($content -ne $newContent) {
        Set-Content $file.FullName -Value $newContent -NoNewline -Encoding UTF8
        Write-Output "Updated: $($file.Name)"
    }
}
Write-Output "Done!"
