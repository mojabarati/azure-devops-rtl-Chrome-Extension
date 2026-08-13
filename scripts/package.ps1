[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'

$projectRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$manifestPath = Join-Path $projectRoot 'manifest.json'

if (-not (Test-Path -LiteralPath $manifestPath -PathType Leaf)) {
    throw 'manifest.json was not found at the project root.'
}

$manifest = Get-Content -Raw -LiteralPath $manifestPath | ConvertFrom-Json
if ($manifest.manifest_version -ne 3) {
    throw 'Only Manifest V3 release packages are supported.'
}
if ($manifest.version -notmatch '^\d+(?:\.\d+){0,3}$') {
    throw "Invalid Chrome extension version: $($manifest.version)"
}

$runtimePaths = @('manifest.json', 'icons', 'src')
foreach ($relativePath in $runtimePaths) {
    if (-not (Test-Path -LiteralPath (Join-Path $projectRoot $relativePath))) {
        throw "Required runtime path is missing: $relativePath"
    }
}

$distDirectory = Join-Path $projectRoot 'dist'
New-Item -ItemType Directory -Path $distDirectory -Force | Out-Null
$distDirectory = (Resolve-Path -LiteralPath $distDirectory).Path
$archiveName = "azure-devops-rtl-fixer-v$($manifest.version).zip"
$archivePath = Join-Path $distDirectory $archiveName

$tempBase = [System.IO.Path]::GetFullPath([System.IO.Path]::GetTempPath())
$stageRoot = Join-Path $tempBase ("ado-rtl-release-" + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $stageRoot | Out-Null
$stageRoot = (Resolve-Path -LiteralPath $stageRoot).Path

if (-not $stageRoot.StartsWith($tempBase, [System.StringComparison]::OrdinalIgnoreCase) -or
    (Split-Path -Leaf $stageRoot) -notmatch '^ado-rtl-release-[0-9a-f]{32}$') {
    throw "Refusing to use unexpected staging path: $stageRoot"
}

try {
    Copy-Item -LiteralPath $manifestPath -Destination $stageRoot
    Copy-Item -LiteralPath (Join-Path $projectRoot 'icons') -Destination $stageRoot -Recurse
    Copy-Item -LiteralPath (Join-Path $projectRoot 'src') -Destination $stageRoot -Recurse

    if (Test-Path -LiteralPath $archivePath -PathType Leaf) {
        Remove-Item -LiteralPath $archivePath
    }

    Compress-Archive -Path (Join-Path $stageRoot '*') -DestinationPath $archivePath -CompressionLevel Optimal

    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $archive = [System.IO.Compression.ZipFile]::OpenRead($archivePath)
    try {
        $entryNames = @($archive.Entries | ForEach-Object { $_.FullName.Replace('\', '/') })
        if ($entryNames -notcontains 'manifest.json') {
            throw 'Release ZIP is invalid: manifest.json is not at the ZIP root.'
        }

        $forbidden = @($entryNames | Where-Object {
            $_ -match '(^|/)(\.git|\.github|node_modules|tests|store|dist|coverage)(/|$)' -or
            $_ -match '(^|/)(README|PRIVACY|SECURITY|CHANGELOG|LICENSE)(\.|$)'
        })
        if ($forbidden.Count -gt 0) {
            throw "Release ZIP contains development-only files: $($forbidden -join ', ')"
        }

        foreach ($relativePath in @(
            'icons/icon16.png',
            'icons/icon32.png',
            'icons/icon48.png',
            'icons/icon128.png',
            'src/popup/popup.html',
            'src/content/content.js',
            'src/background/service-worker.js'
        )) {
            if ($entryNames -notcontains $relativePath) {
                throw "Release ZIP is missing required runtime file: $relativePath"
            }
        }
    }
    finally {
        $archive.Dispose()
    }

    Write-Output "Created $archivePath"
}
finally {
    if ($stageRoot.StartsWith($tempBase, [System.StringComparison]::OrdinalIgnoreCase) -and
        (Split-Path -Leaf $stageRoot) -match '^ado-rtl-release-[0-9a-f]{32}$' -and
        (Test-Path -LiteralPath $stageRoot)) {
        Remove-Item -LiteralPath $stageRoot -Recurse -Force
    }
}
