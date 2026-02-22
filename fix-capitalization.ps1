$modules = @(
    'E:\STARTUPS\Musika\innertube\src\main\kotlin',
    'E:\STARTUPS\Musika\kugou\src\main\kotlin',
    'E:\STARTUPS\Musika\lrclib\src\main\kotlin',
    'E:\STARTUPS\Musika\app\src\main\kotlin'
)

foreach ($module in $modules) {
    $files = Get-ChildItem $module -Recurse -Filter '*.kt'
    foreach ($file in $files) {
        $content = Get-Content $file.FullName -Raw -Encoding UTF8
        $newContent = $content -replace 'com\.Musika\.', 'com.musika.'
        if ($content -ne $newContent) {
            Set-Content $file.FullName -Value $newContent -NoNewline -Encoding UTF8
            Write-Output "Updated: $($file.Name)"
        }
    }
}
Write-Output "Done!"
