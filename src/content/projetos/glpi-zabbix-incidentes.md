---
titulo: 'Automação de incidentes entre Zabbix e GLPI'
resumo: >-
  Fluxo que transforma um evento do Zabbix em chamado no GLPI com validação,
  enriquecimento, correlação entre links da mesma unidade, criticidade calculada e
  tratamento da recuperação.
papel: 'Concepção e implementação'
periodo: '2025 e 2026'
ordem: 1
stack:
  - Zabbix
  - GLPI
  - API REST
  - Script de integração
  - Tags de evento
  - ITIL
imagem: '/img/glpi-zabbix-eventos.jpg'
imagemAlt: 'Tela do ambiente Zabbix monitorado pela automação.'
galeria:
  - src: '/img/glpi-chamado.jpg'
    alt: 'Chamado aberto automaticamente no GLPI, com os campos preenchidos pela automação.'
  - src: '/img/glpi-telegram-alerta.jpg'
    alt: 'Alerta de incidente recebido no Telegram, disparado pela automação.'
    enquadramento: natural
metricas:
  - valor: '900 s'
    rotulo: 'persistência mínima antes de abrir'
  - valor: '5'
    rotulo: 'níveis de criticidade calculados'
  - valor: '2'
    rotulo: 'ciclos tratados: abertura e recuperação'
ficha:
  - rotulo: 'Monitoramento'
    valor: 'Zabbix, com templates, triggers e tags'
  - rotulo: 'ITSM'
    valor: 'GLPI, pela API REST'
  - rotulo: 'Redução de ruído'
    valor: 'Tag GLPI=SIM e persistência mínima'
  - rotulo: 'Contexto'
    valor: 'Cliente do setor financeiro, em operação 24/7'
  - rotulo: 'Código'
    valor: 'Não público, trabalho entregue a cliente'
---

## O problema

Uma rede com muitas unidades monitoradas gera evento o dia inteiro. Abrir chamado
à mão não escala, e abre duplicado: a mesma queda gera ping, perda de pacote e
latência, e vira três chamados sobre o mesmo problema.

Existe um segundo problema, menos óbvio. Chamado não é alerta. Quem atende
precisa saber a unidade, o endereço, o contato, qual link caiu e com que
gravidade, e alerta nenhum traz isso sozinho.

## A decisão que define o projeto: nem todo evento vira chamado

É fácil fazer um fluxo que manda evento para o ITSM. O difícil é decidir o que
**não** mandar. A automação tem uma cadeia de validação antes de criar qualquer
coisa: o evento é válido, o tipo de trigger é permitido, a tag `GLPI=SIM` está
presente e, quando é o caso, o problema já persiste pelo tempo necessário.

A tag é o filtro grosso. Sem ela, qualquer evento do Zabbix viraria chamado. Com
ela, só os incidentes que alguém decidiu que importam entram no fluxo.

O filtro fino é a persistência. Para perda de pacote e tempo de resposta
elevado, o script exige **900 segundos** de problema antes de abrir. São
justamente os eventos que oscilam sozinhos: um pico de latência de dois minutos
não é incidente, é ruído, e era o que mais sujava a fila.

Vale notar que 900 segundos é a mesma janela do SLA contratual de 15 minutos.

## O evento é a fonte de dados, não a mensagem

Quando o trigger gera o Problem Event, o Zabbix chama o script de integração. Ele
recebe host, IP, nome do trigger, identificador do evento, data e hora, tags,
duração do incidente e informações de inventário.

O script não repassa isso adiante. Ele **usa** isso para montar o chamado. Antes
de escrever, consulta a própria API do Zabbix para buscar o designador da
unidade, o tipo de localização, o contato guardado no inventário e as tags
adicionais do host.

É essa etapa que faz o chamado chegar pronto para quem vai atuar, em vez de
chegar como uma linha dizendo que algo caiu.

## Não abrir o segundo chamado

Depois do enriquecimento, o script autentica na API REST do GLPI e procura
chamados ativos relacionados. Primeiro pelo host e, em algumas situações, pela
unidade inteira.

Essa busca é o que impede a criação indiscriminada. E ela habilita a parte mais
interessante do fluxo, que é a correlação.

Considere uma unidade com dois links. Se os dois caem, são dois eventos e, sem
correlação, seriam dois chamados independentes. A automação identifica que os
dois pertencem à mesma unidade, cria a relação entre eles no GLPI, atualiza a
criticidade e comenta um informando a existência do outro.

O que muda é o contexto. Um link indisponível é um incidente isolado. Vários
links indisponíveis na mesma unidade deixam de ser uma soma de incidentes e
passam a ser um incidente maior.

## Criticidade calculada, não fixa

Criticidade fixa por tipo de evento é fácil e errada: nem toda unidade tem o
mesmo peso, e o segundo link caído não é igual ao primeiro.

O script calcula o nível a partir do tipo de unidade, da quantidade de links
afetados e da relação entre os chamados daquela unidade. Daí saem cinco níveis,
de muito baixo a crítico, e é esse nível que alimenta prioridade, urgência e
impacto no GLPI.

O efeito prático é que a triagem deixa de ser um carimbo e passa a carregar
informação.

## Correlação nos dois sentidos

Depois de criar o chamado, a automação devolve o resultado para o próprio
Zabbix, gravando no evento `__zbx_glpi_problem_id`, `__zbx_glpi_link`,
`__zbx_glpi_trigger_name`, `__zbx_glpi_eventid` e `__zbx_glpi_ticket_open`. E o
evento é reconhecido automaticamente com a referência ao chamado.

O ganho é direto: olhando o evento no Zabbix se sabe qual é o chamado, e olhando
o chamado se sabe qual evento o originou. Sem isso, quem está de plantão acaba
fazendo a ponte entre as duas telas de cabeça, e o histórico se perde.

## Perda de pacote como incidente complementar

Se já existe um chamado de indisponibilidade para uma unidade e depois aparece
perda de pacote, o sistema não abre outro chamado. Ele localiza o chamado de
queda existente e adiciona um alerta complementar informando a perda.

É o oposto de três chamados paralelos, um de queda, um de perda e um de latência,
quando na prática os três são o mesmo incidente visto por ângulos diferentes.

## A recuperação é parte do fluxo

A automação não para na abertura. Quando o Zabbix detecta que o problema
terminou, o evento de recuperação dispara o caminho inverso: localiza o chamado
correspondente, adiciona a atualização, registra a recuperação detectada e
atualiza o chamado para solucionado.

Automatizar a abertura e deixar o fechamento na mão é entregar metade do
trabalho. Com o ciclo fechado, o chamado deixa de depender de alguém lembrar de
encerrá-lo.

## Um fluxo paralelo, por e-mail

Além do GLPI, o incidente precisa chegar ao parceiro que opera a conectividade.
E aqui o problema era outro: o parceiro não oferecia API aberta para integração.

A saída não foi deixar a abertura dependente de ação manual. Foi usar o próprio
mecanismo de envio de e-mail do Zabbix: o evento elegível dispara o e-mail com
os dados do incidente, e o parceiro abre a solicitação do lado dele. O controle
de duplicidade fica do meu lado, com as mesmas tags e informações do fluxo do
Zabbix.

O princípio vale além desse caso: quando o ponto de integração não existe, você
não espera ele aparecer. Usa o que a plataforma já oferece e mantém o controle
no seu lado.

## O que eu levaria para a próxima

Integração por e-mail tem contrato fraco. O formato da mensagem pode mudar dos
dois lados sem aviso, e não há confirmação de recebimento, diferente do que
acontece com a API do GLPI. Foi a escolha certa naquele momento, mas é a parte
do fluxo que eu vigiaria de perto se o volume crescesse.

E a busca por chamados ativos, que hoje resolve a duplicidade, depende de a
busca estar bem calibrada. Janela curta demais cria duplicata, longa demais
esconde incidente novo. É o tipo de parâmetro que só o tempo em produção ajusta.
