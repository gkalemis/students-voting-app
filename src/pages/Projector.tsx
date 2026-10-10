import React from 'react';
import { useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { useT } from '../context/LocaleContext';
import { usePublic } from '../hooks/usePublic';
import { BrandHeader } from '../components/BrandHeader';
import { LanguageButton } from '../components/LanguageButton';
import { BrandedLayout } from '../components/BrandedLayout';
import { PresentationHeaderCard } from '../components/PresentationHeaderCard';
import { ResultsTable } from '../components/ResultsTable';

export function Projector() {
  const { publicId = '' } = useParams();
  const { t } = useT();
  const [s, load] = usePublic(publicId);

  if (!s) return <>{t('loading')}</>;

  const fullJoinUrl = `${window.location.origin}/join/${s.public_id}`;

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
            ) : s.results_revealed ? (
              <div className="card projector-results-card">
                <BrandHeader brand={s.branding} />
                <p className="projector-context-tag">
                  {s.course} · {s.period} · {s.group}
                </p>
                <ResultsTable rows={s.results} />
              </div>
            ) : (
              <div className="card projector-idle-card">
                <BrandHeader brand={s.branding} />
                <p className="projector-context-tag">
                  {s.course} · {s.period} · {s.group}
                </p>
                <h1 className="projector-status-heading">
                  {s.status === 'COMPLETED' ? t('sessionCompleted') : t('waitingPresentation')}
                </h1>
                <p style={{ color: '#4b6177', fontSize: '1.2rem', marginTop: '.5rem' }}>
                  {t('autoUpdate')}
                </p>
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
      </main>
    </BrandedLayout>
  );
}
