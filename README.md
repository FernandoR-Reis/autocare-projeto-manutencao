# AutoCare Pro

Projeto web estático para gestão de manutenção veicular.

## Produção

- URL pública: https://fernandor-reis.github.io/autocare-projeto-manutencao/
- Link direto: https://fernandor-reis.github.io/autocare-projeto-manutencao/index.html

## Estrutura

- `index.html` → estrutura das telas e componentes
- `js/app.js` → orquestração da aplicação e fluxos de UI
- `js/store.js` → estado centralizado (store com mutations/commit)
- `js/api/images.js` e `js/api/google-maps.js` → integrações externas

## Como executar

1. Abra a pasta no VS Code.
2. Abra `index.html` no navegador (ou use extensão Live Server).
3. O login está temporariamente desativado para análise de UX/funcionalidades (acesso direto).

## Persistência

Os dados são salvos em `localStorage` no navegador.

## Atualizações rápidas

Com o script `deploy.ps1` na raiz, você pode publicar mudanças com um comando:

- Deploy com mensagem:
	- `./deploy.ps1 -Message "feat: ajustes no dashboard"`
- Deploy com mensagem automática (data/hora):
	- `./deploy.ps1`
- Deploy em outra branch:
	- `./deploy.ps1 -Message "release" -Branch "develop"`
- Deploy + domínio provisório (Cloudflare Tunnel):
	- `./deploy.ps1 -Message "hotfix" -Tunnel`

Parâmetros disponíveis:

- `-Message` → mensagem do commit
- `-Branch` → branch de destino (padrão: `main`)
- `-Tunnel` → inicia `cloudflared tunnel --url ...` ao final
- `-LocalUrl` → URL local para o túnel (padrão: `http://localhost:5500`)
