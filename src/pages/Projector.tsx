import React from 'react';
import { useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { useT } from '../context/LocaleContext';
import { usePublic } from '../hooks/usePublic';
import { usePublicPoll } from '../hooks/usePublicPoll';
import { ProjectorPollView } from '../components/projector/ProjectorPollView';
import { BrandHeader } from '../components/BrandHeader';
import { LanguageButton } from '../components/LanguageButton';
import { BrandedLayout } from '../components/BrandedLayout';
import { PresentationHeaderCard } from '../components/PresentationHeaderCard';
import { ResultsPodium } from '../components/ResultsPodium';
import { AppFooter } from '../components/AppFooter';
import { applyThemeColor } from '../theme';

export function Projector() {
  const { publicId = '' } = useParams();
  const { t } = useT();
  const [s, load, sessionLoading] = usePublic(publicId);
  const [poll, , pollLoading] = usePublicPoll(publicId);

  React.useEffect(() => {
    if (s?.theme_color) {
      applyThemeColor(s.theme_color);
    }
  }, [s?.theme_color]);

  const fullJoinUrl = `${window.location.origin}/join/${poll?.public_id || s?.public_id || publicId}`;

  if (poll) {
    return <ProjectorPollView poll={poll} fullJoinUrl={fullJoinUrl} />;
  }

  if (!s) {
    if (pollLoading || sessionLoading) return <main className="center">{t('loading')}</main>;
    return (
      <main className="center" style={{ flexDirection: 'column', gap: '1rem', textAlign: 'center' }}>
        <div className="card" style={{ maxWidth: '440px', padding: '2rem' }}>
          <h2 style={{ marginTop: 0 }}>🔍 {t('sessionOrPollNotFound')}</h2>
          <p>{t('sessionOrPollNotFoundDesc')}</p>
          <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center' }}>
            <LanguageButton />
          </div>
        </div>
      </main>
    );
  }

  const allClosed = Boolean(s.presentations && s.presentations.length > 0 && s.presentations.every((p: any) => p.status === 'EVALUATED' || p.status === 'SKIPPED' || p.status === 'NO_VOTES'));
  const showResults = Boolean(s.results && s.results.length > 0 && !s.active_presentation && (s.results_revealed || s.status === 'COMPLETED'));

  return (
    <BrandedLayout state={s}>
      <main className="projector">
        <div className="public-tools"><LanguageButton /></div>
        <div className="project-grid">
          <section className="projector-main-content">
            {s.active_presentation ? (
              <PresentationHeaderCard
                brand={s.branding}
                courseName={s.course}
                periodName={s.period}
                groupTitle={s.group}
                presenterName={s.active_presentation.presenter_name}
                presentationTitle={s.active_presentation.title}
                closesAt={s.active_presentation.closes_at}
                voteCount={s.vote_count}
                categories={s.criteria}
                isProjector={true}
                onExpire={load}
              />
            ) : showResults ? (
              <div className="card projector-results-card">
                <BrandHeader brand={s.branding} isProjector={true} />
                <div className="projector-context-pill">
                  <span className="pres-badge course-badge projector-badge">🎓 {s.course}</span>
                  {s.period && <span className="pres-badge school-badge projector-badge">🏛️ {s.period}</span>}
                  {s.group && <span className="pres-badge dept-badge projector-badge">👥 {s.group}</span>}
                </div>
                <ResultsPodium rows={s.results} isProjector={true} />
              </div>
            ) : (
              <div className="card projector-idle-card">
                <BrandHeader brand={s.branding} isProjector={true} />
                <div className="projector-context-pill">
                  <span className="pres-badge course-badge projector-badge">🎓 {s.course}</span>
                  {s.period && <span className="pres-badge school-badge projector-badge">🏛️ {s.period}</span>}
                  {s.group && <span className="pres-badge dept-badge projector-badge">👥 {s.group}</span>}
                </div>
                <div className="projector-idle-content">
                  <h1 className="projector-status-heading">
                    {s.status === 'COMPLETED' ? t('sessionCompleted') : allClosed ? t('waitingLecturerToEndSession') : t('waitingPresentation')}
                  </h1>
                  <p className="projector-sub-instruction">
                    {t('autoUpdate')}
                  </p>
                </div>
              </div>
            )}
          </section>

          <aside className="qr projector-qr-panel">
            <h3 style={{ marginTop: 0, color: '#16314f', fontSize: '1.3rem' }}>{t('qrCodeSession')}</h3>
            <div className="qr-wrapper">
              <QRCodeSVG value={fullJoinUrl} size={280} marginSize={3} />
            </div>
            <p className="projector-qr-instruction">{t('scanToGrade')}</p>
            <p style={{ wordBreak: 'break-all', fontWeight: 700, margin: '.6rem 0 0 0', color: '#1b5eaa' }}>
              {fullJoinUrl}
            </p>
          </aside>
        </div>
        <AppFooter className="app-footer-projector" />
      </main>
    </BrandedLayout>
  );
}
