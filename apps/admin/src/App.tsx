import { useEffect, useMemo, useState } from 'react';
import { Archive, ArrowUpRight, BarChart3, BookOpen, CheckCircle2, ChevronDown, CircleHelp, Database, FileUp, Filter, LayoutDashboard, LogIn, LogOut, MoreHorizontal, Plus, Search, Settings, Sparkles, Target, Upload, Users, X } from 'lucide-react';
import LoginModulePage from './login/LoginPage';
import AdminLoginPage from './login/AdminLoginPage';
import QuestionForm from './question-bank/QuestionForm';

type Board = { id: string; name?: string; code: string; country?: string };
type Question = { id: string; prompt: string; itemType: string; difficulty: string; status: string; provenance: string; createdAt?: string; topicId?: string };

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';
const assessmentChoices = [
  { subject: 'Mathematics', skills: ['Problem Solving', 'Numeracy', 'Reasoning'] },
  { subject: 'Science', skills: ['Scientific Thinking', 'Observation', 'Reasoning'] },
  { subject: 'English', skills: ['Language & Communication', 'Reading', 'Writing'] }
];
const assessmentTypes = [
  { id: 'ACADEMIC', title: 'Academic assessment', description: 'Subject knowledge and problem solving.', icon: BookOpen },
  { id: 'FUTURE_SKILLS', title: 'Future skills', description: 'Communication, creativity, and collaboration.', icon: Target }
] as const;
type AssessmentType = typeof assessmentTypes[number]['id'];
const fallbackQuestions: Question[] = [
  { id: 'q-1', prompt: 'Which strategy helps you add 348 and 275 accurately?', itemType: 'MCQ', difficulty: 'MEDIUM', status: 'ACTIVE', provenance: 'MANUALLY_CREATED', topicId: 'whole-numbers' },
  { id: 'q-2', prompt: 'Explain how you would check the answer to a division problem.', itemType: 'SHORT_ANSWER', difficulty: 'EASY', status: 'DRAFT', provenance: 'BULK_IMPORTED', topicId: 'whole-numbers' },
  { id: 'q-3', prompt: 'A garden is 12m by 8m. Compare two ways to find its area.', itemType: 'SCENARIO', difficulty: 'HARD', status: 'FLAGGED', provenance: 'AI_ASSISTED', topicId: 'geometry' },
  { id: 'q-4', prompt: 'What pattern do you notice in the first ten multiples of 6?', itemType: 'REFLECTION', difficulty: 'MEDIUM', status: 'ACTIVE', provenance: 'MANUALLY_CREATED', topicId: 'whole-numbers' },
];

async function getJson<T>(path: string, fallback: T): Promise<T> {
  try { const response = await fetch(`${API}${path}`); if (!response.ok) throw new Error('API unavailable'); return await response.json() as T; } catch { return fallback; }
}

function App() {
  if (window.location.pathname === '/admin/login') return <AdminLoginPage />;
  if (window.location.pathname === '/login') return <LoginModulePage />;
  if (window.location.pathname === '/student-profile') return <StudentProfilePage />;
  if (window.location.pathname === '/student' || window.location.pathname === '/students') return <StudentPage />;
  if (window.location.pathname === '/parent') return <ParentPage />;
  const sectionPaths: Record<string, string> = { Overview: '/', Curriculum: '/curriculum', 'Question bank': '/question-bank', Imports: '/imports', Analytics: '/analytics' };
  const pathSections: Record<string, string> = Object.fromEntries(Object.entries(sectionPaths).map(([section, path]) => [path, section]));
  const [active, setActive] = useState(pathSections[window.location.pathname] ?? 'Overview');
  const [boards, setBoards] = useState<Board[]>([]);
  const [questions, setQuestions] = useState<Question[]>(fallbackQuestions);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [showImport, setShowImport] = useState(false);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (localStorage.getItem('student-os-role') !== 'admin' || !localStorage.getItem('student-os-access-token')) window.location.replace('/admin/login');
  }, []);

  useEffect(() => {
    const syncSection = () => setActive(pathSections[window.location.pathname] ?? 'Overview');
    window.addEventListener('popstate', syncSection);
    return () => window.removeEventListener('popstate', syncSection);
  }, []);
  useEffect(() => { getJson<{ items: Board[] }>('/curriculum/boards', { items: [] }).then((data) => setBoards(data.items)); getJson<{ items: Question[] }>('/questions', { items: [] }).then((data) => { if (data.items.length) setQuestions(data.items); }); }, []);

  const filteredQuestions = useMemo(() => questions.filter((question) => {
    const matchesSearch = question.prompt.toLowerCase().includes(search.toLowerCase());
    return matchesSearch && (status === 'ALL' || question.status === status);
  }), [questions, search, status]);

  const notify = (message: string) => { setNotice(message); window.setTimeout(() => setNotice(''), 2600); };
  const nav = [
    { label: 'Overview', icon: LayoutDashboard }, { label: 'Curriculum', icon: BookOpen }, { label: 'Question bank', icon: CircleHelp }, { label: 'Imports', icon: Upload }, { label: 'Analytics', icon: BarChart3 }
  ];

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark">S</div><div><strong>student os</strong><span>curriculum control room</span></div></div>
      <div className="workspace-label">WORKSPACE</div>
      <nav>{nav.map(({ label, icon: Icon }) => <button key={label} className={active === label ? 'nav-item active' : 'nav-item'} onClick={() => { setActive(label); window.history.pushState({}, '', sectionPaths[label]); }}><Icon size={18} /><span>{label}</span>{label === 'Imports' && <b className="nav-count">2</b>}</button>)}</nav>
      <div className="sidebar-bottom"><button className="nav-item"><Users size={18} /><span>People & roles</span></button><button className="nav-item"><Settings size={18} /><span>Settings</span></button><button className="nav-item" onClick={() => { localStorage.removeItem('student-os-access-token'); localStorage.removeItem('student-os-role'); window.location.assign('/admin/login'); }}><LogOut size={18} /><span>Sign out</span></button><div className="user-chip"><div className="avatar">AS</div><div><strong>Admin workspace</strong><span>CBSE · 2026–27</span></div><MoreHorizontal size={17} /></div></div>
    </aside>
    <main className="main-content">
      <header className="topbar"><div className="crumb"><span>Workspace</span><ChevronDown size={15} /><strong>{active}</strong></div><div className="top-actions"><span className="live-dot"><i /> API connected</span><button className="icon-button" aria-label="Database status"><Database size={18} /></button><button className="avatar small" aria-label="Sign out" onClick={() => { localStorage.removeItem('student-os-access-token'); localStorage.removeItem('student-os-role'); window.location.assign('/admin/login'); }}>AS</button></div></header>
      <div className="page-wrap">
        <section className="page-heading"><div><p className="eyebrow">{new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }).format(new Date()).toUpperCase().replace(/,/g, ' ·')}</p><h1>{active === 'Overview' ? 'Good morning, admin.' : active}</h1><p className="heading-copy">Keep the learning map clean, current, and ready for the next student.</p></div><div className="heading-actions"><button className="button secondary" onClick={() => setShowImport(true)}><FileUp size={16} /> Import data</button><button className="button primary" onClick={() => setShowQuestionForm(true)}><Plus size={17} /> New question</button></div></section>
        {notice && <div className="toast"><Sparkles size={16} />{notice}</div>}
        {active === 'Overview' && <Overview boards={boards} questions={questions} onImport={() => setShowImport(true)} />}
        {active === 'Curriculum' && <Curriculum boards={boards} />}
        {active === 'Question bank' && <QuestionBank questions={filteredQuestions} search={search} setSearch={setSearch} status={status} setStatus={setStatus} />}
        {active === 'Imports' && <Imports onImport={() => setShowImport(true)} />}
        {active === 'Analytics' && <Analytics questions={questions} />}
      </div>
    </main>
    {showImport && <ImportModal onClose={() => setShowImport(false)} onImported={() => { setShowImport(false); notify('Import queued. Status will appear in Imports.'); }} />}
    {showQuestionForm && <QuestionForm api={API} onClose={() => setShowQuestionForm(false)} onSaved={(message) => { setShowQuestionForm(false); notify(message); }} />}
  </div>;
}

function LegacyLoginPage() {
  const [role, setRole] = useState<'student' | 'parent'>('student');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const authError = params.get('auth_error');
    if (authError === 'google_not_configured') setError('Google sign-in is not configured yet. Please use your account password or ask an administrator to add Google OAuth settings.');
    const token = params.get('access_token');
    const googleRole = params.get('role') as 'student' | 'parent' | null;
    if (!token || !googleRole) return;
    localStorage.setItem('student-os-access-token', token);
    localStorage.setItem('student-os-role', googleRole);
    window.location.replace(googleRole === 'student' ? '/students' : '/parent');
  }, []);

  async function signIn(event: React.FormEvent) {
    event.preventDefault();
    if (!identifier.trim() || !password.trim()) { setError('Enter your email or phone and password to continue.'); return; }
    setError('');
    try {
      const response = await fetch(`${API}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ identifier, password, role }) });
      const result = await response.json() as { accessToken?: string; message?: string };
      if (!response.ok || !result.accessToken) throw new Error(result.message ?? 'Unable to sign in');
      localStorage.setItem('student-os-access-token', result.accessToken);
      localStorage.setItem('student-os-role', role);
      window.location.assign(role === 'student' && (result as { needsProfile?: boolean }).needsProfile ? '/student-profile' : role === 'student' ? '/students' : '/parent');
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to sign in'); }
  }

  function continueWithGoogle() { window.location.assign(`${API}/auth/google?role=${role}`); }

  return <div className="login-shell"><div className="login-atmosphere" /><header className="login-header"><div className="student-brand"><div className="student-mark">S</div><span>student os</span></div><span className="login-context">A calmer way to grow</span></header><main className="login-main"><section className="login-intro"><p className="eyebrow">WELCOME BACK</p><h1>Make progress visible.</h1><p>Sign in to continue your learning journey or follow the growth of a learner you care about.</p><div className="login-stat"><strong>One shared space</strong><span>for learning, reflection, and steady progress.</span></div></section><form className="login-card" onSubmit={(event) => void signIn(event)}><div className="login-card-heading"><p className="eyebrow">SIGN IN AS</p><h2>Choose your space</h2></div><div className="role-switch" role="tablist" aria-label="Account type"><button type="button" className={role === 'student' ? 'active' : ''} onClick={() => { setRole('student'); setError(''); }}><BookOpen size={16} /> Student</button><button type="button" className={role === 'parent' ? 'active' : ''} onClick={() => { setRole('parent'); setError(''); }}><Users size={16} /> Parent</button></div><label>{role === 'student' ? 'Email or student ID' : 'Email or phone'}<input value={identifier} onChange={(event) => setIdentifier(event.target.value)} placeholder={role === 'student' ? 'you@example.com or student ID' : 'parent@example.com'} autoComplete="username" /></label><label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" autoComplete="current-password" /></label><div className="login-options"><label className="remember-option"><input type="checkbox" /> <span>Remember me</span></label><button type="button" className="forgot-button">Forgot password?</button></div>{error && <p className="login-error">{error}</p>}<button className="button primary login-submit" type="submit"><LogIn size={17} /> Continue as {role === 'student' ? 'student' : 'parent'}</button><div className="login-divider"><span>or</span></div><button className="google-login" type="button" onClick={continueWithGoogle}><span className="google-mark">G</span> Continue with Google</button><p className="login-note">Use your school account. Google sign-in requires OAuth credentials configured on the backend.</p></form></main></div>;
}

function StudentProfilePage() {
  const [form, setForm] = useState({ name: 'Adweta', fatherName: 'Demo Father', motherName: 'Demo Mother', age: '12', classLevel: '7', address: 'Demo residential address', schoolName: 'Demo School', schoolAddress: 'Demo School Road', schoolPlace: 'New Delhi', schoolCity: 'New Delhi', studentPhone: '', parentsPhone: '9999999999' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const update = (field: keyof typeof form, value: string) => setForm((current) => ({ ...current, [field]: value }));
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError(''); setSaving(true);
    try {
      const response = await fetch(`${API}/auth/student-profile`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('student-os-access-token') ?? ''}` }, body: JSON.stringify({ ...form, age: Number(form.age) }) });
      const result = await response.json() as { message?: string };
      if (!response.ok) throw new Error(result.message ?? 'Unable to save profile');
      window.location.assign('/students');
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to save profile'); } finally { setSaving(false); }
  }
  const fields: Array<[keyof typeof form, string, boolean]> = [['name', 'Name of student', true], ['fatherName', 'Father name', true], ['motherName', 'Mother name', true], ['age', 'Age', true], ['classLevel', 'Class', true], ['address', 'Home address', true], ['schoolName', 'School name', true], ['schoolAddress', 'School address', true], ['schoolPlace', 'School place', true], ['schoolCity', 'School city', true], ['studentPhone', 'Student phone (optional)', false], ['parentsPhone', 'Parents phone (mandatory)', true]];
  return <div className="profile-shell"><header className="login-header"><div className="student-brand"><div className="student-mark">S</div><span>student os</span></div><span className="login-context">Your learning profile</span></header><main className="profile-main"><div className="profile-heading"><p className="eyebrow">FIRST-TIME SETUP</p><h1>Tell us about the learner.</h1><p>These details help us tailor assessments to the student and keep parent progress connected.</p></div><form className="profile-card" onSubmit={(event) => void submit(event)}><div className="profile-fields">{fields.map(([field, label, required]) => <label key={field}>{label}<input type={field === 'age' ? 'number' : 'text'} value={form[field]} onChange={(event) => update(field, event.target.value)} required={required} />{field === 'parentsPhone' && <small>Required for parent updates and account linking.</small>}</label>)}</div>{error && <p className="login-error">{error}</p>}<button className="button primary login-submit" disabled={saving} type="submit">{saving ? 'Saving profile...' : 'Save profile'} <ArrowUpRight size={16} /></button></form></main></div>;
}

function ParentPage() {
  const [latestScore, setLatestScore] = useState(() => Number(window.localStorage.getItem('student-os-latest-score') ?? 72));

  useEffect(() => {
    getJson<{ overallGrowthScore?: number }>('/students/me/growth', { overallGrowthScore: latestScore })
      .then((growth) => {
        if (typeof growth.overallGrowthScore === 'number') {
          setLatestScore(growth.overallGrowthScore);
          window.localStorage.setItem('student-os-latest-score', String(growth.overallGrowthScore));
        }
      })
      .catch(() => undefined);
  }, []);

  return <div className="parent-shell"><header className="student-topbar"><div className="student-brand"><div className="student-mark">S</div><span>student os</span></div><button className="button secondary" onClick={() => { window.history.pushState({}, '', '/login'); window.dispatchEvent(new PopStateEvent('popstate')); }}>Sign out</button></header><main className="parent-content"><p className="eyebrow">PARENT SPACE</p><h1>See growth with context.</h1><p className="parent-copy">Follow Adweta's learning journey and understand where support can make the biggest difference.</p><section className="parent-grid"><div className="parent-highlight"><span className="eyebrow">LATEST OVERALL SCORE</span><strong>{latestScore}</strong><span>Steady progress from the last assessment</span></div><div className="parent-panel"><p className="eyebrow">LEARNING PROFILE</p><h2>Adweta · Class 7</h2><div className="parent-progress"><span><b>Problem Solving</b><i style={{ width: '78%' }} /></span><span><b>Communication</b><i style={{ width: '64%' }} /></span><span><b>Growth Mindset</b><i style={{ width: '82%' }} /></span></div></div></section><button className="button primary" onClick={() => { window.history.pushState({}, '', '/students'); window.dispatchEvent(new PopStateEvent('popstate')); }}>Open student view <ArrowUpRight size={16} /></button></main></div>;
}

function StudentPage() {
  const [student, setStudent] = useState({ name: 'Adweta', classLevel: 7, stage: 'MIDDLE' });
  const [assessments, setAssessments] = useState<Array<{ id: string; title: string; stage: string; domainMix: string[] }>>([]);
  const [started, setStarted] = useState('');
  const [activeAssessment, setActiveAssessment] = useState<{ id: string; title: string; type: AssessmentType } | null>(null);
  const [selectedAssessmentType, setSelectedAssessmentType] = useState<AssessmentType | null>(null);
  const [latestScore, setLatestScore] = useState(() => Number(window.localStorage.getItem('student-os-latest-score') ?? 72));
  const [showAssessmentPicker, setShowAssessmentPicker] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState('Mathematics');
  const [selectedSkill, setSelectedSkill] = useState('Problem Solving');

  useEffect(() => {
    getJson('/students/me', student).then(setStudent);
    getJson<{ items: Array<{ id: string; title: string; stage: string; domainMix: string[] }> }>('/assessments', { items: [] })
      .then((data) => setAssessments(data.items.length ? data.items : [{ id: 'assessment-middle-demo', title: 'Holistic Growth Check-in', stage: 'MIDDLE', domainMix: ['ACADEMIC', 'FUTURE_SKILLS', 'LEARNING_DISPOSITION'] }]));
    getJson<{ overallGrowthScore?: number }>('/students/me/growth', { overallGrowthScore: latestScore })
      .then((growth) => {
        if (typeof growth.overallGrowthScore === 'number') {
          setLatestScore(growth.overallGrowthScore);
          window.localStorage.setItem('student-os-latest-score', String(growth.overallGrowthScore));
        }
      });
  }, []);
  useEffect(() => {
    const scoreNode = document.querySelector('.progress-ring strong');
    if (scoreNode) scoreNode.textContent = String(latestScore);
  }, [latestScore]);

  async function startAssessment(assessmentId: string, confirmed = false, academicConfig?: { subject: string; topic: string; questionCount: number }) {
    if (!confirmed && !showAssessmentPicker) {
      setShowAssessmentPicker(true);
      return;
    }
    if (!selectedAssessmentType) return;
    const title = selectedAssessmentType === 'ACADEMIC' ? `${academicConfig?.subject ?? selectedSubject} · ${academicConfig?.topic ?? selectedSkill}` : `Future skills · ${selectedSkill}`;
    window.localStorage.setItem('student-os-question-count', String(academicConfig?.questionCount ?? 5));
    try {
      const response = await fetch(`${API}/assessment-attempts`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ studentId: 'student-demo', assessmentId }) });
      const result = await response.json() as { id?: string };
      const attemptId = result.id ?? 'demo-attempt';
      setStarted(attemptId);
      setActiveAssessment({ id: assessmentId, title, type: selectedAssessmentType });
    } catch {
      setStarted('demo-attempt');
      setActiveAssessment({ id: assessmentId, title, type: selectedAssessmentType });
    }
  }

  return <div className="student-shell">
    <header className="student-topbar"><div className="student-brand"><div className="student-mark">S</div><span>student os</span></div><div className="student-top-actions"><button className="student-help"><CircleHelp size={17} /> Help</button><div className="student-avatar">AS</div></div></header>
    <main className="student-content">
      {activeAssessment ? <AssessmentSession attemptId={started} title={activeAssessment.title} type={activeAssessment.type} skill={selectedSkill} onExit={async () => {
        const growth = await getJson<{ overallGrowthScore?: number }>('/students/me/growth', { overallGrowthScore: latestScore });
        if (typeof growth.overallGrowthScore === 'number') {
          setLatestScore(growth.overallGrowthScore);
          window.localStorage.setItem('student-os-latest-score', String(growth.overallGrowthScore));
        }
        setActiveAssessment(null);
        setStarted('');
      }} /> : showAssessmentPicker ? <AssessmentTypeGate selectedType={selectedAssessmentType} onSelect={setSelectedAssessmentType} onContinue={() => { setShowAssessmentPicker(false); void startAssessment(assessments[0].id); }} onAcademicStart={(subject, topic, questionCount) => { setSelectedSubject(subject); setSelectedSkill(topic); setShowAssessmentPicker(false); void startAssessment(assessments[0].id, true, { subject, topic, questionCount }); }} onCancel={() => setShowAssessmentPicker(false)} /> : <>
      <section className="student-welcome"><div><p className="eyebrow">YOUR LEARNING SPACE</p><h1>Keep growing, {student.name.split(' ')[0]}.</h1><p>Small steps today become stronger skills tomorrow.</p></div><div className="streak-card"><span className="streak-flame">✦</span><div><strong>4 day streak</strong><small>Keep your momentum going</small></div></div></section>
      <section className="student-grid"><div className="student-main-column"><div className="student-panel focus-panel"><div className="student-panel-head"><div><p className="eyebrow">UP NEXT</p><h2>Choose what to explore</h2></div><span className="class-pill">Class {student.classLevel}</span></div><div className="subject-tabs"><button className="subject-tab selected"><BookOpen size={17} /><span>Mathematics<small>12 topics ready</small></span></button><button className="subject-tab"><Target size={17} /><span>Science<small>8 topics ready</small></span></button><button className="subject-tab"><CircleHelp size={17} /><span>English<small>10 topics ready</small></span></button></div><div className="topic-strip"><div><span className="topic-label">SUGGESTED TOPIC</span><strong>Whole Numbers</strong><small>Practice addition, patterns, and place value</small></div><button className="topic-arrow">Explore <ArrowUpRight size={16} /></button></div></div><div className="student-panel assessments-panel"><div className="student-panel-head"><div><p className="eyebrow">ASSESSMENTS</p><h2>Ready when you are</h2></div><span className="muted-count">{assessments.length} available</span></div>{assessments.map((assessment) => <div className="assessment-card" key={assessment.id}><div className="assessment-icon"><Target size={19} /></div><div className="assessment-details"><strong>{assessment.title}</strong><small>15 min · {assessment.domainMix.length} skill areas · {assessment.stage.toLowerCase()} stage</small><div className="skill-tags">{assessment.domainMix.map((domain) => <span key={domain}>{domain.replace('_', ' ')}</span>)}</div></div>{started ? <span className="started-label"><CheckCircle2 size={16} /> Started</span> : <button className="start-button" onClick={() => startAssessment(assessment.id)}>Start <ArrowUpRight size={15} /></button>}</div>)}</div></div><aside className="student-side-column"><div className="student-panel progress-panel"><p className="eyebrow">YOUR PROGRESS</p><h2>A picture of your growth</h2><div className="progress-ring"><div><strong>72</strong><small>overall</small></div></div><div className="progress-caption"><span><i className="dot blue" /> Last check-in</span><strong>2 weeks ago</strong></div><button className="view-report">View growth report <ArrowUpRight size={15} /></button></div><div className="student-panel encouragement-panel"><Sparkles size={20} /><strong>One thoughtful answer is better than a fast one.</strong><p>Take your time. Your ideas are what we are here to understand.</p></div></aside></section>
      </>}
    </main>
  </div>;
}

function AssessmentTypeGate({ selectedType, onSelect, onContinue, onAcademicStart, onCancel }: { selectedType: AssessmentType | null; onSelect: (type: AssessmentType) => void; onContinue: () => void; onAcademicStart: (subject: string, topic: string, questionCount: number) => void; onCancel: () => void }) {
  const [showAcademicSetup, setShowAcademicSetup] = useState(false);
  if (showAcademicSetup) return <AcademicAssessmentSetup onStart={onAcademicStart} onCancel={() => setShowAcademicSetup(false)} />;
  return <div className="assessment-picker-overlay"><section className="assessment-type-gate"><button className="back-link" onClick={onCancel}>← Back to home</button><p className="eyebrow">START AN ASSESSMENT</p><h1>What would you like to practise?</h1><p className="gate-copy">Choose an assessment type first. Your questions will appear after you select one.</p><div className="assessment-type-grid">{assessmentTypes.map(({ id, title, description, icon: Icon }) => <button key={id} className={`assessment-type-card ${selectedType === id ? 'selected' : ''}`} onClick={() => onSelect(id)}><span className="assessment-type-icon"><Icon size={22} /></span><span><strong>{title}</strong><small>{description}</small></span>{selectedType === id ? <CheckCircle2 size={18} /> : <ArrowUpRight size={18} />}</button>)}</div><button className="button primary picker-continue" disabled={!selectedType} onClick={() => selectedType === 'ACADEMIC' ? setShowAcademicSetup(true) : onContinue()}>Continue to assessment <ArrowUpRight size={16} /></button></section></div>;
}

function AcademicAssessmentSetup({ onStart, onCancel }: { onStart: (subject: string, topic: string, questionCount: number) => void; onCancel: () => void }) {
  const [subject, setSubject] = useState('Mathematics');
  const [topic, setTopic] = useState('Whole Numbers');
  const [questionCount, setQuestionCount] = useState(5);
  const topics = subject === 'Mathematics' ? ['Whole Numbers', 'Fractions', 'Geometry'] : subject === 'Science' ? ['Living Things', 'Materials', 'Light and Sound'] : ['Reading', 'Grammar', 'Writing'];
  return <div className="assessment-picker-overlay"><section className="assessment-type-gate academic-setup"><button className="back-link" onClick={onCancel}>← Back to assessment types</button><p className="eyebrow">ACADEMIC ASSESSMENT</p><h1>Choose your subject and topic.</h1><p className="gate-copy">AI will generate questions for this learning focus.</p><label>Subject<select value={subject} onChange={(event) => { setSubject(event.target.value); setTopic(event.target.value === 'Mathematics' ? 'Whole Numbers' : event.target.value === 'Science' ? 'Living Things' : 'Reading'); }}>{['Mathematics', 'Science', 'English'].map((value) => <option key={value}>{value}</option>)}</select></label><label>Topic<select value={topic} onChange={(event) => setTopic(event.target.value)}>{topics.map((value) => <option key={value}>{value}</option>)}</select></label><fieldset><legend>Number of questions</legend><div className="question-count-options">{[5, 10].map((count) => <button type="button" key={count} className={questionCount === count ? 'selected' : ''} onClick={() => setQuestionCount(count)}>{count} questions</button>)}</div></fieldset><button className="button primary picker-continue" onClick={() => onStart(subject, topic, questionCount)}>Generate questions <Sparkles size={16} /></button></section></div>;
}

const demoAssessmentItems = [
  { id: 'item-language', competency: 'Language & Communication', prompt: 'Which sentence communicates an idea most clearly?', options: ['Maybe we could do it sometime.', 'Please submit your project by Friday.', 'The thing is over there.', 'I guess that is okay.'], correctAnswer: 1 },
  { id: 'item-problem-solving', competency: 'Problem Solving', prompt: 'What is the best first step when solving a new problem?', options: ['Guess immediately.', 'Ignore the information.', 'Understand what the problem is asking.', 'Choose the longest answer.'], correctAnswer: 2 },
  { id: 'item-growth-mindset', competency: 'Growth Mindset', prompt: 'Which response shows a growth mindset?', options: ['I cannot improve at this.', 'Practice can help me get better.', 'Mistakes mean I should stop.', 'Only natural talent matters.'], correctAnswer: 1 }
];

type GeneratedQuestion = { prompt: string; options: string[]; correctAnswer: number };
const questionSeeds: Record<string, GeneratedQuestion[]> = {
  Mathematics: [
    { prompt: 'Which value is greatest in this topic?', options: ['12', '21', '9', '15'], correctAnswer: 1 },
    { prompt: 'Which strategy is best for checking a calculation?', options: ['Estimate the result', 'Skip the working', 'Change the numbers', 'Copy the answer'], correctAnswer: 0 },
    { prompt: 'What should you do first when solving a word problem?', options: ['Guess', 'Identify the known information', 'Choose A', 'Round everything'], correctAnswer: 1 },
    { prompt: 'Which statement shows mathematical reasoning?', options: ['It looks right', 'I used evidence from the numbers', 'My friend said so', 'I did not check'], correctAnswer: 1 },
    { prompt: 'What does an equal sign show?', options: ['The left and right values are equivalent', 'The next number is bigger', 'The problem is finished', 'The answer is always zero'], correctAnswer: 0 },
    { prompt: 'Which representation can help explain a calculation?', options: ['A diagram', 'A random mark', 'An unrelated story', 'A blank page'], correctAnswer: 0 },
    { prompt: 'Why do we estimate an answer?', options: ['To check whether it is reasonable', 'To avoid reading', 'To make it exact', 'To remove units'], correctAnswer: 0 },
    { prompt: 'Which is an example of a pattern?', options: ['2, 4, 6, 8', '2, 9, 3, 7', '5, 1, 8, 2', '4, 4, 1, 9'], correctAnswer: 0 },
    { prompt: 'A clear solution should include:', options: ['Only a final number', 'Steps and an explanation', 'A guess', 'No units'], correctAnswer: 1 },
    { prompt: 'What helps compare two quantities?', options: ['A suitable operation or representation', 'Ignoring both values', 'Changing the question', 'Using no evidence'], correctAnswer: 0 }
  ],
  Science: [
    { prompt: 'What is the best way to investigate a science question?', options: ['Make a testable prediction', 'Choose an answer randomly', 'Avoid observations', 'Copy a result'], correctAnswer: 0 },
    { prompt: 'Which is evidence in a science investigation?', options: ['A measured observation', 'A personal guess', 'A rumour', 'A decoration'], correctAnswer: 0 },
    { prompt: 'Why should an experiment be repeated?', options: ['To improve confidence in the result', 'To change the question', 'To avoid recording data', 'To guarantee a preferred result'], correctAnswer: 0 },
    { prompt: 'Which tool is useful for measuring temperature?', options: ['Thermometer', 'Ruler', 'Compass', 'Balance'], correctAnswer: 0 },
    { prompt: 'A fair test changes:', options: ['One variable at a time', 'Every variable at once', 'No conditions', 'Only the answer'], correctAnswer: 0 },
    { prompt: 'What do plants need to make food?', options: ['Light', 'Plastic', 'Sound only', 'Darkness only'], correctAnswer: 0 },
    { prompt: 'Which state of matter keeps its own shape?', options: ['Solid', 'Liquid', 'Gas', 'Vapour only'], correctAnswer: 0 },
    { prompt: 'What does a habitat provide?', options: ['Resources for living things', 'Only sunlight', 'A number line', 'A school timetable'], correctAnswer: 0 },
    { prompt: 'A conclusion should be based on:', options: ['Collected evidence', 'A random choice', 'A prediction alone', 'Someone else’s guess'], correctAnswer: 0 },
    { prompt: 'Which action supports safe science learning?', options: ['Follow instructions', 'Taste unknown materials', 'Ignore equipment', 'Run without permission'], correctAnswer: 0 }
  ],
  English: [
    { prompt: 'Which sentence is clearest?', options: ['The student completed the task.', 'Task student maybe.', 'It did that thing.', 'Completed.'], correctAnswer: 0 },
    { prompt: 'What is the main idea of a passage?', options: ['Its central message', 'The longest word', 'The page number', 'A minor detail'], correctAnswer: 0 },
    { prompt: 'Which word is a verb?', options: ['Explore', 'Bright', 'Garden', 'Carefully'], correctAnswer: 0 },
    { prompt: 'What does a full stop usually show?', options: ['The end of a statement', 'A question', 'A list only', 'A speaker change'], correctAnswer: 0 },
    { prompt: 'Which detail best supports an idea?', options: ['A relevant example', 'An unrelated fact', 'A repeated title', 'A blank line'], correctAnswer: 0 },
    { prompt: 'What can context help a reader understand?', options: ['An unfamiliar word', 'The paper size', 'The font cost', 'The desk position'], correctAnswer: 0 },
    { prompt: 'Which opening suits a formal message?', options: ['Dear Principal,', 'Hey you!', 'What is up stuff', 'No greeting'], correctAnswer: 0 },
    { prompt: 'A summary should include:', options: ['Important points', 'Every single word', 'Only a title', 'Unrelated opinions'], correctAnswer: 0 },
    { prompt: 'Which word signals contrast?', options: ['However', 'Because', 'First', 'Also'], correctAnswer: 0 },
    { prompt: 'Good evidence for an interpretation comes from:', options: ['The text', 'A random picture', 'A different book', 'A guess without reading'], correctAnswer: 0 }
  ]
};

function generateQuestions(subject: string, topic: string, count: number) {
  const seeds = questionSeeds[subject] ?? questionSeeds.Mathematics;
  return Array.from({ length: count }, (_, index) => ({ ...seeds[index % seeds.length], id: `generated-${subject}-${topic}-${index + 1}`, prompt: `${seeds[index % seeds.length].prompt} (${topic})` }));
}

function AssessmentSession({ attemptId, title, type, skill, onExit }: { attemptId: string; title: string; type: AssessmentType; skill: string; onExit: () => void }) {
  return <McqAssessmentSession attemptId={attemptId} title={title} skill={title.split(' · ')[1] ?? skill} onExit={onExit} />;
}

function McqAssessmentSession({ attemptId, title, skill, onExit }: { attemptId: string; title: string; skill: string; onExit: () => void }) {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const questionCount = Number(window.localStorage.getItem('student-os-question-count') ?? 5);
  const [subject, topic] = title.split(' · ');
  const questions = generateQuestions(subject, topic, questionCount);
  const question = questions[questionIndex];

  async function submitAnswer() {
    if (selected === null || submitted) return;
    const correct = selected === question.correctAnswer;
    setSubmitted(true);
    setScore((value) => value + (correct ? 1 : 0));
    await fetch(`${API}/assessment-attempts/${attemptId}/responses`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ itemId: question.id, answer: { selectedOption: selected, score: correct ? 100 : 0 }, isSkipped: false }) });
  }

  async function nextQuestion() {
    if (!submitted) return;
    if (questionIndex === questions.length - 1) {
      await fetch(`${API}/assessment-attempts/${attemptId}/complete`, { method: 'POST' });
      window.localStorage.setItem('student-os-latest-score', String(Math.round(((score + (selected === question.correctAnswer ? 1 : 0)) / questions.length) * 100)));
      onExit();
      return;
    }
    setQuestionIndex((value) => value + 1);
    setSelected(null);
    setSubmitted(false);
  }

  return <section className="assessment-session"><div className="session-header"><div><button className="back-link" onClick={onExit}>← Back to learning space</button><p className="eyebrow">{title}</p><h1>Show what you know.</h1></div><span className="session-progress">{questionIndex + 1} of {questions.length}</span></div><div className="session-progress-track"><span style={{ width: `${((questionIndex + 1) / questions.length) * 100}%` }} /></div><div className="question-card"><span className="question-kicker">{skill} · AI-generated practice</span><h2>{question.prompt}</h2><div className="mcq-options">{question.options.map((option, index) => <button key={option} className={`mcq-option ${selected === index ? 'selected' : ''} ${submitted && index === question.correctAnswer ? 'correct' : ''} ${submitted && selected === index && selected !== question.correctAnswer ? 'incorrect' : ''}`} onClick={() => { if (!submitted) setSelected(index); }}><span>{String.fromCharCode(65 + index)}</span>{option}</button>)}</div>{submitted && <p className={`answer-feedback ${selected === question.correctAnswer ? 'correct' : 'incorrect'}`}>{selected === question.correctAnswer ? 'Correct answer.' : `Not quite. The correct answer is ${String.fromCharCode(65 + question.correctAnswer)}.`}</p>}<div className="question-actions"><button className="button secondary" onClick={onExit}>Exit</button><button className="button primary" disabled={selected === null || !submitted} onClick={() => void nextQuestion()}>{questionIndex === questions.length - 1 ? 'Submit assessment' : 'Next question'} <ArrowUpRight size={16} /></button><button className="button secondary answer-check" disabled={selected === null || submitted} onClick={() => void submitAnswer()}>Check answer</button></div></div></section>;
}

function LegacyAssessmentSession({ attemptId, title, type: _type, skill, onExit }: { attemptId: string; title: string; type: AssessmentType; skill: string; onExit: () => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [completed, setCompleted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sessionSubject, setSessionSubject] = useState(title.split(' · ')[0] || 'Mathematics');
  const [sessionSkill, setSessionSkill] = useState(skill);
  const items = demoAssessmentItems.map((item) => ({ ...item, competency: sessionSkill }));
  const item = items[currentIndex];
  const answer = answers[item.id] ?? '';

  async function saveAnswer(isSkipped = false) {
    if (!isSkipped && answer === '') return false;
    setSaving(true);
    try {
      const isCorrect = !isSkipped && Number(answer) === item.correctAnswer;
      setChecked({ ...checked, [item.id]: isCorrect });
      await fetch(`${API}/assessment-attempts/${attemptId}/responses`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ itemId: item.id, answer: { selectedOption: Number(answer), score: isCorrect ? 100 : 0 }, isSkipped }) });
      return true;
    } catch { return true; } finally { setSaving(false); }
  }

  async function next() {
    if (!(await saveAnswer())) return;
    if (currentIndex === items.length - 1) {
      await fetch(`${API}/assessment-attempts/${attemptId}/complete`, { method: 'POST' });
      setCompleted(true);
    } else setCurrentIndex((index) => index + 1);
  }

  if (completed) return <section className="assessment-session completion-panel"><p className="eyebrow">ASSESSMENT COMPLETE</p><h1>Nice work. Your responses are in.</h1><p>Your growth summary will be ready after your answers are reviewed.</p><button className="button primary" onClick={onExit}><CheckCircle2 size={16} /> Return home</button></section>;

  return <section className="assessment-session"><div className="session-focus"><div><p className="eyebrow">ASSESSMENT FOCUS</p><h2>Choose your subject and skill</h2></div><div className="choice-controls"><select value={sessionSubject} onChange={(event) => { const subject = event.target.value; setSessionSubject(subject); setSessionSkill(assessmentChoices.find((choice) => choice.subject === subject)?.skills[0] ?? ''); setCurrentIndex(0); setAnswers({}); }}>{assessmentChoices.map((choice) => <option key={choice.subject}>{choice.subject}</option>)}</select><select value={sessionSkill} onChange={(event) => { setSessionSkill(event.target.value); setCurrentIndex(0); setAnswers({}); }}>{assessmentChoices.find((choice) => choice.subject === sessionSubject)?.skills.map((choiceSkill) => <option key={choiceSkill}>{choiceSkill}</option>)}</select></div></div><div className="session-header"><div><button className="back-link" onClick={onExit}>← Back to learning space</button><p className="eyebrow">{title}</p><h1>Show us how you think.</h1></div><span className="session-progress">{currentIndex + 1} of {items.length}</span></div><div className="session-progress-track"><span style={{ width: `${((currentIndex + 1) / items.length) * 100}%` }} /></div><div className="question-card"><span className="question-kicker">{item.competency}</span><h2>{item.prompt}</h2><textarea value={answer} onChange={(event) => setAnswers({ ...answers, [item.id]: event.target.value })} placeholder="Take your time and write your thinking here..." rows={7} /><div className="question-actions"><button className="button secondary" disabled={saving} onClick={() => { void saveAnswer(true).then(() => { if (currentIndex === items.length - 1) setCompleted(true); else setCurrentIndex((index) => index + 1); }); }}>Skip for now</button><button className="button primary" disabled={saving} onClick={() => void next()}>{currentIndex === items.length - 1 ? 'Finish assessment' : 'Next question'} <ArrowUpRight size={16} /></button></div></div></section>;
}

function Overview({ boards, questions, onImport }: { boards: Board[]; questions: Question[]; onImport: () => void }) {
  return <><section className="stat-grid"><Stat label="Classes mapped" value={boards.length ? '10' : '—'} note="CBSE · all levels" accent="blue" /><Stat label="Questions ready" value={questions.length.toString().padStart(2, '0')} note={`${questions.filter(q => q.status === 'ACTIVE').length} active now`} accent="coral" /><Stat label="Needs review" value={questions.filter(q => q.status !== 'ACTIVE').length.toString().padStart(2, '0')} note="drafts + flagged" accent="gold" /><Stat label="Imports this term" value="06" note="last: 18 Aug 2026" accent="mint" /></section><section className="overview-grid"><div className="panel coverage-panel"><div className="panel-heading"><div><p className="eyebrow">COVERAGE SNAPSHOT</p><h2>Curriculum coverage</h2></div><button className="text-button">View detail <ArrowUpRight size={15} /></button></div><div className="coverage-bar"><span style={{ width: '72%' }} /><span style={{ width: '18%' }} /><span style={{ width: '10%' }} /></div><div className="legend"><span><i className="dot blue" /> Active questions <b>72%</b></span><span><i className="dot gold" /> In review <b>18%</b></span><span><i className="dot coral" /> Gaps <b>10%</b></span></div><div className="subject-list"><SubjectRow name="Mathematics" meta="Classes III–XII" value="84%" color="blue" /><SubjectRow name="Science" meta="Classes VI–XII" value="68%" color="mint" /><SubjectRow name="English" meta="Classes III–XII" value="61%" color="coral" /></div></div><div className="panel actions-panel"><p className="eyebrow">QUICK ACTIONS</p><h2>Move the bank forward</h2><button className="action-row" onClick={onImport}><span className="action-icon coral-bg"><Upload size={18} /></span><span><strong>Import curriculum</strong><small>CSV or JSON · merge safely</small></span><ArrowUpRight size={16} /></button><button className="action-row"><span className="action-icon blue-bg"><CircleHelp size={18} /></span><span><strong>Review question drafts</strong><small>2 questions need attention</small></span><ArrowUpRight size={16} /></button><button className="action-row"><span className="action-icon mint-bg"><BarChart3 size={18} /></span><span><strong>Open coverage report</strong><small>Find thinly-covered topics</small></span><ArrowUpRight size={16} /></button></div></section><section className="panel activity-panel"><div className="panel-heading"><div><p className="eyebrow">RECENT ACTIVITY</p><h2>What changed lately</h2></div><button className="text-button">All activity <ArrowUpRight size={15} /></button></div><div className="activity-list"><Activity color="coral" title="Curriculum import queued" detail="complete-cbse-curriculum-2026-27.csv · 485 rows" time="Today, 10:42" /><Activity color="blue" title="Question bank connected" detail="API returned 4 questions for the local workspace" time="Today, 09:18" /><Activity color="mint" title="Assessment backend online" detail="PostgreSQL is currently disabled for local preview" time="Yesterday, 16:10" /></div></section></>;
}
function Stat({ label, value, note, accent }: { label: string; value: string; note: string; accent: string }) { return <div className={`stat-card ${accent}`}><div className="stat-top"><span>{label}</span><span className="stat-pulse" /></div><strong>{value}</strong><small>{note}</small></div>; }
function SubjectRow({ name, meta, value, color }: { name: string; meta: string; value: string; color: string }) { return <div className="subject-row"><div><strong>{name}</strong><small>{meta}</small></div><div className="mini-track"><span className={color} style={{ width: value }} /></div><b>{value}</b></div>; }
function Activity({ color, title, detail, time }: { color: string; title: string; detail: string; time: string }) { return <div className="activity-row"><i className={`dot ${color}`} /><div><strong>{title}</strong><small>{detail}</small></div><time>{time}</time></div>; }

type CurriculumClass = { id: string; name: string; gradeBand: string; stage: string; level: number };
type CurriculumSubject = { id: string; name: string; code: string };
type CurriculumTopic = { id: string; name: string; code: string };

function Curriculum({ boards }: { boards: Board[] }) {
  const [classes, setClasses] = useState<CurriculumClass[]>([]);
  const [subjects, setSubjects] = useState<Record<string, CurriculumSubject[]>>({});
  const [topics, setTopics] = useState<Record<string, CurriculumTopic[]>>({});
  const [expandedClasses, setExpandedClasses] = useState<string[]>([]);
  const [expandedSubjects, setExpandedSubjects] = useState<string[]>([]);
  const [expandedStages, setExpandedStages] = useState<string[]>(['PREPARATORY', 'MIDDLE', 'SECONDARY']);
  const [selected, setSelected] = useState<{ title: string; detail: string; items: string[] } | null>(null);

  useEffect(() => {
    const boardId = boards[0]?.id;
    if (!boardId) return;
    getJson<{ items: CurriculumClass[] }>(`/curriculum/boards/${boardId}/classes`, { items: [] }).then((data) => setClasses(data.items));
  }, [boards]);

  const loadSubjects = async (classItem: CurriculumClass) => {
    let classSubjects = subjects[classItem.id];
    if (!classSubjects) {
      const data = await getJson<{ items: CurriculumSubject[] }>(`/curriculum/classes/${classItem.id}/subjects`, { items: [] });
      classSubjects = data.items;
      setSubjects((current) => ({ ...current, [classItem.id]: classSubjects ?? [] }));
    }
    setExpandedClasses((current) => current.includes(classItem.id) ? current.filter((id) => id !== classItem.id) : [...current, classItem.id]);
    setSelected({ title: classItem.name, detail: `${classItem.stage} · ${classItem.gradeBand}`, items: (classSubjects ?? []).map((subject) => subject.name) });
  };

  const loadTopics = async (subject: CurriculumSubject) => {
    let subjectTopics = topics[subject.id];
    if (!subjectTopics) {
      const data = await getJson<{ items: CurriculumTopic[] }>(`/curriculum/subjects/${subject.id}/topics`, { items: [] });
      subjectTopics = data.items;
      setTopics((current) => ({ ...current, [subject.id]: subjectTopics ?? [] }));
    }
    setExpandedSubjects((current) => current.includes(subject.id) ? current.filter((id) => id !== subject.id) : [...current, subject.id]);
    setSelected({ title: subject.name, detail: subject.code, items: (subjectTopics ?? []).map((topic) => topic.name) });
  };

  const stages = ['PREPARATORY', 'MIDDLE', 'SECONDARY'];
  const stageLabels: Record<string, string> = { PREPARATORY: 'Preparatory', MIDDLE: 'Middle', SECONDARY: 'Secondary' };
  return <section className="panel curriculum-panel"><div className="panel-heading"><div><p className="eyebrow">{boards[0]?.code ?? 'CBSE'} · 2026–27</p><h2>Curriculum structure</h2></div><div className="filter-chip"><Filter size={14} /> All stages <ChevronDown size={14} /></div></div><div className="curriculum-layout"><div className="tree"><div className="tree-root"><span className="tree-chevron">⌄</span><span><strong>{boards[0]?.name ?? 'CBSE'}</strong><small>Indian standard · {classes.length || 10} classes</small></span><MoreHorizontal size={15} /></div>{stages.map((stage) => { const stageClasses = classes.filter((item) => item.stage === stage); const stageExpanded = expandedStages.includes(stage); return <div className="tree-stage" key={stage}><button className="tree-stage-heading" onClick={() => setExpandedStages((current) => current.includes(stage) ? current.filter((item) => item !== stage) : [...current, stage])}><span className="tree-chevron">{stageExpanded ? '⌄' : '›'}</span><span><strong>{stageLabels[stage]}</strong><small>{stage === 'PREPARATORY' ? 'Classes III–V' : stage === 'MIDDLE' ? 'Classes VI–VIII' : 'Classes IX–XII'}</small></span></button>{stageExpanded && stageClasses.map((classItem) => <div key={classItem.id}><button className="tree-item indent" onClick={() => void loadSubjects(classItem)}><span className="tree-chevron">{expandedClasses.includes(classItem.id) ? '⌄' : '›'}</span><span><strong>{classItem.name}</strong><small>{classItem.gradeBand}</small></span><MoreHorizontal size={15} /></button>{expandedClasses.includes(classItem.id) && <div className="tree-children">{(subjects[classItem.id] ?? []).map((subject) => <div key={subject.id}><button className="tree-item subject-item" onClick={() => void loadTopics(subject)}><span className="tree-chevron">{expandedSubjects.includes(subject.id) ? '⌄' : '›'}</span><span><strong>{subject.name}</strong><small>{subject.code}</small></span></button>{expandedSubjects.includes(subject.id) && <div className="topic-list">{(topics[subject.id] ?? []).map((topic) => <button key={topic.id} onClick={() => setSelected({ title: topic.name, detail: subject.name, items: [] })}>{topic.name}</button>)}</div>}</div>)}</div>}</div>)}</div>; })}</div><div className="empty-detail">{selected ? <><BookOpen size={28} /><strong>{selected.title}</strong><p>{selected.detail}</p>{selected.items.length > 0 && <ul>{selected.items.map((item) => <li key={item}>{item}</li>)}</ul>}</> : <><BookOpen size={28} /><strong>{boards.length ? 'Select a class' : 'Curriculum API is empty'}</strong><p>{boards.length ? 'Expand a stage, then open a class to see its syllabus.' : 'Import the CBSE curriculum to populate this view.'}</p></>}</div></div></section>;
}

function QuestionBank({ questions, search, setSearch, status, setStatus }: { questions: Question[]; search: string; setSearch: (v: string) => void; status: string; setStatus: (v: string) => void }) { return <section className="panel question-panel"><div className="panel-heading"><div><p className="eyebrow">CONTENT LIBRARY</p><h2>Question bank <span className="count-badge">{questions.length}</span></h2></div><button className="filter-chip"><Filter size={14} /> Filters</button></div><div className="toolbar"><div className="search-box"><Search size={17} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search prompts..." /></div><select value={status} onChange={e => setStatus(e.target.value)}><option value="ALL">All statuses</option><option value="ACTIVE">Active</option><option value="DRAFT">Draft</option><option value="FLAGGED">Flagged</option></select><button className="icon-button"><MoreHorizontal size={18} /></button></div><div className="question-table"><div className="table-head"><span>Question prompt</span><span>Type</span><span>Difficulty</span><span>Status</span><span /></div>{questions.map(question => <div className="question-row" key={question.id}><div className="prompt-cell"><span className="question-number">Q</span><div><strong>{question.prompt}</strong><small>{question.provenance.replace('_', ' ')} · updated recently</small></div></div><span className="type-label">{question.itemType.replace('_', ' ')}</span><span className={`difficulty ${question.difficulty.toLowerCase()}`}>{question.difficulty}</span><span className={`status ${question.status.toLowerCase()}`}>{question.status}</span><button className="row-more"><MoreHorizontal size={17} /></button></div>)}</div></section>; }

function Imports({ onImport }: { onImport: () => void }) { return <section className="panel imports-panel"><div className="panel-heading"><div><p className="eyebrow">DATA PIPELINE</p><h2>Imports</h2></div><button className="button primary" onClick={onImport}><Upload size={16} /> New import</button></div><div className="import-hero"><div className="upload-orb"><Upload size={25} /></div><div><h3>Bring the curriculum in.</h3><p>Upload CSV or JSON files. Validation happens row by row, so one imperfect line never blocks the whole batch.</p></div><button className="button secondary" onClick={onImport}>Choose file <ArrowUpRight size={15} /></button></div><div className="import-list"><div><strong>complete-cbse-curriculum-2026-27.csv</strong><span>Curriculum · 485 rows · queued today</span></div><span className="status in-progress">IN PROGRESS</span><span>—</span></div></section>; }
function Analytics({ questions }: { questions: Question[] }) { const active = questions.filter(q => q.status === 'ACTIVE').length; return <section className="analytics-grid"><div className="panel chart-panel"><p className="eyebrow">QUESTION MIX</p><h2>Bank health</h2><div className="big-number">{Math.round((active / Math.max(questions.length, 1)) * 100)}<small>% active</small></div><div className="bar-chart">{[52, 74, 61, 86, 68, 42, 78].map((height, index) => <span key={index} style={{ height: `${height}%` }} />)}</div><div className="chart-labels"><span>III</span><span>V</span><span>VII</span><span>IX</span><span>XI</span></div></div><div className="panel insight-panel"><p className="eyebrow">COVERAGE GAPS</p><h2>Worth a closer look</h2><div className="insight"><span className="insight-icon coral-bg"><CircleHelp size={17} /></span><div><strong>Science needs more depth</strong><small>Classes VI–VIII have fewer active questions than the target baseline.</small></div></div><div className="insight"><span className="insight-icon gold-bg"><Archive size={17} /></span><div><strong>2 items are flagged</strong><small>Review wording before they enter another assessment.</small></div></div></div></section>; }
function ImportModal({ onClose, onImported }: { onClose: () => void; onImported: (message: string) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<Array<Record<string, string>>>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const parseCsv = (text: string) => {
    const lines = text.split(/\r?\n/).filter(Boolean);
    const headers = lines.shift()?.split(',').map(header => header.trim()) ?? [];
    return lines.map(line => {
      const values = line.match(/("(?:[^"]|"")*"|[^,]*)/g)?.slice(0, -1) ?? [];
      return Object.fromEntries(headers.map((header, index) => [header, (values[index] ?? '').replace(/^"|"$/g, '').replace(/""/g, '"')]));
    });
  };
  async function selectFile(selected: File | null) {
    setFile(selected); setError('');
    if (!selected) return setRows([]);
    try { setRows(parseCsv(await selected.text())); } catch { setRows([]); setError('Could not read this CSV file.'); }
  }
  async function importData() {
    if (!rows.length) return;
    setLoading(true); setError('');
    try {
      const response = await fetch(`${API}/curriculum/import`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rows }) });
      const result = await response.json() as { message?: string; rows?: number; topics?: number; objectives?: number };
      if (!response.ok) throw new Error(result.message ?? 'Import failed.');
      onImported(`Loaded ${result.rows} rows, ${result.topics} topics, and ${result.objectives} objectives into PostgreSQL.`);
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Import failed.'); } finally { setLoading(false); }
  }
  return <div className="modal-backdrop" onMouseDown={onClose}><div className="modal" onMouseDown={e => e.stopPropagation()}><div className="modal-head"><div><p className="eyebrow">CURRICULUM PIPELINE</p><h2>Load into PostgreSQL</h2></div><button className="icon-button" onClick={onClose}><X size={18} /></button></div><p className="import-note">Upload the CBSE CSV to create missing curriculum records and safely update existing rows.</p><label className="dropzone"><input type="file" accept=".csv" onChange={e => void selectFile(e.target.files?.[0] ?? null)} /><FileUp size={27} /><strong>{file ? file.name : 'Drop CSV here'}</strong><small>{file ? `${rows.length} rows ready to preview` : 'or choose a file from your computer'}</small></label>{rows.length > 0 && <div className="import-preview"><strong>Preview</strong><span>{rows.slice(0, 3).map(row => `${row.classGrade} · ${row.subject} · ${row.topic}`).join(' | ')}</span></div>}{error && <p className="import-error">{error}</p>}<div className="modal-foot"><button className="button secondary" onClick={onClose}>Cancel</button><button className="button primary" disabled={!rows.length || loading} onClick={() => void importData()}><Upload size={16} /> {loading ? 'Loading...' : 'Load data'}</button></div></div></div>;
}

export default App;
