import React from 'react';
import { PresentationCard } from './PresentationCard';

interface Props {
  presentations: any[];
  sessionStatus: string;
  isArchived: boolean;
  onMove: (item: any, dir: 'UP' | 'DOWN') => void;
  onEdit: (item: any) => void;
  onDelete: (item: any) => void;
  onAct: (path: string, body?: any) => void;
}

export function PresentationList({
  presentations,
  sessionStatus,
  isArchived,
  onMove,
  onEdit,
  onDelete,
  onAct
}: Props) {
  const pending = (presentations || []).filter((x: any) => x.status === 'PENDING');

  return (
    <div className="list">
      {(presentations || []).map((p: any, idx: number) => {
        const pIdx = pending.findIndex((x: any) => x.id === p.id);
        return (
          <PresentationCard
            key={p.id}
            item={p}
            index={idx}
            sessionStatus={sessionStatus}
            isArchived={isArchived}
            canMoveUp={p.status === 'PENDING' && pIdx > 0}
            canMoveDown={p.status === 'PENDING' && pIdx < pending.length - 1}
            onMove={onMove}
            onEdit={onEdit}
            onDelete={onDelete}
            onAct={onAct}
          />
        );
      })}
    </div>
  );
}
