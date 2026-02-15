param(
    [string]$Message = "",
    [string]$Branch = "main",
    [switch]$Tunnel,
    [string]$LocalUrl = "http://localhost:5500"
)

Set-Location $PSScriptRoot

git rev-parse --is-inside-work-tree *> $null
if ($LASTEXITCODE -ne 0) {
    Write-Error "Este script precisa ser executado dentro de um repositório Git."
    exit 1
}

git add .
git diff --cached --quiet
$hasChanges = ($LASTEXITCODE -ne 0)

if ($hasChanges) {
    if ([string]::IsNullOrWhiteSpace($Message)) {
        $Message = "update: $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
    }

    git commit -m $Message
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Falha no commit."
        exit 1
    }

    git push origin $Branch
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Falha no push para origin/$Branch."
        exit 1
    }

    Write-Host "Atualização enviada para origin/$Branch com sucesso."
}
else {
    Write-Host "Sem mudanças para commit."
}

if ($Tunnel) {
    cloudflared tunnel --url $LocalUrl
}
