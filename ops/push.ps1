Set-Location (Split-Path $PSScriptRoot -Parent)

Write-Host ""
Write-Host "===== GIT STATUS =====" -ForegroundColor Cyan
git status

Write-Host ""
$confirm = Read-Host "Proceed with commit and push? (yes/no)"

if ($confirm -ne "yes") {
    Write-Host "Push aborted." -ForegroundColor Yellow
    exit
}

$commitMessage = Read-Host "Enter commit message"

git add .
git commit -m "$commitMessage"
git push

Write-Host "Push complete." -ForegroundColor Green
