DOSSIÊ 05 / FATURAMENTO

# Faturamento e recebimentos

Cliente Estrela do Vale • CL05 • Corte em 31/10/2026

A posição de cobrança separa o contrato assinado, as parcelas emitidas e os recebimentos efetivamente registrados até 31/10.

| Faturado | Recebido | Saldo já emitido |
| --- | --- | --- |
| R$ 42.292,50 | R$ 21.146,25 | R$ 21.146,25 |

## Conciliação do contrato

| Conceito | Valor (R$) | Como conferir |
| --- | ---: | --- |
| Contratado | 169.170,00 | Somar as linhas de venda assinadas. |
| Faturado | 42.292,50 | Somar somente parcelas com data de emissão. |
| Recebido | 21.146,25 | Somar as baixas registradas até o corte. |
| Saldo emitido | 21.146,25 | Faturado menos recebido. |
| A faturar | 126.877,50 | Contratado menos faturado. |

## Situação dos marcos

| Parcela | Gatilho | Percentual | Valor (R$) | Estado |
| --- | --- | ---: | ---: | --- |
| CL05-F01 | Assinatura do contrato | 25,0% | 42.292,50 | Vencida |
| CL05-F02 | Aceite dos três primeiros componentes | 35,0% | 59.209,50 | A faturar |
| CL05-F03 | Aceite dos seis componentes | 40,0% | 67.668,00 | A faturar |

CL05-05 \| Simulação didática \| Carteira v1 \| 01 / 04

---

## Extrato das parcelas

DOSSIÊ 05 / FATURAMENTO

Cliente Estrela do Vale • CL05 • Corte em 31/10/2026

Os vencimentos correspondem a 25 dias corridos após a emissão. A baixa de cada pagamento é vinculada ao ID da parcela.

### Posição das faturas

| Parcela | Emissão | Vencimento | Emitido (R$) | Recebido (R$) | Saldo (R$) |
| --- | --- | --- | ---: | ---: | ---: |
| CL05-F01 | 03/09 | 28/09 | 42.292,50 | 21.146,25 | 21.146,25 |
| CL05-F02 | - | - | 0,00 | 0,00 | 0,00 |
| CL05-F03 | - | - | 0,00 | 0,00 | 0,00 |

### Recebimentos registrados

| ID recebimento | Parcela | Data | Valor (R$) |
| --- | --- | --- | ---: |
| CL05-F01-R01 | CL05-F01 | 26/09 | 21.146,25 |
| Total |  | 31/10 | 21.146,25 |

### Controle de registro

A coluna de saldo considera apenas parcelas emitidas. Uma parcela a faturar permanece vinculada ao evento de aceite que autoriza a emissão.

CL05-05 \| Simulação didática \| Carteira v1 \| 02 / 04

---

## Idade do saldo emitido

DOSSIÊ 05 / FATURAMENTO

Cliente Estrela do Vale • CL05 • Corte em 31/10/2026

O saldo é classificado no corte pela data de vencimento. O quadro permite separar cobrança em atraso de emissão ainda condicionada ao projeto.

### Distribuição por vencimento

| Faixa | Quantidade de parcelas | Saldo (R$) |
| --- | ---: | ---: |
| A vencer | 0 | 0,00 |
| Vencida de 1 a 30 dias | 0 | 0,00 |
| Vencida há mais de 30 dias | 1 | 21.146,25 |

### Acompanhamento por parcela

| Parcela | Estado | Dias vencidos | Ação de controle |
| --- | --- | ---: | --- |
| CL05-F01 | Vencida | 33 | Validar plano de cobrança |
| CL05-F02 | A faturar | 0 | Acompanhar o aceite do marco |
| CL05-F03 | A faturar | 0 | Acompanhar o aceite do marco |

O Setor Controladoria valida os saldos e preserva a data de corte ao comparar posições.

CL05-05 \| Simulação didática \| Carteira v1 \| 03 / 04

---

## Cenários de faturamento e caixa

DOSSIÊ 05 / FATURAMENTO

Cliente Estrela do Vale • CL05 • Corte em 31/10/2026

Uma nova emissão altera o faturamento. Um recebimento altera o caixa e reduz o saldo emitido. Os efeitos abaixo são isolados para facilitar a conciliação.

### Simulação de movimentos

| Movimento | Faturado (R$) | Recebido (R$) | Saldo emitido (R$) |
| --- | ---: | ---: | ---: |
| Posição de corte | 42.292,50 | 21.146,25 | 21.146,25 |
| Emitir CL05-F02 | 101.502,00 | 21.146,25 | 80.355,75 |
| Quitar CL05-F01 | 42.292,50 | 42.292,50 | 0,00 |

### Regras para liberar um movimento

O Setor Implantação confirma o evento de aceite. O Setor Controladoria confere a emissão e a baixa. Cada cenário parte da posição do corte e representa um movimento hipotético.

### Parcelas condicionadas a aceite

| Parcela | Componentes com aceite pendente | Emissão estimada | Valor (R$) |
| --- | --- | --- | ---: |
| CL05-F02 | CL05-M02, CL05-M03 | 15/11 | 59.209,50 |
| CL05-F03 | CL05-M02, CL05-M03, CL05-M04, CL05-M05, CL05-M06 | 24/11 | 67.668,00 |

Emissão estimada para o dia seguinte ao último aceite previsto do marco, condicionada à confirmação do Setor Implantação.

CL05-05 \| Simulação didática \| Carteira v1 \| 04 / 04
