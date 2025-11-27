import React, { useState, useRef, useEffect } from 'react';
import { Users, Settings, Trophy, ChevronLeft, ChevronRight, LogOut, Shield, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import PrivacyPolicyModal from './PrivacyPolicyModal';
import { savePrivacyConsent } from '../services/firestore';
import { PRIVACY_POLICY_VERSION } from '../constants/privacyPolicy';

interface SidebarProps {
  currentGrade: number | null;
  onSelectGrade: (grade: number) => void;
  onSelectSettings: () => void;
  isSettingsActive: boolean;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onClassManagementClick: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentGrade,
  onSelectGrade,
  onSelectSettings,
  isSettingsActive,
  isCollapsed,
  onToggleCollapse,
  onClassManagementClick,
}) => {
  const grades = [1, 2, 3, 4, 5, 6];
  const { user, logout } = useAuth();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isPWA, setIsPWA] = useState(false);

  // 화면 크기 감지
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // PWA 환경 감지
  useEffect(() => {
    const checkPWA = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches
        || (window.navigator as any).standalone === true;
      setIsPWA(isStandalone);
    };

    checkPWA();

    // display-mode 변경 감지
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    mediaQuery.addEventListener('change', checkPWA);

    return () => mediaQuery.removeEventListener('change', checkPWA);
  }, []);

  // PWA 새로고침 핸들러
  const handleRefresh = () => {
    // 서비스 워커 업데이트 후 페이지 새로고침
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => registration.update());
      });
    }
    window.location.reload();
  };

  // 외부 클릭 시 메뉴 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };

    if (isProfileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileMenuOpen]);

  const handleLogout = async () => {
    try {
      await logout();
      setIsProfileMenuOpen(false);
    } catch (error) {
      console.error('로그아웃 실패:', error);
      alert('로그아웃 중 오류가 발생했습니다.');
    }
  };

  const handlePrivacyAgree = async (consentData: any) => {
    if (!user) return;

    try {
      await savePrivacyConsent({
        teacherId: user.uid,
        teacherEmail: user.email || '',
        version: consentData.version,
        termsAgreed: consentData.termsAgreed,
        dataCollectionAgreed: consentData.dataCollectionAgreed,
        marketingAgreed: consentData.marketingAgreed,
      });
      setShowPrivacyModal(false);
    } catch (error) {
      console.error('동의 저장 실패:', error);
      throw error;
    }
  };

  return (
    <div className={`${isCollapsed ? 'w-20' : 'w-64'} bg-white border-r border-slate-200 flex flex-col h-[100dvh] flex-shrink-0 shadow-sm z-10 transition-all duration-300 overflow-hidden`}>
      <div className={`${isCollapsed ? 'p-3' : 'p-3 md:p-4'} border-b border-slate-100 flex items-center justify-between gap-2 relative flex-shrink-0`}>
        <div className="bg-indigo-600 p-1.5 md:p-2 rounded-lg flex-shrink-0">
          <Trophy className="w-5 h-5 md:w-6 md:h-6 text-white" />
        </div>
        {!isCollapsed && (
          <h1 className="font-bold text-base md:text-lg text-slate-800 tracking-tight whitespace-nowrap truncate flex-1">줄넘기 대회</h1>
        )}
        <div className="flex items-center gap-1">
          {/* PWA 새로고침 버튼 */}
          {isPWA && (
            <button
              onClick={handleRefresh}
              className="flex-shrink-0 p-1.5 rounded-md hover:bg-slate-100 active:bg-slate-200 text-slate-400 hover:text-indigo-600 transition-colors touch-manipulation"
              title="새로고침"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onToggleCollapse}
            className={`flex-shrink-0 p-1.5 rounded-md hover:bg-slate-100 active:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors touch-manipulation`}
            title={isCollapsed ? '펼치기' : '접기'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-3 md:py-4 px-2 md:px-3 space-y-1 min-h-0 pb-0">
        {!isCollapsed && (
          <div className="px-3 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            학년별 관리
          </div>
        )}
        {grades.map((grade) => (
          <button
            key={grade}
            onClick={() => onSelectGrade(grade)}
            className={`w-full flex items-center justify-center ${isCollapsed ? 'px-2 py-3.5' : 'gap-3 px-4 py-3.5'} rounded-lg text-sm font-medium transition-all touch-manipulation min-h-[44px] ${
              !isSettingsActive && currentGrade === grade
                ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200 shadow-sm'
                : 'text-slate-600 hover:bg-slate-50 active:bg-slate-100 hover:text-slate-900'
            }`}
            title={isCollapsed ? `${grade}학년` : ''}
          >
            {isCollapsed ? (
              <span className="text-sm font-semibold">{grade}학년</span>
            ) : (
              <>
                <Users className={`w-5 h-5 flex-shrink-0 ${!isSettingsActive && currentGrade === grade ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span>{grade}학년</span>
              </>
            )}
          </button>
        ))}
      </div>

      {/* 사용자 프로필 섹션 */}
      {user && (
        <div className={`${isCollapsed ? 'p-2 pb-4' : 'p-3 md:p-4 pb-4'} mt-auto border-t border-slate-100 relative flex-shrink-0 bg-white`} ref={profileMenuRef}>
          <button
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center px-2' : 'gap-2 md:gap-3 px-3'} py-2.5 md:py-3 rounded-lg text-sm transition-all hover:bg-slate-50 active:bg-slate-100 group touch-manipulation min-h-[50px]`}
            title={isCollapsed ? user.displayName || user.email || '사용자' : ''}
          >
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt="프로필"
                className="w-8 h-8 md:w-9 md:h-9 rounded-full flex-shrink-0 border-2 border-slate-200 group-hover:border-indigo-300 transition-colors"
              />
            ) : (
              <div className="w-8 h-8 md:w-9 md:h-9 rounded-full flex-shrink-0 bg-indigo-100 flex items-center justify-center">
                <span className="text-sm font-semibold text-indigo-600">
                  {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                </span>
              </div>
            )}
            {!isCollapsed && (
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">
                  {user.displayName || '사용자'}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {user.email}
                </p>
              </div>
            )}
          </button>

          {/* 드롭업 메뉴 */}
          {isProfileMenuOpen && (
            <div className={`absolute ${isCollapsed ? 'left-full ml-2 bottom-0' : 'left-2 right-2 md:left-4 md:right-4 bottom-full mb-2'} bg-white rounded-lg shadow-xl border border-slate-200 py-2 z-50 min-w-[200px] max-w-[280px]`}>
              {/* 🆕 학급 관리 버튼 */}
              <button
                onClick={() => {
                  setIsProfileMenuOpen(false);
                  onClassManagementClick();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors touch-manipulation"
              >
                <Users className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span>학급 관리</span>
              </button>
              <div className="h-px bg-slate-100 my-1"></div>
              <button
                onClick={() => {
                  setIsProfileMenuOpen(false);
                  onSelectSettings();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors touch-manipulation"
              >
                <Settings className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span>종목 설정</span>
              </button>
              <div className="h-px bg-slate-100 my-1"></div>
              <button
                onClick={() => {
                  setIsProfileMenuOpen(false);
                  setShowPrivacyModal(true);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors touch-manipulation"
              >
                <Shield className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span>개인정보 처리방침</span>
              </button>
              <div className="h-px bg-slate-100 my-1"></div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 active:bg-red-100 transition-colors touch-manipulation"
              >
                <LogOut className="w-4 h-4 flex-shrink-0" />
                <span>로그아웃</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* 개인정보 처리방침 모달 */}
      <PrivacyPolicyModal
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
        onAgree={handlePrivacyAgree}
        canClose={true}
      />
    </div>
  );
};