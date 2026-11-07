---
name: plano-aula
description: Use ao criar ou revisar um plano de aula ou sequência didática de ensino médio — gera o plano em seções fixas (objetivos, habilidades, tempos, metodologia, recursos, avaliação) a partir de turma, tema e duração.
metadata:
  id: sk.plano-aula
  tipo: skill
  versao: "1.0.0"
---
# Plano de aula

## Quando usar
- Pedido de plano de aula, roteiro de aula ou sequência didática.
- Revisão de um plano existente para alinhar objetivos, tempos e avaliação.

## Entradas
- turma, componente, tema, duracao_min (obrigatórios)
- nivel, recursos disponíveis, trecho do plano de curso (opcionais)

## Procedimento
1. Localize no plano de curso a unidade e os objetivos ligados ao tema. Sem plano de curso, marque "habilidade a confirmar".
2. Escreva 2 ou 3 objetivos com verbo observável (identificar, explicar, aplicar, construir, comparar). Evite "conhecer" e "entender".
3. Distribua o tempo: abertura 10–15%, desenvolvimento 60–70%, fechamento e verificação 15–20%. A soma tem de bater com a duração.
4. Escolha uma metodologia ativa compatível com o tempo (ex.: aula invertida, pares, resolução de problemas, mão na massa).
5. Para cada objetivo, defina a evidência de aprendizagem (o que o aluno entrega ou faz).
6. Preencha o template de `references/modelo-plano.md`.

## Template de saída
Use exatamente as seções de `references/modelo-plano.md`: Identificação · Objetivos · Habilidades · Roteiro com tempos · Metodologia · Recursos · Avaliação · Adaptações · Fontes.

## Exemplos
- **Bom:** "Ao final, o aluno será capaz de **escrever** uma função com dois parâmetros que retorna a soma." — verbo observável, critério claro.
- **Ruim:** "O aluno vai entender funções." — não dá para observar nem avaliar.

## Checklist
- [ ] 2–3 objetivos com verbo observável
- [ ] Soma dos tempos = duração
- [ ] Toda etapa tem atividade do aluno
- [ ] Evidência para cada objetivo
- [ ] Fonte do plano de curso citada ou "a confirmar"

## Referências
- `references/modelo-plano.md` — template completo
