$files = Get-ChildItem 'E:\STARTUPS\Musika\innertube' -Recurse -Filter '*.kt'
foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    $newContent = $content -replace 'com\.Musika\.innertube', 'com.musika.innertube' -replace 'com\.echo\.innertube', 'com.musika.innertube'
    if ($content -ne $newContent) {
        Set-Content $file.FullName -Value $newContent -NoNewline -Encoding UTF8
        Write-Output "Updated: $($file.Name)"
    }
}
Write-Output "Done!"
