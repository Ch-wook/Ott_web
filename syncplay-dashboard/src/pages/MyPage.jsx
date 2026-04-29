import React, { useState, useEffect } from 'react';
import { User, LogOut, Heart, PlayCircle, Clock, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const OTT_LIST = [
  { id: 'netflix', name: 'Netflix', color: 'bg-red-600' },
  { id: 'tving', name: 'TVING', color: 'bg-red-500' },
  { id: 'disneyplus', name: 'Disney+', color: 'bg-blue-700' },
  { id: 'coupang', name: 'Coupang Play', color: 'bg-sky-500' },
  { id: 'wavve', name: 'Wavve', color: 'bg-blue-500' },
];

const MyPage = () => {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState({ name: '', email: '' });
  const [recentHistory, setRecentHistory] = useState([]);
  const [mySubscriptions, setMySubscriptions] = useState([]);

  useEffect(() => {
    // 1. 로그인 정보 가져오기
    const savedUser = JSON.parse(localStorage.getItem('user'));
    if (savedUser) {
      setUserInfo({ name: savedUser.name, email: savedUser.email });
      // 이메일이 있으면 서버에서 구독 정보 불러오기
      fetchSubscriptions(savedUser.email);
    }

    // 2. 최근 시청 기록 불러오기 (15초 갱신)
    const fetchHistory = async () => {
      try {
        const response = await fetch('http://localhost:8080/api/history');
        if (response.ok) {
          const data = await response.json();
          setRecentHistory(data.reverse().slice(0, 3)); 
        }
      } catch (error) {
        console.error("기록 로드 실패:", error);
      }
    };

    fetchHistory();
    const interval = setInterval(fetchHistory, 15000);
    return () => clearInterval(interval);
  }, []);

  // 서버에서 내 구독 정보 가져오기
  const fetchSubscriptions = async (email) => {
    try {
      const response = await fetch(`http://localhost:8080/api/users/subscriptions?email=${encodeURIComponent(email)}`);
      if (response.ok) {
        const data = await response.json();
        setMySubscriptions(data.subscriptions || []);
      }
    } catch (error) {
      console.error("구독 정보 불러오기 실패:", error);
    }
  };

  // 구독 플랫폼 선택/해제 시 서버에 저장하기
  const toggleSubscription = async (ottId) => {
    if (!userInfo.email) {
      alert("이메일 정보가 없어 구독 상태를 저장할 수 없습니다.");
      return;
    }

    let updatedSubs;
    if (mySubscriptions.includes(ottId)) {
      updatedSubs = mySubscriptions.filter(id => id !== ottId); // 해제
    } else {
      updatedSubs = [...mySubscriptions, ottId]; // 선택
    }
    
    // 화면에 먼저 즉시 반영
    setMySubscriptions(updatedSubs);

    // 백엔드 서버에 업데이트 요청
    try {
      await fetch(`http://localhost:8080/api/users/subscriptions?email=${encodeURIComponent(userInfo.email)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptions: updatedSubs })
      });
    } catch (error) {
      console.error("구독 정보 업데이트 실패:", error);
      alert("구독 정보를 저장하는 데 실패했습니다.");
    }
  };

  const handleLogout = () => {
    if (window.confirm("로그아웃 하시겠습니까?")) {
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('user');
      navigate('/login');
    }
  };

  return (
    <div className="w-full">
      <div className="max-w-4xl">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8 flex items-center gap-6">
          <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg">
            <User size={48} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{userInfo.name || '민우'} 님</h2>
            <p className="text-gray-500 font-medium">이메일: {userInfo.email || '정보 없음'}</p>
          </div>
        </div>

        {/* 나의 구독 플랫폼 관리 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
          <h3 className="text-lg font-bold text-gray-800 mb-4">내 구독 플랫폼 관리</h3>
          <p className="text-sm text-gray-500 mb-6">현재 구독 중인 OTT를 선택해두시면, 검색 시 시청 가능한 플랫폼을 빠르게 안내해 드립니다.</p>
          <div className="flex flex-wrap gap-3">
            {OTT_LIST.map((ott) => {
              const isSubscribed = mySubscriptions.includes(ott.id);
              return (
                <button
                  key={ott.id}
                  onClick={() => toggleSubscription(ott.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 border-2 
                    ${isSubscribed ? `${ott.color} text-white border-transparent shadow-md` : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}
                >
                  {isSubscribed && <CheckCircle2 size={16} />}
                  {ott.name}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-4 text-pink-500">
              <Heart size={20} />
              <span className="font-bold">찜한 콘텐츠</span>
            </div>
            <p className="text-gray-400 text-sm">아직 찜한 영화가 없습니다. (검색 페이지에서 추가해보세요!)</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-4 text-blue-500">
              <PlayCircle size={20} />
              <span className="font-bold">최근 시청 기록</span>
            </div>
            {recentHistory.length > 0 ? (
              <div className="space-y-4">
                {recentHistory.map((item) => (
                  <div key={item.id} className="flex items-center justify-between group cursor-pointer" onClick={() => navigate(item.subTitle ? '/tv' : '/movies')}>
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-800 text-sm line-clamp-1">{item.title}</span>
                      <span className="text-xs text-gray-500 mt-1">
                        {item.subTitle || '영화'} · <span className="text-blue-600 font-medium">{item.progress}%</span> 시청
                      </span>
                    </div>
                    <Clock size={16} className="text-gray-300 group-hover:text-blue-500 transition-colors ml-4 shrink-0" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">시청 중인 콘텐츠가 없습니다.</p>
            )}
          </div>
        </div>

        <button onClick={handleLogout} className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-600 rounded-2xl font-bold hover:bg-red-100 transition-all active:scale-95 shadow-sm">
          <LogOut size={20} /> 로그아웃
        </button>
      </div>
    </div>
  );
};

export default MyPage;