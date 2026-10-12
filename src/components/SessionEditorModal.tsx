import React, { useState, useEffect } from 'react';
import { useT } from '../context/LocaleContext';
import { api, json } from '../api';
import { translateError } from '../i18n';
import { PresenterRow, PresenterRowEditor } from './session/PresenterRowEditor';

interface SessionEditorModalProps {
  sessionId: number;
  onClose: () => void;
  onSaved: () => void;
}

export function SessionEditorModal({ sessionId, onClose, onSaved }: SessionEditorModalProps) {
  const { t, language } = useT();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [title, setTitle] = useState('');
  const [sessionDate, setSessionDate] = useState('');
  const [courseName, setCourseName] = useState('');
  const [groupTitle, setGroupTitle] = useState('');
  const [presentations, setPresentations] = useState<PresenterRow[]>([]);
  const [newName, setNewName] = useState('');
  const [newTopic, setNewTopic] = useState('');

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError('');
    api(`/sessions/${sessionId}`)
      .then(data => {
        if (!mounted) return;
        setTitle(data.title || '');
        setSessionDate(data.session_date || new Date().toISOString().slice(0, 10));
        setCourseName(data.course_name || '');
        setGroupTitle(data.group_title || '');
        const rows = (data.presentations || []).map((p: any, idx: number) => ({
          id: p.id,
          presenter_name: p.presenter_name || '',
          title: p.title || '',
          status: p.status,
          vote_count: p.vote_count,
          position: idx
        }));
        setPresentations(rows);
        setLoading(false);
      })
      .catch(e => {
        if (!mounted) return;
        setError(translateError(e, language));
        setLoading(false);
      });
    return () => { mounted = false; };
  }, [sessionId, language]);

  const handleUpdatePresenter = (idx: number, field: 'presenter_name' | 'title', value: string) => {
    setPresentations(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: value };
      return copy;
    });
  };

  const handleMove = (idx: number, direction: 'up' | 'down') => {
    setPresentations(prev => {
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;
      const copy = [...prev];
      const temp = copy[idx];
      copy[idx] = copy[targetIdx];
      copy[targetIdx] = temp;
      return copy.map((p, i) => ({ ...p, position: i }));
    });
  };

  const handleRemove = (idx: number) => {
    setPresentations(prev => prev.filter((_, i) => i !== idx).map((p, i) => ({ ...p, position: i })));
  };

  const handleAddPresenter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setPresentations(prev => [
      ...prev,
      {
        presenter_name: newName.trim(),
        title: newTopic.trim(),
        position: prev.length
      }
    ]);
    setNewName('');
    setNewTopic('');
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await api(`/sessions/${sessionId}`, json('PUT', {
        title: title.trim() || null,
        session_date: sessionDate,
        presentations: presentations.map((p, i) => ({
          id: p.id,
          presenter_name: p.presenter_name.trim(),
          title: p.title.trim(),
          position: i
        }))
      }));
      setSaving(false);
      onSaved();
      onClose();
    } catch (e: any) {
      setSaving(false);
      setError(translateError(e, language));
    }
  };

  return (
    <div className="modal" role="dialog" aria-modal="true">
      <div className="card" style={{ maxWidth: 680, width: '95%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '.75rem', marginBottom: '1rem' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a' }}>
              ✏️ {t('editSessionModalTitle')}
            </h2>
            <p style={{ margin: '.25rem 0 0 0', fontSize: '.85rem', color: '#64748b' }}>
              {courseName ? `${courseName} · ` : ''}
              {groupTitle ? `[${groupTitle}] · ` : ''}
              {t('editSessionSubtitle')}
            </p>
          </div>
          <button type="button" className="secondary" style={{ padding: '.25rem .5rem', fontSize: '1rem', minWidth: 'auto' }} onClick={onClose}>
            ✕
          </button>
        </div>

        {error && <p className="error" role="alert" style={{ marginBottom: '.75rem' }}>{error}</p>}

        {loading ? (
          <p style={{ padding: '2rem 0', textAlign: 'center', color: '#64748b' }}>{t('loading')}</p>
        ) : (
          <div style={{ overflowY: 'auto', flex: 1, paddingRight: '.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '.3rem', fontSize: '.88rem', fontWeight: 600, color: '#334155' }}>
                {t('sessionTitle')}
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder={groupTitle || t('sessionTitle')}
                  maxLength={200}
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '.3rem', fontSize: '.88rem', fontWeight: 600, color: '#334155' }}>
                {t('sessionDate')}
                <input
                  type="date"
                  value={sessionDate}
                  onChange={e => setSessionDate(e.target.value)}
                  required
                />
              </label>
            </div>

            <div style={{ marginTop: '1rem' }}>
              <h3 style={{ margin: '0 0 .6rem 0', fontSize: '1rem', color: '#1e293b' }}>
                👥 {t('presentations')} ({presentations.length})
              </h3>

              {presentations.length === 0 ? (
                <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: 8, textAlign: 'center', color: '#64748b', fontSize: '.9rem', border: '1px dashed #cbd5e1' }}>
                  {t('noPresentersInSession')}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem', marginBottom: '1rem' }}>
                  {presentations.map((p, idx) => (
                    <PresenterRowEditor
                      key={p.id || `idx-${idx}`}
                      row={p}
                      index={idx}
                      total={presentations.length}
                      onUpdate={handleUpdatePresenter}
                      onMove={handleMove}
                      onRemove={handleRemove}
                    />
                  ))}
                </div>
              )}

              <form onSubmit={handleAddPresenter} style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr auto', gap: '.5rem', alignItems: 'center', background: '#f1f5f9', padding: '.75rem', borderRadius: 8, marginTop: '.75rem' }}>
                <input
                  type="text"
                  placeholder={`${t('presenterFullName')} *`}
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  required
                  style={{ padding: '.4rem .6rem', fontSize: '.88rem' }}
                />
                <input
                  type="text"
                  placeholder={t('presentationTopic')}
                  value={newTopic}
                  onChange={e => setNewTopic(e.target.value)}
                  style={{ padding: '.4rem .6rem', fontSize: '.88rem' }}
                />
                <button type="submit" className="primary" style={{ padding: '.4rem .85rem', fontSize: '.88rem', whiteSpace: 'nowrap' }}>
                  + {t('addPresenter')}
                </button>
              </form>
            </div>
          </div>
        )}

        <div className="actions" style={{ marginTop: '1.2rem', borderTop: '1px solid #e2e8f0', paddingTop: '.75rem', display: 'flex', justifyContent: 'flex-end', gap: '.6rem' }}>
          <button type="button" className="secondary" onClick={onClose} disabled={saving}>
            {t('cancel')}
          </button>
          <button type="button" className="primary" onClick={handleSave} disabled={saving || loading}>
            {saving ? '...' : `💾 ${t('saveSessionChanges')}`}
          </button>
        </div>
      </div>
    </div>
  );
}
