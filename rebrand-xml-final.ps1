Get-ChildItem 'E:\STARTUPS\Musika\app\src\main\res\values*' -Recurse -Filter '*.xml' | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $newContent = $content -replace 'Echo uses', 'Musika uses' `
        -replace 'Echo使用', 'Musika使用' `
        -replace 'Echo 使用', 'Musika 使用' `
        -replace 'Echo utiliz', 'Musika utiliz' `
        -replace 'Echo utiliza', 'Musika utiliza' `
        -replace 'Echo gebruikt', 'Musika gebruikt' `
        -replace 'Echo korist', 'Musika korist' `
        -replace 'Echo používa', 'Musika používa' `
        -replace 'Echo používá', 'Musika používá' `
        -replace 'Echo używa', 'Musika używa' `
        -replace 'Echo använder', 'Musika använder' `
        -replace 'Echo bruker', 'Musika bruker' `
        -replace 'Echo menggunak', 'Musika menggunak' `
        -replace 'Az Echo', 'A Musika' `
        -replace 'Echo verwendet', 'Musika verwendet' `
        -replace 'Echo utilizar', 'Musika utilizar' `
        -replace 'Echo käyttä', 'Musika käyttä' `
        -replace 'O Echo', 'O Musika' `
        -replace 'Echo chỉ', 'Musika chỉ' `
        -replace 'Echo yalnızca', 'Musika yalnızca' `
        -replace 'Echo 只', 'Musika 只' `
        -replace 'Echo는', 'Musika는' `
        -replace 'Echo은', 'Musika는' `
        -replace 'Echo nur', 'Musika nur' `
        -replace 'Echo только', 'Musika только' `
        -replace 'Echo tylko', 'Musika tylko' `
        -replace 'Echo csak', 'Musika csak' `
        -replace 'Echo će', 'Musika će' `
        -replace 'Echo folk', 'Musika fol' `
        -replace 'Echo folo', 'Musika folo' `
        -replace 'O Echo-', 'O Musika-' `
        -replace 'about">O Echo', 'about>O Musika' `
        -replace 'Echo-', 'Musika-'
    if ($content -ne $newContent) {
        Set-Content $_.FullName -Value $newContent -NoNewline
        Write-Output "Updated: $($_.Name)"
    }
}
Write-Output "Done!"
