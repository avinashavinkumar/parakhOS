import { useState } from 'react';
import { ArrowUpRight, KeyRound, LogIn } from 'lucide-react';
import './LoginPage.css';

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';

export default function AdminLoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    if (!identifier.trim() || !password) { setError('Enter your admin email and password.'); return; }
    setSaving(true);
    try {
      const response = await fetch(`${API}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ identifier, password, role: 'admin' }) });
      const result = await response.json() as { accessToken?: string; user?: { role?: string }; message?: string };
      if (!response.ok || !result.accessToken || result.user?.role !== 'admin') throw new Error(result.message ?? 'Admin access was not granted');
      localStorage.setItem('student-os-access-token', result.accessToken);
      localStorage.setItem('student-os-role', 'admin');
      window.location.assign('/');
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to sign in'); } finally { setSaving(false); }
  }

  return <div className="login-shell"><div className="login-atmosphere" /><header className="login-header"><div className="student-brand"><div className="student-mark">S</div><span>student os</span></div><span className="login-context">Curriculum control room</span></header><main className="login-main"><section className="login-intro"><p className="eyebrow">ADMIN WORKSPACE</p><h1>Keep the learning map ready.</h1><p>Sign in to create, review, and maintain questions for student assessments.</p><div className="login-stat"><strong><KeyRound size={16} /> Protected access</strong><span>Only provisioned administrators can enter.</span></div></section><form className="login-card" onSubmit={(event) => void submit(event)}><div className="login-card-heading"><p className="eyebrow">ADMIN SIGN IN</p><h2>Welcome back.</h2></div><label>Email or phone<input value={identifier} onChange={(event) => setIdentifier(event.target.value)} autoComplete="username" placeholder="admin@example.com" /></label><label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" placeholder="Enter your password" /></label>{error && <p className="login-error">{error}</p>}<button className="button primary login-submit" disabled={saving} type="submit">{saving ? 'Signing in...' : 'Enter workspace'} {saving ? <LogIn size={16} /> : <ArrowUpRight size={16} />}</button></form></main></div>;
}
