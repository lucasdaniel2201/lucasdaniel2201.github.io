---
titulo: 'Importador de dispositivos para o NetBox'
resumo: >-
  App desktop que documenta câmeras e switches no NetBox pela API REST, com
  prévia do que será criado, escrita idempotente e verificação de atualizações.
papel: 'Concepção e implementação, do zero'
periodo: '2026'
ordem: 2
stack:
  - Python
  - PySide6
  - API REST
  - openpyxl
  - DPAPI
  - PyInstaller
  - Inno Setup
  - GitHub Actions
repo: 'https://github.com/lucasdaniel2201/netbox-device-importer'
release: 'https://github.com/lucasdaniel2201/netbox-device-importer/releases/latest'
imagem: '/img/netbox-ambiente.png'
imagemAlt: >-
  Tela do app após conectar, resumindo o ambiente descoberto: sites, papéis e
  tipos de device encontrados no NetBox.
galeria:
  - src: '/img/netbox-atualizacao.png'
    alt: 'Aviso de nova versão, com o botão de baixar e instalar.'
metricas:
  - valor: '345'
    rotulo: 'testes offline'
  - valor: '3'
    rotulo: 'arquivos de relatório por execução'
  - valor: '1'
    rotulo: 'teste que trava o erro de lançamento'
ficha:
  - rotulo: 'Plataforma'
    valor: 'Windows 10/11 x64'
  - rotulo: 'Integração'
    valor: 'NetBox 4.3.6, API REST com token'
  - rotulo: 'Distribuição'
    valor: 'Instalador Inno Setup + portátil'
  - rotulo: 'Licença'
    valor: 'MIT'
---

## O problema

O NetBox só é útil se o inventário estiver certo. Digitar centenas de câmeras e
switches na interface, com site, papel, tipo de device, interface, endereço IP e
campos personalizados obrigatórios, é um convite a inventário incompleto.

Pior: se a planilha tiver duplicidade ou campo obrigatório sem valor, quem
descobre o erro é o NetBox, no meio da carga, com metade dos devices gravados.

## O que o app faz

Ao conectar, o app descobre o ambiente: sites, papéis, tipos de device,
fabricantes, contagens, campos personalizados e o que o token pode fazer em cada
endpoint. A pessoa baixa um modelo de planilha com as listas suspensas de Site e
Papel já preenchidas a partir do próprio NetBox, preenche e carrega.

O app monta um **plano de importação**: cada linha aparece como pronta, com erro
ou pendente de criar alguma referência que ainda não existe. Referência só é
criada com confirmação explícita, e o botão de importar fica bloqueado enquanto
houver qualquer pendência. O erro aparece na tela antes de virar lixo no
inventário.

## Decisões que valem conhecer

**Idempotência de verdade.** Para cada objeto o app faz um `GET` antes e decide:
não existe, cria com `POST`; existe e está igual, não faz nada; existe e
diferente, atualiza com `PATCH`. Rodar a mesma planilha de novo não duplica
nada, o que importa quando a carga falha na metade.

**Multi-passo com degradação.** No NetBox o IP só se vincula ao device por uma
interface, então a ordem é interface, depois IP, depois `primary_ip4`. Cada passo
é independente de propósito: falhar em um vira aviso, e o device permanece
gravado. Perder o IP é melhor do que perder o device.

**O token nunca fica legível.** Ele é cifrado com a DPAPI do Windows, amarrado à
conta e à máquina. Copiar o arquivo para outro computador não funciona, e
nenhuma senha vai para o disco.

**Atualização sem se substituir.** O app consulta a última Release publicada
numa thread própria e, se houver versão mais nova, oferece o botão de baixar. A
comparação quebra a versão em números em vez de comparar texto, porque comparar
texto diria que 1.10.0 é menor que 1.9.0. O download valida que a URL é HTTPS de
um host do GitHub antes de baixar, e quem instala é o Inno Setup, com a pessoa na
frente: o app não troca o próprio executável em uso.

**Falha silenciosa onde o silêncio é o certo.** Sem internet é o caso normal do
analista em campo, então a checagem automática de atualização não mostra erro
nenhum. Já a falha de um download que a pessoa pediu aparece na tela.

## Como sei que funciona

São 345 testes, sem rede, cobrindo a leitura e validação da planilha, o plano de
importação, o cliente HTTP, o provisionamento, a sessão, a checagem de
atualizações, o download e as credenciais.

A versão do aplicativo vive em três arquivos mantidos à mão, porque cada um é
lido por quem é diferente: o Python, o Inno Setup e o Windows. Existe um teste
que falha se algum deles divergir, e ele é a trava contra o erro de lançamento
mais provável.
