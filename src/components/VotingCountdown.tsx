import React, { useEffect, useState, useRef } from 'react';
import { useT } from '../context/LocaleContext';

export function VotingCountdown({
  closesAt,
  totalDuration = 60,
  onExpire,
  isCompact = false,
  lineOnly = false
}: {
  closesAt?: string;
  totalDuration?: number;
  onExpire?: () => void;
  isCompact?: boolean;
  lineOnly?: boolean;
}) {
  const { t } = useT();
  const [seconds, setSeconds] = useState(0);
  const [initialDiff, setInitialDiff] = useState(totalDuration);
  const expiredCalled = useRef(false);

  useEffect(() => {
    if (!closesAt) return;
    const diff = Math.max(1, Math.ceil((new Date(closesAt).getTime() - Date.now()) / 1000));
    setInitialDiff(diff);
    expiredCalled.current = false;
  }, [closesAt]);

  useEffect(() => {
    if (!closesAt) return;
    const update = () => {
      const remaining = Math.max(0, Math.ceil((new Date(closesAt).getTime() - Date.now()) / 1000));
      setSeconds(remaining);
      if (remaining === 0 && !expiredCalled.current && onExpire) {
        expiredCalled.current = true;
        onExpire();
        setTimeout(() => {
          onExpire();
        }, 800);
      }
    };
    update();
    const timer = setInterval(update, 250);
    return () => clearInterval(timer);
  }, [closesAt, onExpire]);

  if (!closesAt) return null;

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const isUrgent = seconds <= 15 && seconds > 0;
  const isExpired = seconds === 0;

  const percent = initialDiff > 0 ? Math.min(100, Math.max(0, (seconds / initialDiff) * 100)) : 0;

  if (lineOnly) {
    const formattedTime = isExpired
      ? t('timeUp')
      : `${mins > 0 ? `${mins}:` : ''}${secs < 10 && mins > 0 ? `0${secs}` : secs}s`;

    return (
      <div className="mobile-timer-line-container">
        <div
          className="mobile-timer-line-wrapper"
          role="progressbar"
          aria-valuenow={Math.round(percent)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={t('timeRemainingFull')}
          title={formattedTime}
        >
          <div className="mobile-timer-track">
            <div
              className={`mobile-timer-fill ${isUrgent ? 'urgent' : ''}`}
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
        <div className={`mobile-timer-pill ${isUrgent ? 'urgent' : ''}`} aria-hidden="true">
          <span className="mobile-timer-icon">⏱️</span>
          <span className="mobile-timer-digits font-mono">{formattedTime}</span>
        </div>
      </div>
    );
  }

  if (isCompact) {
    return (
      <div className={`timer-compact-pill ${isUrgent ? 'timer-urgent' : ''}`} role="timer" aria-live="polite">
        <span className="timer-icon" aria-hidden="true">⏱️</span>
        <span className="timer-digits font-mono">
          {isExpired ? t('timeUp') : `${mins > 0 ? `${mins}:` : ''}${secs < 10 && mins > 0 ? `0${secs}` : secs}s`}
        </span>
      </div>
    );
  }

  const timeFormatted = `${mins > 0 ? `${mins}:` : ''}${secs < 10 && mins > 0 ? `0${secs}` : secs} ${t('seconds')}`;

  return (
    <div className="timer-banner" role="timer" aria-live="polite">
      <div className="timer-header">
        <span>⏱️ {t('timeRemainingFull')}</span>
        <span className={`timer-clock ${isUrgent ? 'timer-urgent' : ''}`}>
          {isExpired ? t('timeUp') : timeFormatted}
        </span>
      </div>
      <div className="timer-track">
        <div
          className={`timer-fill ${isUrgent ? 'urgent' : ''}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
