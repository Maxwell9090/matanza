import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  try {
    const cookie = req.headers.cookie || '';
    const raw = cookie.split(';').map(x => x.trim()).find(x => x.startsWith('mtz_session='));
    if (!raw) return res.status(401).json({ ok: false });
    const token = raw.split('=')[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    return res.status(200).json({ ok: true, user: { username: payload.sub, role: payload.role } });
  } catch {
    return res.status(401).json({ ok: false });
  }
}