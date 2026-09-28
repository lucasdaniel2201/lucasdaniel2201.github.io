---
titulo: 'Importador de câmeras para o Zabbix'
resumo: >-
  App desktop que cria hosts de câmera de CFTV em lote no Zabbix a partir de uma
  planilha, pelo formulário web, para funcionar onde a API por token está bloqueada.
papel: 'Concepção e implementação, do zero'
periodo: '2026'
ordem: 1
stack:
  - Python
  - PySide6
  - Requests
  - BeautifulSoup
  - PyInstaller
  - Inno Setup
  - GitHub Actions
repo: 'https://github.com/lucasdaniel2201/zabbix-camera-importer'
release: 'https://github.com/lucasdaniel2201/zabbix-camera-importer/releases/latest'
imagem: '/img/zabbix-planilha.png'
imagemAlt: >-
  Tela do importador com a planilha carregada: preview das câmeras validadas,
  grupos e templates selecionados e o botão de importar liberado.
imagem2: '/img/zabbix-importacao.png'
imagem2Alt: 'Tela durante a importação, com barra de progresso e botão de cancelar.'
metricas:
  - valor: '102'
    rotulo: 'testes offline'
  - valor: '0'
    rotulo: 'credenciais em disco'
  - valor: '2'
    rotulo: 'fluxos, um único core'
ficha:
  - rotulo: 'Plataforma'
    valor: 'Windows 10/11 x64'
  - rotulo: 'Integração'
    valor: 'Formulário web do Zabbix (host.create)'
  - rotulo: 'Distribuição'
    valor: 'Instalador Inno Setup + portátil'
  - rotulo: 'Licença'
    valor: 'MIT'
---

## O problema

Documentar e monitorar um parque de câmeras de CFTV significa cadastrar centenas
de hosts no Zabbix, um por um, com grupo, template, proxy, inventário e IP. É
trabalho manual, repetitivo e fácil de errar no meio: nome com acento que o
Zabbix recusa, IP digitado errado, duas câmeras com o mesmo nome.

Quem faz a implantação em campo não é desenvolvedor. Pedir que essa pessoa use a
interface do Zabbix para cada câmera é pedir que ela erre.

## O que o app faz

A pessoa baixa um modelo de planilha, escolhe quais colunas opcionais quer
(fabricante, modelo, firmware, MAC, unidade, etiqueta, descrição), preenche uma
linha por câmera e carrega o arquivo no app. Antes de enviar qualquer coisa, o
app mostra o que vai ser criado, com o nome já normalizado, e bloqueia a
importação enquanto houver linha com erro.

A criação usa o **formulário web** do Zabbix, e não a API por token. Essa foi a
decisão que definiu o projeto: em vários ambientes a API HTTP está bloqueada ou
não existe token disponível, e o formulário funciona. A listagem de grupos,
templates e proxies usa o JSON-RPC da mesma sessão, com o cookie do login.

## Decisões que valem conhecer

**Um core, dois fluxos.** A regra de negócio mora em um único módulo, e tanto a
interface gráfica quanto o script de linha de comando usam exatamente o mesmo
caminho. Não existe a possibilidade de a tela criar um host de um jeito e o
script criar de outro.

**Normalizar antes de comparar.** O Zabbix rejeita acentos e alguns caracteres
no nome do host. O app converte para ASCII e, se dois nomes colidirem depois da
conversão, trata como erro em vez de deixar o segundo sobrescrever o primeiro.

**A interface pede, o worker executa.** Nenhuma tela fala com a rede. Login,
busca das listas e importação rodam em uma thread própria e devolvem o resultado
por sinais do Qt, então a janela continua respondendo durante um lote longo.

**Nenhuma credencial em disco.** Não há arquivo `.env` nem senha embutida. A
tela pede usuário e senha, e a senha sai do campo assim que a conexão dá certo.
Na linha de comando, a senha é digitada sem eco.

## Como sei que funciona

São 102 testes automatizados, com apenas a biblioteca padrão do Python, e rodam
sem rede e sem Zabbix. Eles protegem justamente os erros que já aconteceram:
nome duplicado, IP inválido, proxy omitido, coluna obrigatória ausente. O CI roda
a suíte no Windows (3.12 e 3.14) e o Ruff em separado.

Cada execução grava três relatórios (log, JSON e CSV), e um script separado
consolida o resumo de várias execuções para revisar um lote grande depois.
