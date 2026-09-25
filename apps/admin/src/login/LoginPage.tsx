import { useEffect, useState } from 'react';
import { ArrowUpRight, BookOpen, LogIn, Users } from 'lucide-react';
import './LoginPage.css';

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';
type Role = 'student' | 'parent';
type Mode = 'signin' | 'signup';

type AuthResponse = { accessToken?: string; needsProfile?: boolean; message?: string };

export default function LoginPage() {
  const [role, setRole] = useState<Role>('student');
  const [mode, setMode] = useState<Mode>('signin');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const authError = params.get('auth_error');
    if (authError === 'google_not_configured') setError('Google sign-in is not configured yet. Use your password or ask an administrator to add OAuth settings.');
    const token = params.get('access_token');
    const googleRole = params.get('role') as Role | null;
    if (token && googleRole) {
      localStorage.setItem('student-os-access-token', token);
      localStorage.setItem('student-os-role', googleRole);
      window.location.replace(googleRole === 'student' ? '/students' : '/parent');
    }
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    if (!identifier.trim() || !password) { setError('Enter your email or phone and password to continue.'); return; }
    try {
      const response = await fetch(`${API}/auth/${mode === 'signin' ? 'login' : 'signup'}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ identifier, password, role }) });
      const result = await response.json() as AuthResponse;
      if (!response.ok || !result.accessToken) throw new Error(result.message ?? `Unable to ${mode === 'signin' ? 'sign in' : 'create account'}`);
      localStorage.setItem('student-os-access-token', result.accessToken);
      localStorage.setItem('student-os-role', role);
      window.location.assign(role === 'student' && result.needsProfile ? '/student-profile' : role === 'student' ? '/students' : '/parent');
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to continue'); }
  }

  function continueWithGoogle() { window.location.assign(`${API}/auth/google?role=${role}`); }
  const signIn = mode === 'signin';

  return <div className="login-shell"><div className="login-atmosphere" /><header className="login-header"><div className="student-brand"><div className="student-mark">S</div><span>student os</span></div><span className="login-context">A calmer way to grow</span></header><main className="login-main"><section className="login-intro"><p className="eyebrow">{signIn ? 'WELCOME BACK' : 'GET STARTED'}</p><h1>{signIn ? 'Welcome back.' : 'Create your space.'}</h1><p>{signIn ? 'Sign in to continue your learning journey or follow the growth of a learner you care about.' : 'Create an account for learning, reflection, and steady progress.'}</p><div className="login-stat"><strong>One shared space</strong><span>for learning, reflection, and steady progress.</span></div></section><form className="login-card" onSubmit={(event) => void submit(event)}><div className="login-card-heading"><p className="eyebrow">{signIn ? 'SIGN IN AS' : 'SIGN UP AS'}</p><h2>Choose your space</h2></div><div className="role-switch" role="tablist" aria-label="Account type"><button type="button" className={role === 'student' ? 'active' : ''} onClick={() => { setRole('student'); setError(''); }}><BookOpen size={16} /> Student</button><button type="button" className={role === 'parent' ? 'active' : ''} onClick={() => { setRole('parent'); setError(''); }}><Users size={16} /> Parent</button></div><label>{role === 'student' ? 'Email or student phone' : 'Email or phone'}<input type="text" value={identifier} onChange={(event) => setIdentifier(event.target.value)} placeholder={role === 'student' ? 'you@example.com' : 'parent@example.com'} autoComplete="username" /></label><label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder={signIn ? 'Enter your password' : 'At least 6 characters'} autoComplete={signIn ? 'current-password' : 'new-password'} /></label>{signIn && <div className="login-options"><label className="remember-option"><input type="checkbox" /> <span>Remember me</span></label><button type="button" className="forgot-button">Forgot password?</button></div>}{error && <p className="login-error">{error}</p>}<button className="button primary login-submit" type="submit"><LogIn size={17} /> {signIn ? 'Continue as' : 'Create account as'} {role}</button><div className="login-divider"><span>or</span></div><button className="google-login" type="button" onClick={continueWithGoogle}><span className="google-mark">G</span> Continue with Google</button><p className="login-note">{signIn ? 'Use your school account to continue.' : 'Students will complete their profile after account creation.'}</p><button type="button" className="login-mode-switch" onClick={() => { setMode(signIn ? 'signup' : 'signin'); setError(''); }}>{signIn ? 'First time here? Create an account' : 'Already have an account? Sign in'} <ArrowUpRight size={14} /></button></form></main></div>;
}
