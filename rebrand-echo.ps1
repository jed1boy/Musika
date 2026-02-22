$path = 'E:\STARTUPS\Musika\app\src\main\kotlin\com\musika\app'
$files = Get-ChildItem -Path $path -Recurse -Filter '*.kt'

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $newContent = $content -replace 'Echo Music', 'Musika'
    $newContent = $newContent -replace 'EchoMusic', 'Musika'
    $newContent = $newContent -replace 'EchoFind', 'MusikaFind'
    $newContent = $newContent -replace 'Echo Find', 'Musika Find'
    $newContent = $newContent -replace 'EchoTheme', 'MusikaTheme'
    $newContent = $newContent -replace 'echo_logo', 'musika_logo'
    $newContent = $newContent -replace 'echo_icon', 'musika_icon'
    $newContent = $newContent -replace 'Echo-Wrapped', 'Musika-Wrapped'
    $newContent = $newContent -replace '"Echo"', '"Musika"'
    $newContent = $newContent -replace "'Echo'", "'Musika'"
    if ($content -ne $newContent) {
        Set-Content -Path $file.FullName -Value $newContent -NoNewline
        Write-Output "Updated: $($file.Name)"
    }
}
Write-Output "Done!"
