require('dotenv').config();
const crypto = require('crypto');
const express = require('express');

const app = express();
const PORT = Number(process.env.PORT || 8787);
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || '';

const processedEvents = new Set();

app.use('/webhooks/appointments', express.raw({ type: 'application/json' }));
app.use(express.json());

function timingSafeEqualString(a, b) {
  const aBuf = Buffer.from(String(a));
  const bBuf = Buffer.from(String(b));
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

function validateSignature(rawBody, headerSignature) {
  if (!WEBHOOK_SECRET) return true;
  if (!headerSignature) return false;

  const digest = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');

  const expected = `sha256=${digest}`;
  return timingSafeEqualString(expected, headerSignature);
}

function normalizePhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return null;
  if (digits.startsWith('55')) return `+${digits}`;
  return `+55${digits}`;
}

function validatePayload(body) {
  if (!body || body.event !== 'appointment.created' || !body.data) {
    return 'Evento inválido';
  }

  const { appointmentId, customerEmail, customerPhone, dateTime } = body.data;

  if (!appointmentId) return 'appointmentId é obrigatório';
  if (!customerEmail) return 'customerEmail é obrigatório';
  if (!customerPhone) return 'customerPhone é obrigatório';
  if (!dateTime) return 'dateTime é obrigatório';

  return null;
}

async function sendConfirmationEmail(payload) {
  console.log('[email] queued', payload.data.appointmentId);
}

async function sendWhatsapp(payload) {
  console.log('[whatsapp] queued', payload.data.appointmentId);
}

async function createCalendarEvent(payload) {
  console.log('[calendar] queued', payload.data.appointmentId);
}

async function notifyWorkshop(payload) {
  console.log('[workshop] queued', payload.data.appointmentId);
}

async function processAppointmentCreated(payload) {
  const appointmentId = payload.data.appointmentId;

  if (processedEvents.has(appointmentId)) {
    return { duplicated: true };
  }

  processedEvents.add(appointmentId);

  const normalizedPayload = {
    ...payload,
    data: {
      ...payload.data,
      customerPhone: normalizePhone(payload.data.customerPhone)
    }
  };

  const [emailResult, whatsappResult, calendarResult, workshopResult] = await Promise.allSettled([
    sendConfirmationEmail(normalizedPayload),
    sendWhatsapp(normalizedPayload),
    createCalendarEvent(normalizedPayload),
    notifyWorkshop(normalizedPayload)
  ]);

  const channelStatus = {
    email: emailResult.status === 'fulfilled' ? 'sent' : 'failed',
    whatsapp: whatsappResult.status === 'fulfilled' ? 'sent' : 'failed',
    calendar: calendarResult.status === 'fulfilled' ? 'created' : 'failed',
    workshop_notification: workshopResult.status === 'fulfilled' ? 'sent' : 'failed'
  };

  console.log('[processed]', appointmentId, channelStatus);
  return { duplicated: false, channelStatus };
}

app.get('/health', (req, res) => {
  res.status(200).json({ ok: true, service: 'autocare-webhooks' });
});

app.post('/webhooks/appointments', async (req, res) => {
  try {
    const signature = req.header('x-webhook-signature');
    const isValid = validateSignature(req.body, signature);

    if (!isValid) {
      return res.status(401).json({ error: 'Assinatura inválida' });
    }

    const payload = JSON.parse(req.body.toString('utf-8'));
    const payloadError = validatePayload(payload);

    if (payloadError) {
      return res.status(400).json({ error: payloadError });
    }

    const result = await processAppointmentCreated(payload);

    return res.status(202).json({
      accepted: true,
      duplicated: result.duplicated,
      channelStatus: result.channelStatus || null
    });
  } catch (error) {
    console.error('[webhook:error]', error.message);
    return res.status(500).json({ error: 'Falha ao processar webhook' });
  }
});

app.listen(PORT, () => {
  console.log(`Webhook server rodando em http://localhost:${PORT}`);
});
