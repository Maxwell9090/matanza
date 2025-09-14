import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { username, password, role } = req.body || {};
    if (!username || !password) return res.status(400).json({ ok: false, error: 'Credenciais faltando' });

    const isMaster = role === 'master';
    const expectedUser = isMaster ? process.env.MASTER_USER : process.env.ADMIN_USER;
    const expectedHash = isMaster ? process.env.MASTER_PASS_HASH : process.env.ADMIN_PASS_HASH;

    if (!expectedUser || !expectedHash) {
      return res.status(500).json({ ok: false, error: 'Credenciais do servidor não configuradas' });
    }

    if (username !== expectedUser) {
      return res.status(401).json({ ok: false, error: 'Usuário ou senha inválidos' });
    }

    const ok = await bcrypt.compare(password, expectedHash);
    if (!ok) return res.status(401).json({ ok: false, error: 'Usuário ou senha inválidos' });

    const token = jwt.sign({ sub: username, role: isMaster ? 'master' : 'admin' }, process.env.JWT_SECRET, {
      expiresIn: '1d'
    });

    // Cookie HttpOnly, Secure, SameSite=Strict
    res.setHeader('Set-Cookie', `mtz_session=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=86400`);
    return res.status(200).json({ ok: true, user: { username, role: isMaster ? 'master' : 'admin' } });
  } catch (e) {
    return res.status(500).json({ ok: false, error: 'Erro interno' });
  }
}