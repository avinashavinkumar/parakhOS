import { useEffect, useState } from 'react';
import { Save, X } from 'lucide-react';

type QuestionFormProps = { api: string; onClose: () => void; onSaved: (message: string) => void };
type CurriculumOption = { id: string; name: string; code?: string; level?: number; gradeBand?: string };

type FormState = { classId: string; subjectId: string; topicId: string; itemType: string; prompt: string; difficulty: string; options: string[]; correctAnswerKey: string };
const initialForm: FormState = { classId: '', subjectId: '', topicId: '', itemType: 'MCQ', prompt: '', difficulty: 'EASY', options: ['', '', '', ''], correctAnswerKey: 'A' };

export default function QuestionForm({ api, onClose, onSaved }: QuestionFormProps) {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [classes, setClasses] = useState<CurriculumOption[]>([]);
  const [subjects, setSubjects] = useState<CurriculumOption[]>([]);
  const [topics, setTopics] = useState<CurriculumOption[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const update = (field: keyof FormState, value: string) => setForm((current) => ({ ...current, [field]: value }));
  const updateOption = (index: number, value: string) => setForm((current) => ({ ...current, options: current.options.map((option, optionIndex) => optionIndex === index ? value : option) }));

  useEffect(() => {
    let active = true;
    setLoadingClasses(true);
    fetch(`${api}/curriculum/boards`).then((response) => response.json()).then(async (data: { items?: CurriculumOption[] }) => {
      const boardId = data.items?.[0]?.id;
      if (!boardId) return { items: [] };
      const response = await fetch(`${api}/curriculum/boards/${boardId}/classes`);
      return await response.json() as { items?: CurriculumOption[] };
    }).then((data) => { if (active) setClasses(data.items ?? []); }).catch(() => { if (active) setClasses([]); }).finally(() => { if (active) setLoadingClasses(false); });
    return () => { active = false; };
  }, [api]);

  useEffect(() => {
    setSubjects([]); setTopics([]);
    if (!form.classId) return;
    let active = true;
    setLoadingSubjects(true);
    fetch(`${api}/curriculum/classes/${form.classId}/subjects`).then((response) => response.json()).then((data: { items?: CurriculumOption[] }) => { if (active) setSubjects(data.items ?? []); }).catch(() => { if (active) setSubjects([]); }).finally(() => { if (active) setLoadingSubjects(false); });
    return () => { active = false; };
  }, [api, form.classId]);

  useEffect(() => {
    if (!form.subjectId) { setTopics([]); return; }
    let active = true;
    setLoadingTopics(true);
    fetch(`${api}/curriculum/subjects/${form.subjectId}/topics`).then((response) => response.json()).then((data: { items?: CurriculumOption[] }) => { if (active) setTopics(data.items ?? []); }).catch(() => { if (active) setTopics([]); }).finally(() => { if (active) setLoadingTopics(false); });
    return () => { active = false; };
  }, [api, form.subjectId]);

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError('');
    if (!form.classId.trim() || !form.subjectId.trim() || !form.topicId.trim() || !form.prompt.trim()) { setError('Class, subject, topic, and prompt are required.'); return; }
    if (form.itemType === 'MCQ' && form.options.some((option) => !option.trim())) { setError('Every multiple-choice option is required.'); return; }
    setSaving(true);
    try {
      const response = await fetch(`${api}/questions`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('student-os-access-token') ?? ''}` }, body: JSON.stringify({ classId: form.classId.trim(), subjectId: form.subjectId.trim(), topicId: form.topicId.trim(), itemType: form.itemType, prompt: form.prompt.trim(), difficulty: form.difficulty, options: form.itemType === 'MCQ' ? form.options.map((text, index) => ({ key: String.fromCharCode(65 + index), text })) : undefined, correctAnswerKey: form.itemType === 'MCQ' ? form.correctAnswerKey : undefined, provenance: 'MANUALLY_CREATED' }) });
      const result = await response.json() as { message?: string };
      if (response.status === 401) { localStorage.removeItem('student-os-access-token'); window.location.assign('/admin/login'); return; }
      if (!response.ok) throw new Error(result.message ?? 'Unable to save question');
      onSaved('Question saved as draft.');
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to save question'); } finally { setSaving(false); }
  }

  return <div className="modal-backdrop"><section className="modal question-form-modal"><div className="modal-head"><div><p className="eyebrow">QUESTION AUTHORING</p><h2>New question</h2></div><button className="icon-button" aria-label="Close question form" onClick={onClose}><X size={18} /></button></div><form onSubmit={(event) => void submit(event)}><div className="form-grid"><label>Class ID<select value={form.classId} onChange={(event) => { update('classId', event.target.value); update('subjectId', ''); update('topicId', ''); }} disabled={loadingClasses}><option value="">{loadingClasses ? 'Loading classes...' : 'Select class'}</option>{classes.map((item) => <option key={item.id} value={item.id}>{item.name || `Class ${item.level ?? item.gradeBand ?? ''}`}</option>)}</select></label><label>Subject ID<select value={form.subjectId} onChange={(event) => { update('subjectId', event.target.value); update('topicId', ''); }} disabled={!form.classId || loadingSubjects}><option value="">{loadingSubjects ? 'Loading subjects...' : 'Select subject'}</option>{subjects.map((item) => <option key={item.id} value={item.id}>{item.name}{item.code ? ` (${item.code})` : ''}</option>)}</select></label><label>Topic ID<select value={form.topicId} onChange={(event) => update('topicId', event.target.value)} disabled={!form.subjectId || loadingTopics}><option value="">{loadingTopics ? 'Loading topics...' : 'Select topic'}</option>{topics.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label>Item type<select value={form.itemType} onChange={(event) => update('itemType', event.target.value)}><option>MCQ</option><option>SHORT_ANSWER</option><option>REFLECTION</option><option>SCENARIO</option></select></label><label>Difficulty<select value={form.difficulty} onChange={(event) => update('difficulty', event.target.value)}><option>EASY</option><option>MEDIUM</option><option>HARD</option></select></label></div><label>Prompt<textarea value={form.prompt} onChange={(event) => update('prompt', event.target.value)} rows={4} placeholder="Write the question prompt" /></label>{form.itemType === 'MCQ' && <fieldset><legend>Answer options</legend>{form.options.map((option, index) => <label key={index}>{String.fromCharCode(65 + index)}<input value={option} onChange={(event) => updateOption(index, event.target.value)} placeholder={`Option ${String.fromCharCode(65 + index)}`} /></label>)}<label>Correct answer<select value={form.correctAnswerKey} onChange={(event) => update('correctAnswerKey', event.target.value)}>{form.options.map((_, index) => <option key={index}>{String.fromCharCode(65 + index)}</option>)}</select></label></fieldset>}{error && <p className="login-error">{error}</p>}<div className="modal-actions"><button className="button secondary" type="button" onClick={onClose}>Cancel</button><button className="button primary" disabled={saving} type="submit">{saving ? 'Saving...' : 'Save draft'} <Save size={16} /></button></div></form></section></div>;
}
