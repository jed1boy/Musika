$files = Get-ChildItem 'E:\STARTUPS\Musika\app\src\main\res\values*' -Recurse -Filter '*.xml'
foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    if ($content -match 'Echo') {
        $newContent = $content -replace 'Echo uses', 'Musika uses' -replace 'Echo使用', 'Musika使用' -replace 'Echo 使用', 'Musika 使用' -replace 'Echo utiliz', 'Musika utiliz' -replace 'Echo utiliza', 'Musika utiliza' -replace 'Echo gebruikt', 'Musika gebruikt' -replace 'Echo korist', 'Musika korist' -replace 'Echo pou', 'Musika pou' -replace 'Echo anv', 'Musika anv' -replace 'Echo bruker', 'Musika bruker' -replace 'Echo menggunak', 'Musika menggunak' -replace 'Echo bruker', 'Musika bruker' -replace 'Echo verwend', 'Musika verwend' -replace 'O Echo', 'O Musika' -replace 'Echo nur', 'Musika nur' -replace 'Echo csak', 'Musika csak' -replace 'Echo-', 'Musika-'
        Set-Content $file.FullName -Value $newContent -NoNewline -Encoding UTF8
        Write-Output "Updated: $($file.Name)"
    }
}
Write-Output "Done!"
