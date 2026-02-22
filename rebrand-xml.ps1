$path = 'E:\STARTUPS\Musika\app\src\main\res'
$files = Get-ChildItem -Path $path -Recurse -Filter '*.xml'

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $newContent = $content -replace 'Echo Music', 'Musika'
    $newContent = $newContent -replace 'EchoMusic', 'Musika'
    $newContent = $newContent -replace 'Theme\.Echo', 'Theme.Musika'
    $newContent = $newContent -replace '>Echo<', '>Musika<'
    if ($content -ne $newContent) {
        Set-Content -Path $file.FullName -Value $newContent -NoNewline
        Write-Output "Updated: $($file.FullName)"
    }
}
Write-Output "Done!"
