---
titulo: 'Flowgate: pipeline ETL de usuários'
resumo: >-
  Pipeline conteinerizado em n8n que sincroniza usuários de uma API externa para
  um webhook de destino, com retry, batching e tolerância a falhas parciais.
papel: 'Concepção e implementação, do zero'
periodo: '2026'
ordem: 4
stack:
  - n8n
  - Docker Compose
  - Node.js
  - Prometheus
  - GitHub Actions
repo: 'https://github.com/lucasdaniel2201/flowgate-automation'
release: 'https://github.com/lucasdaniel2201/flowgate-automation/releases/latest'
imagem: '/img/flowgate-workflow.png'
imagemAlt: 'Editor do n8n com os seis nós do pipeline encadeados e o workflow ativo.'
galeria:
  - src: '/img/flowgate-execucoes.png'
    alt: 'Aba de execuções do n8n, com o histórico e o grafo da execução selecionada.'
metricas:
  - valor: '6'
    rotulo: 'nós, sem branches'
  - valor: '23'
    rotulo: 'testes estáticos'
  - valor: '2'
    rotulo: 'jobs no CI'
ficha:
  - rotulo: 'Orquestração'
    valor: 'n8n 1.123.82 (imagem fixa)'
  - rotulo: 'Execução'
    valor: 'Docker Compose, uma instância'
  - rotulo: 'Observabilidade'
    valor: 'Métricas Prometheus + logs JSON'
  - rotulo: 'Licença'
    valor: 'MIT'
---

## O problema

Sincronizar usuários de uma API externa para o sistema de destino parece simples
até o destino cair no meio. Sem retry, um erro transitório perde registros. Sem
batching, o destino bloqueia por rate limit. E quando um item falha de vez, o
pipeline inteiro para e ninguém sabe o que ficou de fora.

## O que o pipeline faz

Seis nós, encadeados sem branches: um webhook de entrada, a leitura dos usuários,
o filtro por domínio de e-mail, a transformação para o formato do destino, a
carga item a item e a devolução de um sumário para quem chamou.

O projeto roda de ponta a ponta sem nenhuma credencial: por padrão ele aponta
para APIs públicas de teste, então um `docker compose up` já tem o que executar.
O mesmo vale para quem só quer ler o fluxo, sem montar ambiente.

## Decisões que valem conhecer

**Resiliência em três camadas.** Um item por batch, com 2 segundos entre eles,
como proteção contra rate limit e não como tentativa de throughput. Cinco
tentativas com 5 segundos entre elas por item, o que dá até cerca de 25 segundos
antes de desistir. E falha parcial não derruba a execução: um item que esgota as
tentativas vira aviso, e o pipeline segue para os próximos.

**O workflow é um arquivo versionado.** O pipeline inteiro mora em um JSON que
dá para revisar em pull request, e a importação por linha de comando é
idempotente: rodar dez vezes deixa um workflow só. O n8n é o orquestrador, não o
lugar da regra de negócio complicada.

**O custo real está documentado.** Com o destino respondendo, dois usuários
levam cerca de 2,7 segundos. Com o destino fora do ar, cada usuário leva cerca de
25 segundos para ser marcado como falho. Esse número está no README porque é
exatamente o que alguém precisa saber antes de escolher esse desenho.

**Observabilidade sem promessa falsa.** O n8n Community não publica contadores
por execução nesta versão, e a documentação diz isso em vez de fingir que existe
um painel completo. Para acompanhar uma execução específica, o webhook devolve o
`correlationId`, que é o id da execução no próprio n8n.

## Como sei que funciona

São 23 testes estáticos que rodam sem rede e sem containers, cobrindo o JSON do
workflow, as conexões entre os nós, a versão máxima que a imagem suporta e a
consistência da configuração do Compose. Eles protegem contra a regressão
silenciosa.

O que garante que o pipeline executa de verdade é o outro job do CI: um smoke
test ponta a ponta que sobe o Compose, espera o healthcheck, importa e ativa o
workflow, dispara o webhook e confere o sumário. É ele que valida uma atualização
da imagem do n8n antes de ela entrar.

## Fora da suíte, por decisão

O importador de câmeras para o [Zabbix](/projetos/zabbix-camera-importer/) e o
importador de dispositivos para o [NetBox](/projetos/netbox-device-importer/)
formam uma suíte: mesma tela, mesmo problema, dois destinos. Este projeto não faz
parte dela.

Não tem tela, não tem planilha e não tem ninguém na frente. É um pipeline que
roda sozinho, e é de propósito que ele não se pareça com os outros dois: o
problema aqui é outro.
