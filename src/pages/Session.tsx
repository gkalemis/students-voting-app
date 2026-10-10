import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useT } from '../context/LocaleContext';
import { api, json } from '../api';
import { translateError } from '../i18n';
import { Layout } from '../components/Layout';
import { ResultsTable } from '../components/ResultsTable';
import { PresentationHeaderCard } from '../components/PresentationHeaderCard';
import { EditModal, QrModal, StudentDemoModal, CompleteModal, SessionQrCard, downloadAuth } from '../components/SessionModals';
import { toGreekUppercase } from '../utils/greek';

export function Session() {
  const { id } = useParams();
  const { t, language } = useT();
  const [s, setS] = useState<any>();
  const [edit, setEdit] = useState<any>();
  const [toastMsg, setToastMsg] = useState('');
  const [err, setErr] = useState('');
  const [showQrModal, setShowQrModal] = useState(false);
  const [showStudentDemoModal, setShowStudentDemoModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = () => api(`/sessions/${id}`).then(setS).catch(e => setErr(translateError(e, language)));
  useEffect(() => { load(); }, [id, language]);

  if (!s) return <Layout>{err || t('loading')}</Layout>;

  const act = async (path: string, body?: any) => {
    try {
      await api(`/sessions/${id}/${path}`, json('POST', body));
      load();
    } catch (e) {
      setErr(translateError(e, language));
    }
  };

  const fullJoinUrl = `${window.location.origin}/join/${s.public_id}`;

  const copyUrl = () => {
    navigator.clipboard.writeText(fullJoinUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => {});
  };

  const activeP = s.presentations.find((p: any) => p.status === 'VOTING_OPEN');

  return (
    <Layout>
      <div className="title-row">
        <div>
          <h1>{s.title || t('session')}</h1>
          <p>{s.session_date} · <b>{s.status}</b></p>
        </div>
        <div className="actions">
          {s.status === 'DRAFT' && <button onClick={() => act('activate')}>{t('activate')}</button>}
          {s.status === 'ACTIVE' && (
            <button className="danger" onClick={() => setShowCompleteModal(true)}>
              {t('complete')}
            </button>
          )}
          {s.status === 'COMPLETED' && !s.results_revealed && (
            <button onClick={() => act('reveal')}>{t('reveal')}</button>
          )}
          <div className="projector-and-demo-box">
            <Link className="button secondary projector-nav-btn" target="_blank" to={`/projector/${s.public_id}`}>
              📺 {t('projector')}
            </Link>
            <button
              type="button"
              className="student-demo-btn"
              onClick={() => setShowStudentDemoModal(true)}
              title={t('studentVoteDemoHint')}
            >
              {t('studentVoteDemo')}
            </button>
          </div>
        </div>
      </div>

      {err && <p className="error" role="alert">{err}</p>}
      {toastMsg && (
        <div className="card" style={{ background: '#ecfdf5', color: '#065f46', border: '1px solid #6ee7b7', padding: '.65rem 1rem', borderRadius: 8, margin: '.6rem 0', fontWeight: 600 }}>
          ✓ {toastMsg}
        </div>
      )}

      <SessionQrCard
        fullJoinUrl={fullJoinUrl}
        copied={copied}
        copyUrl={copyUrl}
        showQrModal={() => setShowQrModal(true)}
      />

      {/* Active Presentation Live Card */}
      {activeP && (
        <div style={{ margin: '1rem 0' }}>
          <PresentationHeaderCard
            brand={s.branding}
            courseName={s.course_name}
            groupTitle={s.group_title}
            presenterName={activeP.presenter_name}
            presentationTitle={activeP.title}
            closesAt={activeP.voting_closes_at}
            voteCount={activeP.vote_count}
            categories={s.criteria}
            actions={
              <div className="actions" style={{ marginTop: '.8rem' }}>
                <button type="button" className="secondary" onClick={() => act(`presentations/${activeP.id}/extend`, { seconds: 30 })}>
                  ⏱️ +30s
                </button>
                <button type="button" className="secondary" onClick={() => act(`presentations/${activeP.id}/extend`, { seconds: 60 })}>
                  ⏱️ +60s
                </button>
                <button type="button" className="danger" onClick={() => act(`presentations/${activeP.id}/close`)}>
                  ⏹️ {t('close')}
                </button>
              </div>
            }
          />
        </div>
      )}

      {/* Session Voting Categories (Configured during Session Creation) */}
      {s.criteria && s.criteria.length > 0 && (
        <div className="card" style={{ padding: '.75rem 1rem', background: '#f8fafc', border: '1px solid #dbeafe', borderRadius: 8, margin: '1rem 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '.5rem' }}>
            <span style={{ fontSize: '.88rem', fontWeight: 750, color: '#1e3a8a' }}>
              🏷️ {t('gradeCategories')} ({s.criteria.length}):
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.4rem' }}>
              {s.criteria.map((c: any) => (
                <span key={c.id} style={{ background: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe', padding: '.15rem .55rem', borderRadius: 6, fontSize: '.82rem', fontWeight: 600 }}>
                  {c.name} <b style={{ color: '#2563eb' }}>{c.weight}%</b>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      <h2>{t('presentations')}</h2>
      <div className="list">
        {s.presentations.map((p: any, idx: number) => (
          <div className="card row" key={p.id} style={p.status === 'VOTING_OPEN' ? { borderLeft: '4px solid #b52c35' } : {}}>
            <div>
              <span className={`pill ${p.status.toLowerCase()}`} lang="el">{toGreekUppercase(p.status)}</span>
              <span style={{ fontSize: '.85rem', color: '#687e95', marginLeft: '.5rem' }}>#{idx + 1}</span>
              <h3>{p.presenter_name}</h3>
              <p>{p.title || t('withoutTitle')} · <b>{p.vote_count}</b> {t('votes')}</p>
            </div>
            <div className="actions">
              {s.status !== 'COMPLETED' && (
                <button className="secondary" onClick={() => setEdit(p)}>{t('edit')}</button>
              )}
              {s.status === 'ACTIVE' && p.status === 'PENDING' && (
                <>
                  <button onClick={() => act(`presentations/${p.id}/open`)}>▶️ {t('open')}</button>
                  <button className="secondary" onClick={() => act(`presentations/${p.id}/skip`)}>{t('skip')}</button>
                </>
              )}
              {p.status === 'VOTING_OPEN' && (
                <>
                  <button className="secondary" onClick={() => act(`presentations/${p.id}/extend`, { seconds: 30 })}>
                    {t('extendVoting')}
                  </button>
                  <button className="danger" onClick={() => act(`presentations/${p.id}/close`)}>
                    {t('close')}
                  </button>
                </>
              )}
              {s.status === 'ACTIVE' && ['EVALUATED', 'NO_VOTES', 'CLOSED'].includes(p.status) && (
                <button
                  type="button"
                  className="secondary reopen-btn"
                  onClick={() => act(`presentations/${p.id}/reopen`, { duration: 60 })}
                  title={t('reopenVotingHint')}
                >
                  🔄 {t('reopenVoting')}
                </button>
              )}
              {p.status === 'SKIPPED' && s.status === 'ACTIVE' && (
                <button onClick={() => act(`presentations/${p.id}/skip`)}>{t('restore')}</button>
              )}
            </div>
          </div>
        ))}
      </div>

      {showQrModal && (
        <QrModal
          fullJoinUrl={fullJoinUrl}
          copied={copied}
          copyUrl={copyUrl}
          close={() => setShowQrModal(false)}
        />
      )}

      {edit && (
        <EditModal
          item={edit}
          save={async (x: any) => {
            await api(`/sessions/${id}/presentations/${edit.id}`, json('PUT', x));
            setEdit(null);
            load();
          }}
          close={() => setEdit(null)}
        />
      )}

      {showStudentDemoModal && (
        <StudentDemoModal
          publicId={s.public_id}
          close={() => setShowStudentDemoModal(false)}
        />
      )}

      {showCompleteModal && (
        <CompleteModal
          confirmComplete={() => {
            setShowCompleteModal(false);
            act('complete');
          }}
          close={() => setShowCompleteModal(false)}
        />
      )}

      {s.status === 'COMPLETED' && <ResultsTable rows={s.results} />}
      {s.status === 'COMPLETED' && (
        <p style={{ marginTop: '1rem' }}>
          <a href={`/api/sessions/${id}/export.csv`} onClick={downloadAuth}>CSV</a> ·{' '}
          <a href={`/api/sessions/${id}/export.xlsx`} onClick={downloadAuth}>Excel</a>
        </p>
      )}
    </Layout>
  );
}
