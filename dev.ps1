param(
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]]$ViteArgs
)

Push-Location $PSScriptRoot
try {
  node ".\scripts\run-dev.mjs" @ViteArgs
} finally {
  Pop-Location
}
