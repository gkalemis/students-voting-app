import React, { useState } from 'react';
import { api, json } from '../../api';
import { useT } from '../../context/LocaleContext';
import { translateError } from '../../i18n';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { PollQuestionType } from '../../pollTypes';
import { localToday } from '../../utils/dates';
import { PollQuestionEditorRow, DraftQuestion } from './PollQuestionEditorRow';
import {
  SIX_SCIENTIFIC_METHOD_QUESTIONS,
  SCIENTIFIC_METHOD_POLL_TITLE,
  SCIENTIFIC_METHOD_COURSE_NAME,
  SCIENTIFIC_METHOD_PERIOD_NAME
} from '../../defaultPollData';

interface Props {
  courses: any[];
  periods: any[];
  initialPoll?: any;
  onClose: () => void;
  onSuccess: (pollId: number) => void;
}

export function PollCreateModal({ courses, periods, initialPoll, onClose, onSuccess }: Props) {
  const { t, language } = useT();
  const isEditing = Boolean(initialPoll);
  useEscapeKey(onClose);

  const [title, setTitle] = useState(initialPoll?.title || SCIENTIFIC_METHOD_POLL_TITLE);
  const [courseName, setCourseName] = useState(() => {
    if (initialPoll?.course_name) return initialPoll.course_name;
    if (initialPoll?.course_id) {
      const found = courses.find(c => c.id === Number(initialPoll.course_id));
      if (found) return found.name;
    }
    return courses[0]?.name || SCIENTIFIC_METHOD_COURSE_NAME;
  });
  const [periodName, setPeriodName] = useState(() => {
    if (initialPoll?.period_name) return initialPoll.period_name;
    if (initialPoll?.period_id) {
      const found = periods.find(p => p.id === Number(initialPoll.period_id));
      if (found) return found.name;
    }
    return periods[0]?.name || SCIENTIFIC_METHOD_PERIOD_NAME;
  });
  const [sessionDate, setSessionDate] = useState(
    initialPoll?.session_date || localToday()
  );
  const [questions, setQuestions] = useState<DraftQuestion[]>(() => {
    if (initialPoll?.questions && initialPoll.questions.length > 0) {
      return initialPoll.questions.map((q: any) => ({
        id: q.id,
        text: q.text,
        type: q.type,
        options: [...q.options],
        correct_option_index: q.correct_option_index ?? null
      }));
    }
    return SIX_SCIENTIFIC_METHOD_QUESTIONS.map(q => ({
      text: q.text,
      type: q.type,
      options: [...q.options],
      correct_option_index: q.correct_option_index
    }));
  });

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const addQuestion = (type: PollQuestionType = 'MULTIPLE_CHOICE') => {
    setQuestions(prev => [
      ...prev,
      {
        text: '',
        type,
        options: type === 'TRUE_FALSE' ? ['Σωστό', 'Λάθος'] : ['Επιλογή 1', 'Επιλογή 2', 'Επιλογή 3', 'Επιλογή 4'],
        correct_option_index: null
      }
    ]);
  };

  const handleLoadSample = () => {
    setTitle(SCIENTIFIC_METHOD_POLL_TITLE);
    setCourseName(SCIENTIFIC_METHOD_COURSE_NAME);
    setPeriodName(SCIENTIFIC_METHOD_PERIOD_NAME);
    setQuestions(SIX_SCIENTIFIC_METHOD_QUESTIONS.map(q => ({
      text: q.text,
      type: q.type,
      options: [...q.options],
      correct_option_index: q.correct_option_index
    })));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !courseName.trim() || !periodName.trim()) {
      setErr(language === 'el' ? 'Συμπληρώστε τίτλο, μάθημα και ακαδημαϊκό έτος/περίοδο' : 'Fill in title, course and academic period');
      return;
    }
    if (questions.length === 0) {
      setErr(language === 'el' ? 'Προσθέστε τουλάχιστον μία ερώτηση' : 'Add at least one question');
      return;
    }
    setBusy(true);
    setErr('');
    try {
      const payload = {
        title: title.trim(),
        course_name: courseName.trim(),
        period_name: periodName.trim(),
        session_date: sessionDate,
        questions
      };
      if (isEditing) {
        await api(`/polls/${initialPoll.id}`, json('PUT', payload));
        onSuccess(initialPoll.id);
      } else {
        const res = await api('/polls', json('POST', payload));
        onSuccess(res.id);
      }
    } catch (e: unknown) {
      setErr(translateError(e, language));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: '1rem' }}>
      <div className="card modal-dialog" onClick={e => e.stopPropagation()} style={{ background: '#ffffff', borderRadius: '1rem', maxWidth: '760px', width: '100%', maxHeight: '92vh', overflowY: 'auto', padding: '1.5rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.35rem', color: '#0f172a' }}>
            🎯 {isEditing ? (language === 'el' ? 'Διαμόρφωση Quiz / Poll' : 'Edit Quiz / Poll') : `+ ${t('quizPoll')}`}
          </h2>
          <button type="button" onClick={onClose} aria-label={t('close')} className="outline" style={{ width: 'auto', border: 'none', fontSize: '1.2rem', padding: '0.2rem 0.6rem' }}>✕</button>
        </div>

        {err && <p className="error" role="alert" style={{ marginBottom: '1rem' }}>{err}</p>}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1rem', background: '#f1f5f9', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #cbd5e1' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.35rem', color: '#0f172a' }}>
                {language === 'el' ? 'Τίτλος Quiz / Ψηφοφορίας *' : 'Quiz / Poll Title *'}
              </label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="π.χ. Έξι ερωτήσεις ψηφοφορίας" required style={{ width: '100%', background: '#ffffff' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.35rem', color: '#0f172a' }}>
                🎓 {language === 'el' ? 'Μάθημα (γράψτε ή επιλέξτε) *' : 'Course (type or select) *'}
              </label>
              <input type="text" list="poll-courses-list" value={courseName} onChange={e => setCourseName(e.target.value)} placeholder={language === 'el' ? 'Γράψτε το όνομα του μαθήματος...' : 'Type course name...'} required style={{ width: '100%', background: '#ffffff' }} />
              <datalist id="poll-courses-list">{courses.map(c => <option key={c.id} value={c.name} />)}</datalist>
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.35rem', color: '#0f172a' }}>
                🏛️ {language === 'el' ? 'Ακαδημαϊκό Έτος / Περίοδος (γράψτε) *' : 'Academic Year / Period (type) *'}
              </label>
              <input type="text" list="poll-periods-list" value={periodName} onChange={e => setPeriodName(e.target.value)} placeholder={language === 'el' ? 'π.χ. Ακαδημαϊκό Έτος 2026-2027' : 'e.g. Academic Year 2026-2027'} required style={{ width: '100%', background: '#ffffff' }} />
              <datalist id="poll-periods-list">{periods.map(p => <option key={p.id} value={p.name} />)}</datalist>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '1.25rem 0 0.75rem 0', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b' }}>📝 {t('questions')} ({questions.length})</h3>
            <button type="button" onClick={handleLoadSample} className="outline" style={{ width: 'auto', fontSize: '0.8rem', padding: '0.3rem 0.65rem', color: '#0ea5e9', borderColor: '#0ea5e9', fontWeight: 700 }}>
              📦 {language === 'el' ? 'Επαναφορά 19 Ερωτήσεων Επιστημονικής Μεθόδου' : 'Reset 19 Scientific Method Questions'}
            </button>
          </div>

          {questions.map((q, qIdx) => (
            <PollQuestionEditorRow
              key={qIdx}
              q={q}
              qIdx={qIdx}
              totalQuestions={questions.length}
              onUpdateText={txt => setQuestions(prev => prev.map((item, i) => i === qIdx ? { ...item, text: txt } : item))}
              onUpdateType={tp => setQuestions(prev => prev.map((item, i) => i === qIdx ? {
                ...item,
                type: tp,
                options: tp === 'TRUE_FALSE' ? ['Σωστό', 'Λάθος'] : ['Επιλογή 1', 'Επιλογή 2', 'Επιλογή 3', 'Επιλογή 4'],
                correct_option_index: null
              } : item))}
              onUpdateOption={(optIdx, val) => setQuestions(prev => prev.map((item, i) => {
                if (i !== qIdx) return item;
                const opts = [...item.options];
                opts[optIdx] = val;
                return { ...item, options: opts };
              }))}
              onAddOption={() => setQuestions(prev => prev.map((item, i) => {
                if (i !== qIdx) return item;
                return { ...item, options: [...item.options, `Επιλογή ${item.options.length + 1}`] };
              }))}
              onRemoveOption={optIdx => setQuestions(prev => prev.map((item, i) => {
                if (i !== qIdx) return item;
                const opts = item.options.filter((_, idx) => idx !== optIdx);
                let corr = item.correct_option_index;
                if (corr === optIdx) corr = null;
                else if (corr !== null && corr > optIdx) corr = corr - 1;
                return { ...item, options: opts, correct_option_index: corr };
              }))}
              onSetCorrectOption={optIdx => setQuestions(prev => prev.map((item, i) => i === qIdx ? { ...item, correct_option_index: optIdx } : item))}
              onRemoveQuestion={() => setQuestions(prev => prev.filter((_, i) => i !== qIdx))}
            />
          ))}

          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <button type="button" onClick={() => addQuestion('MULTIPLE_CHOICE')} className="outline" style={{ width: 'auto', fontSize: '0.85rem' }}>
              + {t('multipleChoice')}
            </button>
            <button type="button" onClick={() => addQuestion('TRUE_FALSE')} className="outline" style={{ width: 'auto', fontSize: '0.85rem' }}>
              + {t('trueFalse')}
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="button" onClick={onClose} className="outline" style={{ width: 'auto' }}>{t('cancel')}</button>
            <button type="submit" disabled={busy} className="primary" style={{ width: 'auto' }}>{busy ? t('saving') : `🚀 ${t('save')}`}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
