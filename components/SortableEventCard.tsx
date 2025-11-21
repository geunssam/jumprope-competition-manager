import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CompetitionEvent } from '../types';
import { GripVertical, Copy, Trash2 } from 'lucide-react';

interface SortableEventCardProps {
  event: CompetitionEvent;
  onCopy: (event: CompetitionEvent) => void;
  onDelete: (eventId: string) => void;
  onClick?: (event: CompetitionEvent) => void;
}

export const SortableEventCard: React.FC<SortableEventCardProps> = ({
  event,
  onCopy,
  onDelete,
  onClick,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: event.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => onClick?.(event)}
      className={`inline-flex items-center gap-2 bg-white/50 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-indigo-200 hover:bg-white/70 transition-colors cursor-pointer ${
        isDragging ? 'ring-2 ring-indigo-500 shadow-lg' : ''
      }`}
      title="클릭하여 출전 인원/팀 구성 수정"
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 transition-colors"
        title="드래그하여 순서 변경"
      >
        <GripVertical className="w-4 h-4" />
      </button>

      {/* Event Type Badge */}
      <span
        className={`text-[10px] px-2 py-0.5 rounded font-bold ${
          event.type === 'TEAM'
            ? 'bg-purple-200 text-purple-800'
            : event.type === 'PAIR'
            ? 'bg-green-200 text-green-800'
            : 'bg-blue-200 text-blue-800'
        }`}
      >
        {event.type === 'TEAM' ? '단체' : event.type === 'PAIR' ? '짝' : '개인'}
      </span>

      {/* Event Name */}
      <span className="text-sm font-bold text-indigo-900">{event.name}</span>

      {/* Action Buttons */}
      <div className="flex items-center gap-1 ml-auto">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onCopy(event);
          }}
          className="text-indigo-600/70 hover:text-indigo-700 hover:bg-indigo-200/50 rounded p-0.5 transition-colors"
          title="복사"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(event.id);
          }}
          className="text-red-600/70 hover:text-red-700 hover:bg-red-200/50 rounded p-0.5 transition-colors"
          title="삭제"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
