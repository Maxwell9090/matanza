export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

  const { nome, codnome, codid } = req.body;

  if (!nome || !codnome || !codid)
    return res.status(400).json({ ok: false, error: "Campos obrigatórios" });

  const msg = `Novo pedido para entrar no clã:\nNome: ${nome}\nPersonagem: ${codnome}\nID: ${codid}`;

  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  const telegramRes = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: msg }),
  });

  const data = await telegramRes.json();
  return res.status(200).json(data);
}