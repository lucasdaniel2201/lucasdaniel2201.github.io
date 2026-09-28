# Regenera o cartao de compartilhamento (public/og.png) a partir de tools/og-image.html.
#
# Usa o Edge em modo headless, com tamanho de janela fixo, para o cartao sair
# exatamente em 1200x630. O --virtual-time-budget da tempo de as fontes do
# Google carregarem antes da captura.
#
# Rodar da raiz do projeto:  powershell -ExecutionPolicy Bypass -File tools\gerar-og.ps1

$ErrorActionPreference = 'Stop'

$raiz = Split-Path -Parent $PSScriptRoot
$html = Join-Path $PSScriptRoot 'og-image.html'
$saida = Join-Path $raiz 'public\og.png'

$navegadores = @(
  'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',
  'C:\Program Files\Microsoft\Edge\Application\msedge.exe',
  'C:\Program Files\Google\Chrome\Application\chrome.exe',
  'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe'
)
$nav = $navegadores | Where-Object { Test-Path $_ } | Select-Object -First 1

if (-not $nav) {
  throw 'Nenhum Edge ou Chrome encontrado nos caminhos esperados.'
}

# O caminho tem acento, entao a URI vai codificada.
$uri = [System.Uri]::new($html).AbsoluteUri

# Perfil proprio e descartavel: sem isso, o navegador tenta usar o perfil do
# usuario e a captura falha se houver uma janela aberta.
$perfil = Join-Path $env:TEMP ('og-perfil-' + [guid]::NewGuid().ToString('N'))

# Apaga o cartao anterior: a espera abaixo observa o arquivo aparecer, e um
# arquivo velho no lugar faria a checagem passar sem nada ter sido gerado.
if (Test-Path $saida) {
  Remove-Item $saida -Force
}

& $nav `
  --headless=new `
  --disable-gpu `
  --hide-scrollbars `
  --no-first-run `
  --force-device-scale-factor=1 `
  --window-size=1200,630 `
  --virtual-time-budget=8000 `
  "--user-data-dir=$perfil" `
  "--screenshot=$saida" `
  $uri

# O navegador pode retornar antes de terminar de gravar o arquivo.
$limite = (Get-Date).AddSeconds(30)
while (-not (Test-Path $saida) -and (Get-Date) -lt $limite) {
  Start-Sleep -Milliseconds 400
}

if (Test-Path $perfil) {
  Remove-Item $perfil -Recurse -Force -ErrorAction SilentlyContinue
}

if (-not (Test-Path $saida)) {
  throw "A captura nao gerou o arquivo: $saida"
}

Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile($saida)
Write-Output ("Gerado: {0} ({1}x{2})" -f $saida, $img.Width, $img.Height)
$img.Dispose()
