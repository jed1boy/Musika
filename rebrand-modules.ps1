$paths = @('E:\STARTUPS\Musika\lrclib', 'E:\STARTUPS\Musika\kugou', 'E:\STARTUPS\Musika\innertube')

foreach ($basePath in $paths) {
    if (Test-Path $basePath) {
        $files = Get-ChildItem -Path $basePath -Recurse -Filter '*.kt'
        foreach ($file in $files) {
            $content = Get-Content $file.FullName -Raw
            $newContent = $content -replace 'Echo Music', 'Musika'
            $newContent = $newContent -replace 'EchoMusic', 'Musika'
            $newContent = $newContent -replace 'Echo', 'Musika'
            if ($content -ne $newContent) {
                Set-Content -Path $file.FullName -Value $newContent -NoNewline
                Write-Output "Updated: $($file.Name)"
            }
        }
    }
}
Write-Output "Done!"
