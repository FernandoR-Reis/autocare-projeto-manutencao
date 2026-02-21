# Template de Webhook - AutoCare

Servidor Node/Express para receber o evento `appointment.created` com validação de assinatura HMAC.

## Requisitos

- Node.js 18+

## Setup

1. Copie `.env.example` para `.env`.
2. Ajuste `WEBHOOK_SECRET`.
3. Instale dependências:

```bash
npm install
```

4. Inicie o servidor:

```bash
npm start
```

Servidor padrão: `http://localhost:8787`

## Endpoints

- `GET /health`
- `POST /webhooks/appointments`

## Assinatura HMAC

- Header esperado: `x-webhook-signature`
- Formato: `sha256=<hex>`
- Digest: HMAC-SHA256 do body raw usando `WEBHOOK_SECRET`

## Payload esperado

```json
{
  "event": "appointment.created",
  "data": {
    "appointmentId": "APT-123456",
    "customerEmail": "cliente@email.com",
    "customerPhone": "+5511987654321",
    "dateTime": "2024-03-15T10:00:00-03:00"
  }
}
```

## Próximos passos

Substituir os stubs abaixo por integrações reais:

- `sendConfirmationEmail`
- `sendWhatsapp`
- `createCalendarEvent`
- `notifyWorkshop`

E trocar idempotência em memória por Redis/DB para ambiente de produção.
