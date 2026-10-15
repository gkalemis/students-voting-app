import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useT } from '../context/LocaleContext';
import { api, json } from '../api';
import { translateError } from '../i18n';
import { BrandHeader } from '../components/BrandHeader';
import { getBrandingText } from '../utils/branding';
import { LanguageButton } from '../components/LanguageButton';
import { BrandedLayout } from '../components/BrandedLayout';
import { usePublic } from '../hooks/usePublic';
import { WaitingQueue } from '../components/WaitingQueue';
import { ResultsPodium } from '../components/ResultsPodium';
import { safeStorage } from '../utils/storage';
import { applyThemeColor } from '../theme';
import { MobileVotingViewport } from '../components/join/MobileVotingViewport';
import { VoteToast } from '../components/join/VoteToast';

export function Join() {
  const { publicId = '' } = useParams();
  const { t, language } = useT();
  const [s, load] = usePublic(publicId);
  const [scores, setScores] = useState<Record<number, number>>({});
  const [toast, setToast] = useState<{ type: 'success' | 'error'; title: string; subtitle?: string } | null>(null);
  const [pt, setPt] = useState('');
  const [isModified, setIsModified] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  useEffect(() => {
    if (s?.theme_color) {
      applyThemeColor(s.theme_color);
    }
  }, [s?.theme_color]);

  useEffect(() => {
    const key = `vote_token_${publicId}`;
    let saved: any = null;
    try {
      saved = JSON.parse(safeStorage.getItem(key) || 'null');
    } catch {}
    if (saved && new Date(saved.expires_at) > new Date()) {
      setPt(saved.token);
    } else {
      safeStorage.removeItem(key);
      api(`/public/sessions/${publicId}/tokens`, json('POST'))
        .then(x => {
          safeStorage.setItem(key, JSON.stringify(x));
          setPt(x.token);
        })
        .catch(e => setToast({ type: 'error', title: translateError(e, language) }));
    }
  }, [publicId, language]);

  useEffect(() => {
    if (pt && s?.active_presentation) {
      api(`/public/sessions/${publicId}/my-vote`, { headers: { 'X-Participation-Token': pt } })
        .then(x => {
          if (x.scores && Object.keys(x.scores).length > 0) {
            setScores(Object.fromEntries(Object.entries(x.scores as Record<string, number>).map(([k, v]) => [Number(k), v])) as Record<number, number>);
            setIsModified(false);
            setHasSubmitted(true);
          } else {
            setScores({});
            setIsModified(false);
            setHasSubmitted(false);
          }
        })
        .catch(() => {});
    }
  }, [pt, s?.active_presentation?.id]);

  if (!s) return <main className="center">{t('loading')}</main>;

  const triggerHaptic = (pattern: number | number[]) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // Ignored if vibration is disabled or unsupported
      }
    }
  };

  const handleScoreChange = (criterionId: number, val: number) => {
    triggerHaptic(15);
    setScores(prev => ({ ...prev, [criterionId]: val }));
    setIsModified(true);
  };

  async function submit() {
    triggerHaptic([40, 30, 40]);

    try {
      await api(`/public/sessions/${publicId}/vote`, {
        ...json('PUT', { scores }),
        headers: { 'X-Participation-Token': pt }
      });
      setToast({
        type: 'success',
        title: language === 'el' ? 'Η ψήφος καταχωρίστηκε!' : 'Vote submitted!',
        subtitle: language === 'el' ? 'Μπορείτε να αλλάξετε όσο η ψηφοφορία είναι ανοικτή' : 'Editable while voting remains open'
      });
      setIsModified(false);
      setHasSubmitted(true);
      setTimeout(() => setToast(null), 3000);
      load();
    } catch (e) {
      setToast({
        type: 'error',
        title: translateError(e, language)
      });
      setTimeout(() => setToast(null), 3000);
    }
  }

  const gradedCount = Object.keys(scores).length;
  const allGraded = gradedCount === s.criteria.length;

  const showResults = Boolean(
    s.results &&
    s.results.length > 0 &&
    !s.active_presentation &&
    (s.results_revealed || s.status === 'COMPLETED')
  );

  const universityName = getBrandingText(s.branding?.university_name, language) || t('app');
  const schoolName = getBrandingText(s.branding?.school_name, language);

  return (
    <BrandedLayout state={s}>
      <main className="mobile-voting-main">
        {s.active_presentation ? (
          <MobileVotingViewport
            s={s}
            universityName={universityName}
            schoolName={schoolName}
            scores={scores}
            onScoreChange={handleScoreChange}
            allGraded={allGraded}
            gradedCount={gradedCount}
            pt={pt}
            isModified={isModified}
            hasSubmitted={hasSubmitted}
            onSubmit={submit}
            onExpire={load}
            language={language}
            t={t}
          />
        ) : showResults ? (
          <div className="mobile-results-container">
            <div className="public-tools" style={{ marginBottom: '0.75rem' }}>
              <LanguageButton />
            </div>
            <BrandHeader brand={s.branding} />
            <ResultsPodium rows={s.results} isProjector={false} />
          </div>
        ) : (
          <div className="mobile-idle-container">
            <div className="public-tools" style={{ marginBottom: '0.75rem' }}>
              <LanguageButton />
            </div>
            <BrandHeader brand={s.branding} />
            <WaitingQueue s={s} />
          </div>
        )}

        {toast && <VoteToast toast={toast} onDismiss={() => setToast(null)} />}
      </main>
    </BrandedLayout>
  );
}
