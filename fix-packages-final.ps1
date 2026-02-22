$files = Get-ChildItem 'E:\STARTUPS\Musika\innertube\src\main\kotlin' -Recurse -Filter '*.kt'
$count = 0
foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    if ($content -match 'com\.Musika\.') {
        $newContent = $content -replace 'com\.Musika\.', 'com.musika.'
        Set-Content $file.FullName -Value $newContent -NoNewline -Encoding UTF8
        $count++
    }
}
Write-Output "Fixed $count files in innertube"

$files = Get-ChildItem 'E:\STARTUPS\Musika\kugou\src\main\kotlin' -Recurse -Filter '*.kt'
foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    if ($content -match 'com\.Musika\.') {
        $newContent = $content -replace 'com\.Musika\.', 'com.musika.'
        Set-Content $file.FullName -Value $newContent -NoNewline -Encoding UTF8
        $count++
    }
}
Write-Output "Fixed files in kugou"

$files = Get-ChildItem 'E:\STARTUPS\Musika\lrclib\src\main\kotlin' -Recurse -Filter '*.kt'
foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    if ($content -match 'com\.Musika\.') {
        $newContent = $content -replace 'com\.Musika\.', 'com.musika.'
        Set-Content $file.FullName -Value $newContent -NoNewline -Encoding UTF8
        $count++
    }
}
Write-Output "Fixed files in lrclib"

Write-Output "Total fixed: $count"
