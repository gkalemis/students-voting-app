import React from 'react';
import { PollQuestionType } from '../../pollTypes';
import { useT } from '../../context/LocaleContext';

export interface DraftQuestion {
  id?: number;
  text: string;
  type: PollQuestionType;
  options: string[];
  correct_option_index: number | null;
}

interface Props {
  q: DraftQuestion;
  qIdx: number;
  totalQuestions: number;
  onUpdateText: (text: string) => void;
  onUpdateType: (type: PollQuestionType) => void;
  onUpdateOption: (optIdx: number, val: string) => void;
  onAddOption: () => void;
  onRemoveOption: (optIdx: number) => void;
  onSetCorrectOption: (optIdx: number | null) => void;
  onRemoveQuestion: () => void;
}

export function PollQuestionEditorRow({
  q,
  qIdx,
  totalQuestions,
  onUpdateText,
  onUpdateType,
  onUpdateOption,
  onAddOption,
  onRemoveOption,
  onSetCorrectOption,
  onRemoveQuestion
}: Props) {
  const { t, language } = useT();
  const isTF = q.type === 'TRUE_FALSE';

  return (
    <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '0.75rem', padding: '1rem', marginBottom: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <span style={{ fontWeight: 800, fontSize: '1rem', color: '#2563eb' }}>
          {language === 'el' ? `Ερώτηση #${qIdx + 1}` : `Question #${qIdx + 1}`}
        </span>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <select
            value={q.type}
            onChange={e => onUpdateType(e.target.value as PollQuestionType)}
            style={{ width: 'auto', padding: '0.3rem 0.6rem', fontSize: '0.85rem' }}
          >
            <option value="MULTIPLE_CHOICE">{t('multipleChoice')}</option>
            <option value="TRUE_FALSE">{t('trueFalse')}</option>
          </select>
          {totalQuestions > 1 && (
            <button
              type="button"
              onClick={onRemoveQuestion}
              className="outline danger"
              style={{ padding: '0.25rem 0.55rem', fontSize: '0.8rem', minHeight: 'auto' }}
              aria-label={`${t('delete')} #${qIdx + 1}`}
              title={t('delete')}
            >
              🗑️
            </button>
          )}
        </div>
      </div>

      <textarea
        rows={2}
        value={q.text}
        onChange={e => onUpdateText(e.target.value)}
        placeholder={language === 'el' ? 'Κείμενο ερώτησης...' : 'Question text...'}
        required
        style={{ marginBottom: '0.75rem', width: '100%', resize: 'vertical', fontWeight: 600, fontSize: '0.95rem' }}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.2rem' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569' }}>
            {t('options')} ({language === 'el' ? 'επιλέξτε το κυκλάκι για τη σωστή απάντηση' : 'select radio for correct answer'}):
          </span>
          <div
            onClick={() => onSetCorrectOption(null)}
            style={{ fontSize: '0.8rem', color: '#334155', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontWeight: 600, background: '#e2e8f0', padding: '0.2rem 0.6rem', borderRadius: '999px' }}
          >
            <input
              type="radio"
              name={`correct_${qIdx}`}
              checked={q.correct_option_index === null}
              onChange={() => onSetCorrectOption(null)}
              style={{ width: '16px', height: '16px', margin: 0, flexShrink: 0, cursor: 'pointer' }}
            />
            <span>{language === 'el' ? 'Χωρίς σωστή (Δημοσκόπηση)' : 'No correct answer (Poll)'}</span>
          </div>
        </div>

        {q.options.map((opt, optIdx) => {
          const isCorrect = q.correct_option_index === optIdx;
          const letter = isTF ? (optIdx === 0 ? '✓' : '✗') : ['Α', 'Β', 'Γ', 'Δ', 'Ε', 'Ζ', 'Η', 'Θ'][optIdx] || String(optIdx + 1);
          return (
            <div
              key={optIdx}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                width: '100%',
                background: isCorrect ? '#ecfdf5' : '#ffffff',
                padding: '0.35rem 0.5rem',
                borderRadius: '0.5rem',
                border: isCorrect ? '1.5px solid #10b981' : '1px solid #e2e8f0'
              }}
            >
              <input
                type="radio"
                name={`correct_${qIdx}`}
                checked={isCorrect}
                onChange={() => onSetCorrectOption(optIdx)}
                title={t('correctAnswer')}
                style={{ width: '18px', height: '18px', margin: 0, flexShrink: 0, cursor: 'pointer', accentColor: '#10b981' }}
              />
              <span style={{ fontSize: '0.9rem', fontWeight: 800, color: isCorrect ? '#047857' : '#334155', minWidth: '22px', textAlign: 'center', flexShrink: 0 }}>
                {letter}.
              </span>
              <input
                type="text"
                value={opt}
                onChange={e => onUpdateOption(optIdx, e.target.value)}
                disabled={isTF}
                placeholder={language === 'el' ? `Κείμενο επιλογής ${letter}...` : `Option ${letter} text...`}
                style={{
                  flex: '1 1 auto',
                  width: '100%',
                  minWidth: 0,
                  padding: '0.45rem 0.65rem',
                  fontSize: '0.92rem',
                  background: isTF ? '#f1f5f9' : '#ffffff',
                  border: '1px solid #cbd5e1'
                }}
              />
              {!isTF && q.options.length > 2 && (
                <button
                  type="button"
                  onClick={() => onRemoveOption(optIdx)}
                  className="outline"
                  style={{ width: 'auto', flexShrink: 0, padding: '0.25rem 0.55rem', minHeight: 'auto', fontSize: '0.8rem', color: '#dc2626', borderColor: '#fca5a5', background: '#fff' }}
                  aria-label={`${t('delete')} ${letter}`}
                  title={t('delete')}
                >
                  ✕
                </button>
              )}
            </div>
          );
        })}

        {!isTF && q.options.length < 8 && (
          <div style={{ marginTop: '0.35rem' }}>
            <button
              type="button"
              onClick={onAddOption}
              className="outline"
              style={{ width: 'auto', padding: '0.3rem 0.75rem', minHeight: 'auto', fontSize: '0.82rem', color: '#2563eb', borderColor: '#93c5fd', background: '#eff6ff' }}
            >
              + {language === 'el' ? 'Προσθήκη Επιλογής' : 'Add Option'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
