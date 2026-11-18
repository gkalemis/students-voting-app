import React from 'react';
import { useT } from '../../../context/LocaleContext';
import { useEscapeKey } from '../../../hooks/useEscapeKey';

interface ConfirmModalData {
  path: string;
  label: string;
  verb: 'delete' | 'archive';
  isGroup?: boolean;
}

interface AdminRemovalConfirmModalProps {
  confirmModal: ConfirmModalData;
  busyAction: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function AdminRemovalConfirmModal({
  confirmModal,
  busyAction,
  onConfirm,
  onClose
}: AdminRemovalConfirmModalProps) {
  const { t } = useT();
  useEscapeKey(() => { if (!busyAction) onClose(); });

  return (
    <div className="modal" role="dialog" aria-modal="true" onClick={() => { if (!busyAction) onClose(); }}>
      <div className="card" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
        <h2>{confirmModal.verb === 'archive' ? t('confirmArchive') : t('confirmDelete')}</h2>
        <p style={{ margin: '.8rem 0', fontSize: '.95rem' }}>
          <b>{confirmModal.label}</b>
        </p>
        {confirmModal.isGroup && confirmModal.verb === 'delete' && (
          <p
            style={{
              color: '#b91c1c',
              fontSize: '0.84rem',
              fontWeight: 650,
              background: '#fef2f2',
              border: '1px solid #fecaca',
              padding: '0.45rem 0.65rem',
              borderRadius: 6,
              margin: '0.6rem 0'
            }}
          >
            ⚠️ {t('deleteGroupCascadeNotice')}
          </p>
        )}
        <div className="actions" style={{ marginTop: '1.2rem' }}>
          <button
            className={confirmModal.verb === 'archive' ? 'secondary' : 'danger'}
            disabled={busyAction}
            onClick={onConfirm}
          >
            {confirmModal.verb === 'archive' ? t('archiveAction') : t('delete')}
          </button>
          <button
            type="button"
            className="secondary"
            disabled={busyAction}
            onClick={onClose}
          >
            {t('cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}
