import React, { useState, useEffect, ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import PrivacyPolicyModal from './PrivacyPolicyModal';
import { checkPrivacyConsent, savePrivacyConsent } from '../services/firestore';
import { PRIVACY_POLICY_VERSION } from '../constants/privacyPolicy';

interface ConsentData {
  version: string;
  termsAgreed: boolean;
  dataCollectionAgreed: boolean;
  marketingAgreed: boolean;
}

interface PrivacyConsentGuardProps {
  children: ReactNode;
}

/**
 * 개인정보 동의 가드 컴포넌트
 *
 * 로그인한 사용자(교사)가 개인정보 처리방침에 동의했는지 확인하고,
 * 동의하지 않았다면 강제로 모달을 띄워 동의를 받습니다.
 *
 * Props:
 * - children: 동의 후 보여질 컴포넌트
 */
export default function PrivacyConsentGuard({ children }: PrivacyConsentGuardProps) {
  const { user, loading } = useAuth();
  const [hasConsent, setHasConsent] = useState<boolean | null>(null); // null: 확인 중, true: 동의함, false: 동의 안함
  const [showModal, setShowModal] = useState(false);
  const [isCheckingConsent, setIsCheckingConsent] = useState(true);
  const [hasDisagreed, setHasDisagreed] = useState(false); // 거부 여부

  // 동의 여부 확인
  useEffect(() => {
    const checkConsent = async () => {
      // 로그인하지 않았거나 로딩 중이면 체크하지 않음
      if (!user || loading) {
        setIsCheckingConsent(false);
        setHasConsent(true); // 로그인 전에는 가드를 통과
        return;
      }

      console.log('🔍 [PrivacyConsentGuard] 동의 여부 확인 시작...');
      setIsCheckingConsent(true);

      try {
        const consent = await checkPrivacyConsent(
          user.uid,
          PRIVACY_POLICY_VERSION
        );

        if (consent) {
          console.log('✅ [PrivacyConsentGuard] 동의 이력 있음:', consent);
          setHasConsent(true);
          setShowModal(false);
        } else {
          console.log('⚠️ [PrivacyConsentGuard] 동의 이력 없음 - 모달 표시');
          setHasConsent(false);
          setShowModal(true);
        }
      } catch (error) {
        console.error('❌ [PrivacyConsentGuard] 동의 확인 실패:', error);
        // 에러 발생 시 일단 모달 띄우기 (안전한 쪽으로)
        setHasConsent(false);
        setShowModal(true);
      } finally {
        setIsCheckingConsent(false);
      }
    };

    checkConsent();
  }, [user?.uid, loading]);

  // 동의 처리
  const handleAgree = async (consentData: ConsentData) => {
    if (!user) {
      console.error('❌ [PrivacyConsentGuard] user 없음');
      throw new Error('로그인 정보가 없습니다.');
    }

    console.log('📝 [PrivacyConsentGuard] 동의 처리 시작:', consentData);

    try {
      // Firestore에 동의 기록 저장
      await savePrivacyConsent({
        teacherId: user.uid,
        teacherEmail: user.email || '',
        consentType: 'teacher',
        version: consentData.version,
        termsAgreed: consentData.termsAgreed,
        dataCollectionAgreed: consentData.dataCollectionAgreed,
        marketingAgreed: consentData.marketingAgreed,
      });

      console.log('✅ [PrivacyConsentGuard] 동의 저장 완료');

      // 동의 완료 - 모달 닫기
      setHasConsent(true);
      setShowModal(false);
    } catch (error) {
      console.error('❌ [PrivacyConsentGuard] 동의 저장 실패:', error);
      throw error; // 모달에서 에러 처리하도록 전파
    }
  };

  // 거부 처리
  const handleDisagree = () => {
    console.log('⚠️ [PrivacyConsentGuard] 사용자가 동의를 거부함');
    setHasDisagreed(true);
    setShowModal(false);
  };

  // 로딩 중
  if (isCheckingConsent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-700 font-semibold">동의 이력 확인 중...</p>
        </div>
      </div>
    );
  }

  // 거부한 경우 - 사이트 이용 불가 페이지 표시
  if (hasDisagreed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="mb-6">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">서비스 이용 불가</h2>
            <p className="text-gray-600 leading-relaxed">
              개인정보 처리방침에 동의하지 않으셔서<br />
              서비스를 이용할 수 없습니다.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => {
                setHasDisagreed(false);
                setShowModal(true);
              }}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors"
            >
              다시 확인하기
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="w-full py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
            >
              메인으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 동의하지 않았으면 강제 모달 표시 (닫기 불가)
  // 중요: children을 렌더링하지 않아서 Firestore 쓰기 작업이 실행되지 않도록 함
  if (!hasConsent && user && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-8">
            <div className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">환영합니다!</h2>
            <p className="text-gray-600">
              서비스 이용을 위해 개인정보 처리방침에<br />
              동의가 필요합니다.
            </p>
          </div>
        </div>

        {/* 강제 모달 (닫기 불가) */}
        <PrivacyPolicyModal
          isOpen={showModal}
          onClose={null} // 닫기 불가
          onAgree={handleAgree}
          onDisagree={handleDisagree} // 거부 핸들러 추가
          canClose={false} // 강제 동의
        />
      </div>
    );
  }

  // 동의했거나 로그인하지 않았으면 정상 렌더링
  return <>{children}</>;
}
