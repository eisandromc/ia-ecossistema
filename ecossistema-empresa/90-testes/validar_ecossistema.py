#!/usr/bin/env python3
"""Validação estrutural local do ecossistema; requer PyYAML. Não inicia agentes."""
from pathlib import Path
from collections import Counter
import sys
try:
 import yaml
except ModuleNotFoundError:
 print('PyYAML ausente. Instale com: python3 -m pip install PyYAML')
 raise SystemExit(2)
root=Path(__file__).resolve().parent.parent
problems=[]
manifest_path=root/'ecosystem.yaml'
if not manifest_path.is_file():
 raise SystemExit('BLOQUEADO: ecosystem.yaml ausente na raiz: '+str(root))
manifest=yaml.safe_load(manifest_path.read_text(encoding='utf-8'))
recs=manifest.get('recursos', [])
ids=[r.get('id') for r in recs]
counts=Counter(ids)
if any(c>1 for c in counts.values()): problems.append('IDs duplicados: '+str([k for k,v in counts.items() if v>1]))
registered=set(ids)
if manifest.get('raiz') not in registered: problems.append('raiz não registrada: '+str(manifest.get('raiz')))
for entry in recs:
 rid,path=entry['id'],entry['arquivo']
 local=root/path
 if not local.is_file():
  problems.append(f'{rid}: arquivo ausente {path}')
  continue
 if local.resolve()!=root.resolve() and root.resolve() not in local.resolve().parents:
  problems.append(f'{rid}: caminho fora da raiz {path}')
 content=local.read_text(encoding='utf-8')
 if not content.startswith('---\n'):
  problems.append(f'{rid}: sem YAML frontmatter')
  continue
 parts=content.split('---\n',2)
 try: fm=yaml.safe_load(parts[1])
 except yaml.YAMLError as e: problems.append(f'{rid}: YAML frontmatter inválido: {e}'); continue
 if not isinstance(fm,dict): problems.append(f'{rid}: cabeçalho vazio'); continue
 if fm.get('id')!=rid: problems.append(f'{rid}: id não corresponde ao manifesto')
 if fm.get('pai')!=entry.get('pai'): problems.append(f'{rid}: pai não corresponde ao manifesto')
 if set(fm.get('usa') or []) != set(entry.get('usa') or []): problems.append(f'{rid}: usa divergente do manifesto')
 for ref in (entry.get('usa') or [])+([entry['pai']] if entry.get('pai') else []):
  if ref not in registered: problems.append(f'{rid}: recurso referenciado ausente: {ref}')
for p in [manifest.get('testes')]:
 if p and not (root/p).is_file(): problems.append('Arquivo de testes ausente: '+p)
for entry in recs:
 if entry['id'].startswith('orq.'):
  agent_refs=[x for x in entry.get('usa',[]) if x.startswith('ag.')]
  if len(agent_refs)>5: problems.append(f"{entry['id']}: mais de 5 agentes diretos")
print('Arquivos YAML/Markdown registrados:',len(recs))
print('Agentes:',sum(x.startswith('ag.') for x in ids),'Orquestradores:',sum(x.startswith('orq.') for x in ids),'Workflows:',sum(x.startswith('wf.') for x in ids))
if problems:
 for p in problems: print('ERRO:',p)
 raise SystemExit(1)
print('VALIDADO LOCALMENTE: YAML, arquivos, referências e estrutura OK')
print('NÃO OBSERVADO: carregamento na aplicação local e execução de agentes/integrações')
