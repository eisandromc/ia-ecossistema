#!/usr/bin/env python3
"""Valida configuração; não usa tokens, rede, e-mail ou APIs reais."""
from pathlib import Path
import sys
try:
    import yaml
except ImportError:
    raise SystemExit('BLOQUEADO: instale PyYAML — python3 -m pip install PyYAML')

root=Path(__file__).resolve().parent.parent
manifest=yaml.safe_load((root/'ecosystem.yaml').read_text(encoding='utf-8'))
config=yaml.safe_load((root/'80-adaptadores/acoes-integracoes.yaml').read_text(encoding='utf-8'))
issues=[]
required_ids={'ag.google-drive','ag.gmail','ag.github','orq.integracoes','wf.drive-documentos','wf.gmail-respostas','wf.github-projetos','wf.atendimento-integrado','sk.gate-externo'}
registered={r['id'] for r in manifest['recursos']}
issues += [f'recurso ausente: {x}' for x in sorted(required_ids-registered)]
ids=[a['id'] for a in config['acoes']]
if len(ids)!=len(set(ids)):
    issues.append('IDs de ação duplicados')
for a in config['acoes']:
    if a['tipo'] not in {'leitura','escrita','envio','exclusao','compartilhamento'}:
        issues.append('Tipo desconhecido: '+a['id'])
    if a['tipo']!='leitura' and a['requer_aprovacao_especifica'] is not True:
        issues.append('Operação externa sem gate: '+a['id'])
    if a['provedor']=='gmail' and a['ferramenta_conector'] is not None:
        issues.append('Ferramenta Gmail não confirmada: '+a['id'])
    if a['provedor'] in {'google_drive','github'} and not a['ferramenta_conector']:
        issues.append('Ação sem ferramenta de catálogo: '+a['id'])
    if a['disponibilidade'] not in {'na_sessao','requer_conectar_plugin'}:
        issues.append('Disponibilidade inválida: '+a['id'])
for file in ['80-adaptadores/CONEXOES_CHATGPT.md','80-adaptadores/CONTRATO_ACAO.md','90-testes/casos-integracoes.md']:
    if not (root/file).is_file():
        issues.append('Arquivo faltante: '+file)
print('Ações catalogadas:', len(ids),'| Manifesto:',len(registered),'recursos')
if issues:
    for x in issues: print('ERRO:',x)
    sys.exit(1)
print('VALIDADO LOCALMENTE: catálogo, aprovação e recursos declarados')
print('NÃO OBSERVADO: comportamento real, OAuth local, envio de mensagens e escritas')
