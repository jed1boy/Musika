$files = Get-ChildItem 'E:\STARTUPS\Musika\kugou' -Recurse -Filter '*.kt'
foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    $newContent = $content -replace 'com\.Musika\.kugou', 'com.musika.kugou' -replace 'com\.echo\.kugou', 'com.musika.kugou'
    if ($content -ne $newContent) {
        Set-Content $file.FullName -Value $newContent -NoNewline -Encoding UTF8
        Write-Output "Updated: $($file.Name)"
    }
}
Write-Output "Done!"
