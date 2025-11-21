import React, { useState } from 'react';
import { CompetitionEvent, EventType } from '../types';
import { Button } from './Button';
import { Plus, Trash2, Edit2, Save, X, Clock, Users, User, Users2 } from 'lucide-react';

interface SettingsViewProps {
  events: CompetitionEvent[];
  onUpdateEvents: (events: CompetitionEvent[]) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ events, onUpdateEvents }) => {
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [tempEvent, setTempEvent] = useState<Partial<CompetitionEvent>>({});

  const handleAddEvent = () => {
    const newEvent: CompetitionEvent = {
      id: `evt_${Date.now()}`,
      name: '새 종목',
      type: 'INDIVIDUAL',
      defaultTimeLimit: 60,
      defaultMaxParticipants: 0,
      description: '',
    };
    onUpdateEvents([...events, newEvent]);
    setIsEditing(newEvent.id);
    setTempEvent(newEvent);
  };

  const handleDeleteEvent = (id: string) => {
    if (confirm('정말로 이 종목을 삭제하시겠습니까? 기존 점수 데이터는 보존되지만 화면에 표시되지 않을 수 있습니다.')) {
      onUpdateEvents(events.filter(e => e.id !== id));
    }
  };

  const startEdit = (event: CompetitionEvent) => {
    setIsEditing(event.id);
    setTempEvent({ ...event });
  };

  const saveEdit = () => {
    if (!tempEvent.name) return alert('종목명은 필수입니다.');
    
    const updatedEvents = events.map(e => 
      e.id === isEditing ? { ...e, ...tempEvent } as CompetitionEvent : e
    );
    onUpdateEvents(updatedEvents);
    setIsEditing(null);
    setTempEvent({});
  };

  const cancelEdit = () => {
    setIsEditing(null);
    setTempEvent({});
  };

  return (
    <div className="flex-1 bg-slate-50 h-full overflow-y-auto p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">전체 설정</h2>
            <p className="text-slate-500 mt-1">대회에 사용할 모든 종목을 관리합니다.</p>
          </div>
          <Button onClick={handleAddEvent} className="gap-2">
            <Plus className="w-4 h-4" />
            종목 추가하기
          </Button>
        </div>

        <div className="grid gap-4">
          {events.map(event => (
            <div 
              key={event.id} 
              className={`bg-white rounded-xl p-6 shadow-sm border transition-all ${
                isEditing === event.id ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {isEditing === event.id ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">종목명</label>
                      <input 
                        type="text" 
                        value={tempEvent.name} 
                        onChange={e => setTempEvent(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder="예: 개인 줄넘기"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">경기 방식</label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setTempEvent(prev => ({ ...prev, type: 'INDIVIDUAL' }))}
                          className={`flex-1 px-3 py-2 text-sm rounded-lg border font-medium transition-colors ${
                            tempEvent.type === 'INDIVIDUAL' 
                              ? 'bg-indigo-50 border-indigo-500 text-indigo-700' 
                              : 'bg-white border-slate-200 text-slate-600'
                          }`}
                        >
                          개인전 (학생별 기록)
                        </button>
                        <button
                          onClick={() => setTempEvent(prev => ({ ...prev, type: 'TEAM' }))}
                          className={`flex-1 px-3 py-2 text-sm rounded-lg border font-medium transition-colors ${
                            tempEvent.type === 'TEAM' 
                              ? 'bg-indigo-50 border-indigo-500 text-indigo-700' 
                              : 'bg-white border-slate-200 text-slate-600'
                          }`}
                        >
                          단체전 (학급별 기록)
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">설명 (선택)</label>
                    <input 
                      type="text" 
                      value={tempEvent.description || ''} 
                      onChange={e => setTempEvent(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="간단한 설명"
                    />
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">기본 제한 시간 (초)</label>
                      <input 
                        type="number" 
                        value={tempEvent.defaultTimeLimit} 
                        onChange={e => setTempEvent(prev => ({ ...prev, defaultTimeLimit: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">기본 참가 인원 (명)</label>
                      <input 
                        type="number" 
                        value={tempEvent.defaultMaxParticipants} 
                        onChange={e => setTempEvent(prev => ({ ...prev, defaultMaxParticipants: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder="0 = 무제한"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="secondary" size="sm" onClick={cancelEdit}><X className="w-4 h-4 mr-1"/> 취소</Button>
                    <Button size="sm" onClick={saveEdit}><Save className="w-4 h-4 mr-1"/> 저장</Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${
                        event.type === 'INDIVIDUAL' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                      }`}>
                        {event.type === 'INDIVIDUAL' ? '개인전' : '단체전'}
                      </span>
                      <h3 className="text-lg font-bold text-slate-800">
                        {event.name}
                      </h3>
                    </div>
                    <p className="text-slate-500 text-sm mt-1">{event.description || '설명 없음'}</p>
                    <div className="flex gap-4 mt-3 text-xs text-slate-500 font-medium">
                      <span className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded">
                        <Clock className="w-3 h-3" /> {event.defaultTimeLimit > 0 ? `${event.defaultTimeLimit}초` : '시간 제한 없음'}
                      </span>
                      <span className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded">
                        <Users className="w-3 h-3" /> {event.defaultMaxParticipants > 0 ? `${event.defaultMaxParticipants}명` : '인원 제한 없음'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end md:self-center">
                    <Button variant="secondary" size="sm" onClick={() => startEdit(event)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => handleDeleteEvent(event.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};