const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');

const PORT = process.env.PORT || 3000;

const client = new Client({
  authStrategy: new LocalAuth({ dataPath: './session' }),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  },
});

let ready = false;

client.on('qr', (qr) => {
  console.log('Scan this QR code with WhatsApp (Settings > Linked Devices > Link a Device):\n');
  qrcode.generate(qr, { small: true });
});

client.on('authenticated', () => {
  console.log('Authenticated. Session saved to ./session');
});

client.on('ready', () => {
  ready = true;
  console.log(`Client is ready. Logged in as: ${client.info.pushname} (${client.info.wid.user})`);
});

client.on('disconnected', (reason) => {
  ready = false;
  console.log('Client disconnected:', reason);
});

client.on('message', (msg) => {
  console.log(`[incoming] ${msg.from}: ${msg.body}`);
});

client.initialize();

// --- HTTP API ---
const app = express();
app.use(express.json());

app.get('/status', (req, res) => {
  res.json({ ready });
});

app.get('/contacts', async (req, res) => {
  if (!ready) return res.status(503).json({ error: 'WhatsApp client not ready yet' });
  try {
    const contacts = await client.getContacts();
    res.json(contacts.filter((c) => c.name || c.pushname).map((c) => ({ id: c.id._serialized, name: c.name, pushname: c.pushname, isGroup: c.isGroup })));
  } catch (err) {
    console.error('getContacts failed:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/chats', async (req, res) => {
  if (!ready) return res.status(503).json({ error: 'WhatsApp client not ready yet' });
  try {
    const chats = await client.getChats();
    res.json(chats.map((c) => ({ id: c.id._serialized, name: c.name, isGroup: c.isGroup })));
  } catch (err) {
    console.error('getChats failed:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /send { "number": "919876543210", "message": "hello" }
// number is in international format without + or leading zeros
app.post('/send', async (req, res) => {
  if (!ready) return res.status(503).json({ error: 'WhatsApp client not ready yet' });

  const { number, message } = req.body;
  if (!number || !message) {
    return res.status(400).json({ error: 'number and message are required' });
  }

  try {
    const chatId = number.includes('@') ? number : `${number}@c.us`;
    const sent = await client.sendMessage(chatId, message);
    res.json({ success: true, id: sent.id._serialized });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`HTTP API listening on http://localhost:${PORT}`);
});
