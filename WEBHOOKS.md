# Webhooks de Agendamento (Backend)

Este documento define o contrato esperado para automações após criação de agendamento.

## Evento

- Tipo: `appointment.created`
- Disparo: após criação e confirmação de agendamento no endpoint `POST /appointments`

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

## Ações pós-evento (recomendadas)

1. Enviar e-mail de confirmação para o cliente.
2. Enviar WhatsApp (Twilio, Zenvia ou provedor equivalente).
3. Criar evento no Google Calendar do cliente.
4. Notificar oficina/mecânico responsável.

## Requisitos técnicos mínimos

- Reprocessamento seguro: usar `appointmentId` como chave de idempotência.
- Política de retry: backoff exponencial para falhas transitórias.
- Observabilidade: logar `event`, `appointmentId`, status da entrega e tempo de processamento.
- Segurança: validar assinatura do webhook (HMAC) quando aplicável.
- LGPD: evitar dados além do necessário no payload e nos logs.

## Sugestão de ordem de execução

1. Persistir evento recebido.
2. Validar payload e normalizar telefone/data.
3. Disparar e-mail e WhatsApp em paralelo.
4. Criar evento no calendário.
5. Notificar oficina.
6. Marcar evento como processado.

## Status de entrega

Recomendado armazenar por canal:

- `email`: `queued | sent | failed`
- `whatsapp`: `queued | sent | failed`
- `calendar`: `created | failed`
- `workshop_notification`: `sent | failed`

## Observação

Este repositório é frontend estático. A implementação de webhook e automações deve ser feita no backend/API.