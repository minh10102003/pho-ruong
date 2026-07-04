# Chạy PowerShell "Run as Administrator" — mở port 8081 cho Expo Go trên LAN
# Usage: .\scripts\allow-expo-firewall.ps1

$ruleName = 'Expo Metro 8081'

$existing = Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue
if ($existing) {
  Write-Host "Rule '$ruleName' already exists."
  exit 0
}

New-NetFirewallRule `
  -DisplayName $ruleName `
  -Direction Inbound `
  -Action Allow `
  -Protocol TCP `
  -LocalPort 8081 `
  -Profile Private,Domain

Write-Host "Done. iPhone/Expo Go can now reach port 8081 on this PC (Private network)."
