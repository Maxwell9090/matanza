export default async function handler(req, res) {
  // Invalida o cookie
  res.setHeader('Set-Cookie', 'mtz_session=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0');
  return res.status(200).json({ ok: true });
}