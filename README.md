# AutoCare Pro

App web para organizar manutenções de veículos, receber alertas no momento certo e manter um histórico completo que valoriza seu carro.

## Proposta de valor

> Organize as manutenções do seu veículo, saiba o que fazer agora e mantenha um histórico que valoriza seu patrimônio.

**Públicos atendidos:**
- Donos que querem saber o que precisam fazer no carro, sem complicação
- Motoristas organizados que mantêm preventivas em dia e querem histórico para valorização na venda
- Futuro: oficinas que queiram oferecer esse acompanhamento aos seus clientes

## Produção

- URL pública: https://fernandor-reis.github.io/autocare-projeto-manutencao/
- Link direto: https://fernandor-reis.github.io/autocare-projeto-manutencao/index.html

## Estrutura

- `index.html` → estrutura das telas e componentes
- `agendar-manutencao.html` → wizard de agendamento de manutenção
- `js/app.js` → orquestração da aplicação e fluxos de UI
- `js/dashboard.js` → módulo do dashboard (inclui "O que fazer hoje" e saúde dos veículos)
- `js/vehicles.js` → módulo de garagem e gestão de veículos
- `js/store.js` → estado centralizado (store com mutations/commit)
- `js/api/images.js` e `js/api/google-maps.js` → integrações externas
- `WEBHOOKS.md` → contrato de webhook e automações pós-agendamento (backend)
- `backend-webhooks/` → template Node/Express para receber e processar webhooks

## Como executar

1. Abra a pasta no VS Code.
2. Abra `index.html` no navegador (ou use extensão Live Server).
3. O login está temporariamente desativado para análise de UX/funcionalidades (acesso direto).

## Navegação principal

| Seção | Descrição |
|-------|-----------|
| **Início** | Dashboard com situação atual, o que fazer hoje e resumo da garagem |
| **Garagem** | Seus veículos com saúde, km e próximas manutenções |
| **Manutenções** | Lista completa com filtros: vencidas, próximas, em dia |
| **Oficinas** | Busca de prestadores e mecânicas próximas |
| **Alertas** | Notificações e configurações de prazo/km |

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
