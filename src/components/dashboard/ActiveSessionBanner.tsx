import React from 'react';
import { Link } from 'react-router-dom';
import { useT } from '../../context/LocaleContext';
import { toGreekUppercase } from '../../utils/greek';
import { translateStatus } from '../../i18n';
import { SessionItem } from '../../types';

interface Props {
  session: SessionItem;
}

export function ActiveSessionBanner({ session }: Props) {
  const { t, language } = useT();
  const isActive = session.status === 'ACTIVE';

  return (
    <div
      className="card"
      style={{
        background: isActive ? '#eff6ff' : '#fef3c7',
        border: isActive ? '1px solid #3b82f6' : '1px solid #f59e0b',
        borderLeft: isActive ? '5px solid #2563eb' : '5px solid #d97706',
        padding: '1.25rem',
        margin: '1rem 0 1.5rem 0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '1.4rem' }}>{isActive ? '🚀' : '⏳'}</span>
          <strong style={{ fontSize: '1.1rem', color: isActive ? '#1e3a8a' : '#78350f' }}>
            {t('openSessionBanner')}: {session.title || session.session_date}
          </strong>
          <span className={`pill ${session.status.toLowerCase()}`} lang="el">
            {toGreekUppercase(translateStatus(session.status, t))}
          </span>
        </div>
        <p style={{ margin: '.4rem 0 0 0', color: isActive ? '#1e40af' : '#92400e', fontSize: '.9rem' }}>
          {session.course_name ? `${session.course_name} · ` : ''}
          {session.group_title ? `${session.group_title} · ` : ''}
          {session.session_date}
          {session.status === 'COMPLETED'
            ? ` — ${language === 'el' ? 'Εκκρεμεί αρχειοθέτηση για να ανοίξει η επόμενη συνεδρία.' : 'Pending archive to unlock next session.'}`
            : ` — ${language === 'el' ? 'Μόνο μία συνεδρία μπορεί να είναι ενεργή ανά πάσα στιγμή.' : 'Only one session can be active at a time.'}`}
        </p>
      </div>

      <div style={{ display: 'flex', gap: '.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
        {session.public_id && (
          <button
            type="button"
            className="btn-student-phone-preview"
            onClick={() => window.open(`/join/${session.public_id}`, '_blank', 'noopener,noreferrer')}
            title={language === 'el' ? 'Προβολή της οθόνης φοιτητή στο κινητό σε νέα καρτέλα' : 'Open new tab with student phone view'}
          >
            <span>📱</span>
            <span>{language === 'el' ? 'Προβολή Κινητού (Demo)' : 'Student Phone View (Demo)'}</span>
          </button>
        )}
        <Link to={`/session/${session.id}`} className="button primary" style={{ fontWeight: 600 }}>
          🚀 {t('goToOpenSession')}
        </Link>
      </div>
    </div>
  );
}
