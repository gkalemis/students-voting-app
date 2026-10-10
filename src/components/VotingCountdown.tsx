import React, { useEffect, useState, useRef } from 'react';
import { useT } from '../context/LocaleContext';

export function VotingCountdown({ closesAt, totalDuration = 60, onExpire }: { closesAt?: string; totalDuration?: number; onExpire?: () => void }) {
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
  const timeFormatted = `${mins > 0 ? `${mins}:` : ''}${secs < 10 && mins > 0 ? `0${secs}` : secs} ${t('seconds')}`;
  const percent = initialDiff > 0 ? Math.min(100, Math.max(0, (seconds / initialDiff) * 100)) : 0;
  const isUrgent = seconds <= 15 && seconds > 0;
  const isExpired = seconds === 0;

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
