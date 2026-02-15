# AutoCare Pro

Projeto web estático para gestão de manutenção veicular.

## Estrutura

- `index.html` → estrutura das telas e componentes
- `assets/css/styles.css` → estilos customizados
- `assets/js/tailwind-config.js` → configuração do Tailwind CDN
- `assets/js/app.js` → regras de negócio, estado e renderização

## Como executar

1. Abra a pasta no VS Code.
2. Abra `index.html` no navegador (ou use extensão Live Server).
3. Login demo: `demo@autocare.com` / `123456`.

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
