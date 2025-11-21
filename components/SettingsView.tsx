import React, { useState } from 'react';
import { CompetitionEvent, EventType } from '../types';
import { Button } from './Button';
import { Plus, Trash2, Edit2, Save, X, Clock, Users, Copy } from 'lucide-react';

interface SettingsViewProps {
  events: CompetitionEvent[];
  onUpdateEvents: (events: CompetitionEvent[]) => void;
}

type EventSubTab = 'INDIVIDUAL' | 'PAIR' | 'TEAM';

export const SettingsView: React.FC<SettingsViewProps> = ({ events, onUpdateEvents }) => {
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [tempEvent, setTempEvent] = useState<Partial<CompetitionEvent>>({});
  const [activeTab, setActiveTab] = useState<EventSubTab>('INDIVIDUAL');

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

  const handleCopyEvent = (event: CompetitionEvent) => {
    // 1. 패턴 추출: "긴줄넘기 2" → "긴줄넘기"
    const namePattern = event.name.replace(/\s*\d+$/, '').trim();

    // 2. 같은 패턴으로 시작하는 종목들 찾기
    const regex = new RegExp(`^${namePattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\s+\\d+)?$`);
    const relatedEvents = events.filter(e => regex.test(e.name));

    // 3. 가장 큰 번호 찾기
    let maxNumber = 0;
    relatedEvents.forEach(e => {
      const match = e.name.match(/(\d+)$/);
      if (match) {
        const num = parseInt(match[1]);
        if (num > maxNumber) maxNumber = num;
      }
    });

    // 4. 새 이름 생성
    const newName = maxNumber === 0 && relatedEvents.length === 1
      ? `${namePattern} 2`  // 원본이 번호 없으면 "2" 추가
      : `${namePattern} ${maxNumber + 1}`;  // 최대 번호 + 1

    // 5. 새 종목 생성 (고유 ID)
    const newEvent: CompetitionEvent = {
      ...event,
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: newName,
    };

    // 6. 원본 바로 다음에 삽입
    const originalIndex = events.findIndex(e => e.id === event.id);
    const newEvents = [
      ...events.slice(0, originalIndex + 1),
      newEvent,
      ...events.slice(originalIndex + 1)
    ];

    onUpdateEvents(newEvents);
  };

  // Filter events by type
  const individualEvents = events.filter(e => e.type === 'INDIVIDUAL');
  const pairEvents = events.filter(e => e.type === 'PAIR');
  const teamEvents = events.filter(e => e.type === 'TEAM');

  // Get current events based on active tab
  const currentEvents =
    activeTab === 'INDIVIDUAL' ? individualEvents :
    activeTab === 'PAIR' ? pairEvents :
    teamEvents;

  const eventTabs: { id: EventSubTab; label: string; count: number }[] = [
    { id: 'INDIVIDUAL', label: '개인', count: individualEvents.length },
    { id: 'PAIR', label: '짝', count: pairEvents.length },
    { id: 'TEAM', label: '단체', count: teamEvents.length },
  ];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-6">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">종목 관리</h2>
            <p className="text-slate-500 mt-1">대회에 사용할 모든 종목을 관리합니다.</p>
          </div>
          <Button onClick={handleAddEvent} className="gap-2">
            <Plus className="w-4 h-4" />
            종목 추가
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 bg-white px-8">
        <div className="max-w-6xl mx-auto w-full flex">
          {eventTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                activeTab === tab.id
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-slate-100 text-slate-500'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-slate-900">
              {activeTab === 'INDIVIDUAL' && '개인 종목'}
              {activeTab === 'PAIR' && '짝 종목'}
              {activeTab === 'TEAM' && '단체 종목'}
            </h3>
            <p className="text-slate-500 mt-1">
              {activeTab === 'INDIVIDUAL' && '각 학생이 개별적으로 참가하는 종목입니다.'}
              {activeTab === 'PAIR' && '2명이 한 조가 되어 참가하는 종목입니다.'}
              {activeTab === 'TEAM' && '여러 명이 팀으로 참가하는 종목입니다.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentEvents.map(event => (
              <div
                key={event.id}
                className={`bg-white rounded-lg p-4 shadow-sm border transition-all ${
                  isEditing === event.id ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {isEditing === event.id ? (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-1">종목명</label>
                        <input
                          type="text"
                          value={tempEvent.name}
                          onChange={e => setTempEvent(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-2 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                          placeholder="예: 개인 줄넘기"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-1">경기 방식</label>
                        <div className="grid grid-cols-3 gap-1">
                          <button
                            onClick={() => setTempEvent(prev => ({ ...prev, type: 'INDIVIDUAL' }))}
                            className={`px-2 py-1.5 text-[10px] rounded border font-bold transition-colors ${
                              tempEvent.type === 'INDIVIDUAL'
                                ? 'bg-blue-50 border-blue-500 text-blue-700'
                                : 'bg-white border-slate-200 text-slate-600'
                            }`}
                          >
                            개인
                          </button>
                          <button
                            onClick={() => setTempEvent(prev => ({ ...prev, type: 'PAIR' }))}
                            className={`px-2 py-1.5 text-[10px] rounded border font-bold transition-colors ${
                              tempEvent.type === 'PAIR'
                                ? 'bg-green-50 border-green-500 text-green-700'
                                : 'bg-white border-slate-200 text-slate-600'
                            }`}
                          >
                            짝
                          </button>
                          <button
                            onClick={() => setTempEvent(prev => ({ ...prev, type: 'TEAM' }))}
                            className={`px-2 py-1.5 text-[10px] rounded border font-bold transition-colors ${
                              tempEvent.type === 'TEAM'
                                ? 'bg-purple-50 border-purple-500 text-purple-700'
                                : 'bg-white border-slate-200 text-slate-600'
                            }`}
                          >
                            단체
                          </button>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-1">설명</label>
                      <input
                        type="text"
                        value={tempEvent.description || ''}
                        onChange={e => setTempEvent(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full px-2 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder="간단한 설명"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-1">시간 (초)</label>
                        <input
                          type="number"
                          value={tempEvent.defaultTimeLimit}
                          onChange={e => setTempEvent(prev => ({ ...prev, defaultTimeLimit: parseInt(e.target.value) || 0 }))}
                          className="w-full px-2 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-1">인원 (명)</label>
                        <input
                          type="number"
                          value={tempEvent.defaultMaxParticipants}
                          onChange={e => setTempEvent(prev => ({ ...prev, defaultMaxParticipants: parseInt(e.target.value) || 0 }))}
                          className="w-full px-2 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                          placeholder="0=무제한"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <Button variant="secondary" size="sm" onClick={cancelEdit}>
                        <X className="w-3 h-3" />
                      </Button>
                      <Button size="sm" onClick={saveEdit}>
                        <Save className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                          event.type === 'TEAM' ? 'bg-purple-100 text-purple-700' :
                          event.type === 'PAIR' ? 'bg-green-100 text-green-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {event.type === 'TEAM' ? '단체' : event.type === 'PAIR' ? '짝' : '개인'}
                        </span>
                        <h3 className="text-base font-bold text-slate-800 truncate">
                          {event.name}
                        </h3>
                      </div>
                      {event.description && (
                        <p className="text-xs text-slate-500 line-clamp-2">{event.description}</p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded text-[10px] text-slate-600 font-medium">
                          <Clock className="w-3 h-3" /> {event.defaultTimeLimit > 0 ? `${event.defaultTimeLimit}초` : '무제한'}
                        </span>
                        <span className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded text-[10px] text-slate-600 font-medium">
                          <Users className="w-3 h-3" /> {event.defaultMaxParticipants > 0 ? `${event.defaultMaxParticipants}명` : '무제한'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="secondary" size="sm" onClick={() => startEdit(event)} className="flex-1">
                        <Edit2 className="w-3 h-3 mr-1" />
                        <span className="text-xs">수정</span>
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => handleCopyEvent(event)} title="이 종목을 복사합니다">
                        <Copy className="w-3 h-3" />
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => handleDeleteEvent(event.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
