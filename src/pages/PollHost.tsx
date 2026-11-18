import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, json, connect } from '../api';
import { useT } from '../context/LocaleContext';
import { Layout } from '../components/Layout';
import { PollQuestionControlCard } from '../components/polls/PollQuestionControlCard';
import { PollQuestionsDrawer } from '../components/polls/PollQuestionsDrawer';
import { PollCreateModal } from '../components/polls/PollCreateModal';
import { translateError } from '../i18n';

export function PollHost() {
  const { id } = useParams<{ id: string }>();
  const { t, language } = useT();
  const [poll, setPoll] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [periods, setPeriods] = useState<any[]>([]);
  const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [actionBusy, setActionBusy] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const loadRef = useRef<() => void>(() => {});

  const load = useCallback(() => {
    api(`/polls/${id}`)
      .then(data => {
        setPoll(data);
        setSelectedQuestionId(prev => {
          const qs: any[] = data.questions || [];
          if (prev && qs.some(q => q.id === prev)) return prev;
          return data.active_question_id || qs[0]?.id || null;
        });
        setLoading(false);
      })
      .catch(e => {
        setErr(translateError(e, language));
        setLoading(false);
      });
  }, [id, language]);

  loadRef.current = load;

  useEffect(() => {
    load();
    Promise.all([api('/courses'), api('/periods')])
      .then(([c, p]) => { setCourses(c); setPeriods(p); })
      .catch(() => {});
  }, [load]);

  useEffect(() => {
    if (!poll?.public_id) return;
    const cleanup = connect(poll.public_id, () => loadRef.current());
    const interval = setInterval(() => loadRef.current(), 3000);
    return () => { cleanup(); clearInterval(interval); };
  }, [poll?.public_id]);

  const handleControl = async (action: string, questionId?: number) => {
    if (actionBusy) return;
    setActionBusy(true);
    try {
      await api(`/polls/${id}/control`, json('PUT', { action, question_id: questionId }));
      if (action === 'open_question' && questionId) setSelectedQuestionId(questionId);
      load();
    } catch (e) {
      setErr(translateError(e, language));
    } finally {
      setActionBusy(false);
    }
  };

  if (loading) return <Layout><main className="center">{t('loading')}</main></Layout>;
  if (!poll) {
    return (
      <Layout>
        <div className="card" style={{ maxWidth: 520, margin: '2rem auto', textAlign: 'center', padding: '2rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>⚠️</div>
          <h2 style={{ margin: '0 0 0.5rem 0', color: '#991b1b' }}>{t('sessionOrPollNotFound')}</h2>
          <p style={{ color: '#475569', marginBottom: '1.25rem' }}>{err || t('sessionOrPollNotFoundDesc')}</p>
          <Link to="/dashboard" className="button primary">
            ← {t('backToDashboard')}
          </Link>
        </div>
      </Layout>
    );
  }

  const questions: any[] = poll.questions || [];
  const liveQuestion = poll.active_question_id ? questions.find(q => q.id === poll.active_question_id) : null;
  const selectedIdxRaw = questions.findIndex(q => q.id === selectedQuestionId);
  const selectedIdx = selectedIdxRaw >= 0 ? selectedIdxRaw : 0;
  const selectedQuestion = questions[selectedIdx] || null;
  const projectorUrl = `/projector/${poll.public_id}`;
  const joinUrl = `/join/${poll.public_id}`;

  return (
    <Layout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
        <div>
          <Link to="/dashboard" className="button secondary outline" style={{ marginBottom: '0.5rem', padding: '0.35rem 0.75rem', fontSize: '0.85rem', minHeight: 'auto' }}>
            ← {t('dashboard')}
          </Link>
          <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#0f172a' }}>🎯 {poll.title}</h1>
          <div style={{ fontSize: '0.88rem', color: '#64748b', marginTop: '0.25rem' }}>
            🎓 {poll.course_name} {poll.period_name && `· 🏛️ ${poll.period_name}`} · 📅 {poll.session_date}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <button type="button" className="outline" onClick={() => setShowEditModal(true)} style={{ borderColor: '#6366f1', color: '#6366f1' }}>
            ✏️ {language === 'el' ? 'Διαμόρφωση' : 'Edit'}
          </button>
          <a href={projectorUrl} target="_blank" rel="noopener noreferrer" className="button outline" style={{ borderColor: '#2563eb', color: '#2563eb' }}>
            🖥️ {t('projector')}
          </a>
          <a href={joinUrl} target="_blank" rel="noopener noreferrer" className="button outline" style={{ borderColor: '#10b981', color: '#10b981' }}>
            📱 {language === 'el' ? 'Κινητό' : 'Phone'}
          </a>
          {poll.status !== 'COMPLETED' ? (
            <button type="button" className="danger" disabled={actionBusy} onClick={() => handleControl('complete')}>
              🏁 {t('completePoll')}
            </button>
          ) : (
            <button type="button" className="primary" disabled={actionBusy} onClick={() => handleControl('reopen_poll')}>
              🔄 {t('reopenPoll')}
            </button>
          )}
        </div>
      </div>

      {/* Live Projector Status Banner */}
      <div
        className="card"
        style={{
          marginBottom: '1rem',
          padding: '0.75rem 1rem',
          borderRadius: '0.75rem',
          background: liveQuestion ? '#ecfdf5' : '#f8fafc',
          border: liveQuestion ? '1.5px solid #10b981' : '1.5px solid #cbd5e1',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: liveQuestion ? '#065f46' : '#334155', fontSize: '0.92rem', fontWeight: 700 }}>
          <span>{liveQuestion ? '🟢' : '⏸️'}</span>
          {liveQuestion ? (
            <span>
              {t('projectingNow')}: #{liveQuestion.position + 1} — {liveQuestion.text}
            </span>
          ) : (
            <span>{t('projectorStandby')} · {t('standbyHint')}</span>
          )}
        </div>
        {liveQuestion && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="button" className="outline" onClick={() => setSelectedQuestionId(liveQuestion.id)} style={{ padding: '0.3rem 0.65rem', fontSize: '0.82rem', width: 'auto' }}>
              👁️ {language === 'el' ? 'Μετάβαση στην προβαλλόμενη' : 'Focus live'}
            </button>
            <button type="button" disabled={actionBusy} onClick={() => handleControl('standby')} className="outline" style={{ padding: '0.3rem 0.65rem', fontSize: '0.82rem', borderColor: '#64748b', color: '#334155', width: 'auto' }}>
              ⏸️ {t('hideFromProjector')}
            </button>
          </div>
        )}
      </div>

      {err && <p className="error" role="alert">{err}</p>}

      <div className="poll-host-grid">
        <PollQuestionControlCard
          questions={questions}
          selectedQuestion={selectedQuestion}
          selectedIdx={selectedIdx}
          liveQuestionId={poll.active_question_id || null}
          showResults={Boolean(poll.show_results)}
          actionBusy={actionBusy}
          onSelectIndex={idx => questions[idx] && setSelectedQuestionId(questions[idx].id)}
          onControl={handleControl}
        />

        <PollQuestionsDrawer
          questions={questions}
          selectedQuestionId={selectedQuestion?.id || null}
          liveQuestionId={poll.active_question_id || null}
          actionBusy={actionBusy}
          onPreviewQuestion={qId => setSelectedQuestionId(qId)}
          onControl={handleControl}
          onOpenEdit={() => setShowEditModal(true)}
        />
      </div>

      {showEditModal && (
        <PollCreateModal
          courses={courses}
          periods={periods}
          initialPoll={poll}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false);
            load();
          }}
        />
      )}
    </Layout>
  );
}
