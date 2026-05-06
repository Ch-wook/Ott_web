import React, { useState, useEffect } from 'react';
import { User, LogOut, Heart, PlayCircle, Clock, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TMDB_ACCESS_TOKEN = import.meta.env.VITE_TMDB_ACCESS_TOKEN;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

const OTT_LOGOS = {
  "Netflix":            "/logos/netflix.png",
  "TVING":              "/logos/tving.png",
  "Disney+":            "/logos/disneyplus.svg",
  "Coupang Play":       "/logos/coupangplay.png",
  "Wavve":              "/logos/wavve.png",
  "왓챠":               "/logos/watcha.png",
  "Apple TV+":          "/logos/appletv.png",
  "Amazon Prime Video": "/logos/amazonprime.png",
};

const OTT_LIST = [
  { id: 'netflix',          name: 'Netflix' },
  { id: 'tving',            name: 'TVING' },
  { id: 'disneyplus',       name: 'Disney+' },
  { id: 'coupangplay',      name: 'Coupang Play' },
  { id: 'wavve',            name: 'Wavve' },
  { id: 'watcha',           name: '왓챠' },
  { id: 'appletv',          name: 'Apple TV+' },
  { id: 'amazonprimevideo', name: 'Amazon Prime Video' },
];

const MyPage = ({ isDarkMode }) => {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState({ name: '', email: '' });
  const [recentHistory, setRecentHistory] = useState([]);
  const [mySubscriptions, setMySubscriptions] = useState([]);
  const [wishlist, setWishlist] = useState([]);

  const textPrimary = isDarkMode ? "text-white" : "text-slate-900";
  const textSecondary = isDarkMode ? "text-slate-400" : "text-slate-500";
  const textMuted = isDarkMode ? "text-slate-600" : "text-slate-400";
  const accent = isDarkMode ? "text-indigo-400" : "text-indigo-600";
  const accentBg = isDarkMode ? "bg-indigo-500/10 border-indigo-500/20" : "bg-indigo-50/80 border-indigo-200/60";

  const glass = isDarkMode
    ? "bg-white/[0.03] backdrop-blur-xl border border-white/[0.08]"
    : "bg-white/55 backdrop-blur-xl border border-white/50 shadow-xl shadow-slate-100/30";

  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem('user'));
    if (savedUser) {
      setUserInfo({ name: savedUser.name, email: savedUser.email });
      fetchSubscriptions(savedUser.email);
      fetchWishlist(savedUser.email);
    }

    const fetchHistory = async () => {
      try {
        const response = await fetch('http://localhost:8080/api/history');
        if (response.ok) {
          const data = await response.json();
          const top3 = data.reverse().slice(0, 3);
          const enrichedHistory = await Promise.all(
            top3.map(async (item) => {
              try {
                const tmdbResp = await fetch(
                  `${TMDB_BASE_URL}/search/multi?query=${encodeURIComponent(item.title)}&include_adult=false&language=ko-KR&page=1`,
                  { headers: { Authorization: `Bearer ${TMDB_ACCESS_TOKEN}` } }
                );
                const tmdbData = await tmdbResp.json();
                const detail = tmdbData.results?.find(r => r.media_type === 'movie' || r.media_type === 'tv') || tmdbData.results?.[0] || {};
                return {
                  ...item,
                  posterUrl: detail.poster_path ? `https://image.tmdb.org/t/p/w500${detail.poster_path}` : null,
                  mediaType: detail.media_type || (item.subTitle ? 'tv' : 'movie')
                };
              } catch { return item; }
            })
          );
          setRecentHistory(enrichedHistory);
        }
      } catch (error) { console.error("기록 로드 실패:", error); }
    };

    fetchHistory();
    const interval = setInterval(fetchHistory, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchSubscriptions = async (email) => {
    try {
      const response = await fetch(`http://localhost:8080/api/users/subscriptions?email=${encodeURIComponent(email)}`);
      if (response.ok) {
        const data = await response.json();
        setMySubscriptions(data.subscriptions || []);
      }
    } catch (error) { console.error(error); }
  };

  const fetchWishlist = async (email) => {
    try {
      const res = await fetch(`http://localhost:8080/api/wishlist?email=${encodeURIComponent(email)}`);
      if (res.ok) setWishlist(await res.json());
    } catch (err) { console.error(err); }
  };

  const toggleSubscription = async (ottId) => {
    if (!userInfo.email) return;
    const updatedSubs = mySubscriptions.includes(ottId)
      ? mySubscriptions.filter(id => id !== ottId)
      : [...mySubscriptions, ottId];
    setMySubscriptions(updatedSubs);
    try {
      await fetch(`http://localhost:8080/api/users/subscriptions?email=${encodeURIComponent(userInfo.email)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptions: updatedSubs })
      });
    } catch (error) { console.error(error); }
  };

  const handleLogout = () => {
    if (window.confirm("로그아웃 하시겠습니까?")) {
      localStorage.removeItem('isLoggedIn');
      navigate('/login');
    }
  };

  const emptyState = (label) => (
    <div className={`text-center py-16 rounded-2xl border-2 border-dashed ${isDarkMode ? 'border-white/[0.07]' : 'border-slate-200/60'}`}>
      <p className={`${textMuted} font-bold text-[10px] uppercase tracking-widest`}>{label}</p>
    </div>
  );

  return (
    <div className="w-full animate-in fade-in duration-700">
      <div className="max-w-4xl space-y-5">

        {/* 프로필 카드 */}
        <div className={`${glass} rounded-3xl p-10 flex items-center gap-10 relative overflow-hidden`}>
          <div className={`absolute inset-0 ${isDarkMode
            ? 'bg-gradient-to-br from-indigo-500/[0.07] via-transparent to-violet-500/[0.05]'
            : 'bg-gradient-to-br from-indigo-100/40 via-transparent to-violet-100/20'
          } pointer-events-none`} />
          <div className={`relative w-20 h-20 ${isDarkMode ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-indigo-50/80 border-indigo-100/60'} border rounded-2xl flex items-center justify-center ${accent} shrink-0`}>
            <User size={40} />
          </div>
          <div className="relative">
            <h2 className={`text-3xl font-black ${textPrimary} mb-1 tracking-tighter`}>{userInfo.name || '사용자'}</h2>
            <p className={`${textSecondary} font-bold tracking-widest text-[10px] uppercase`}>{userInfo.email || '이메일 정보 없음'}</p>
          </div>
        </div>

        {/* OTT 구독 관리 */}
        <div className={`${glass} rounded-3xl p-10`}>
          <div className="mb-8">
            <h3 className={`text-sm font-bold ${textPrimary} uppercase tracking-widest`}>OTT 구독 관리</h3>
            <p className={`text-[10px] ${textMuted} font-bold mt-1 uppercase tracking-[0.15em]`}>이용 중인 서비스를 선택하세요</p>
          </div>

          <div className="flex flex-wrap gap-4">
            {OTT_LIST.map((ott) => {
              const isSubscribed = mySubscriptions.includes(ott.id);
              const logoSrc = OTT_LOGOS[ott.name];

              return (
                <button
                  key={ott.id}
                  onClick={() => toggleSubscription(ott.id)}
                  title={ott.name}
                  className="relative flex flex-col items-center justify-center rounded-2xl transition-all duration-300 hover:scale-105 gap-0"
                  style={{
                    width: '88px',
                    height: '80px',
                    background: isSubscribed
                      ? isDarkMode ? 'rgba(52, 211, 153, 0.08)' : 'rgba(255,255,255,0.8)'
                      : isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.35)',
                    border: isSubscribed
                      ? '2px solid rgba(52, 211, 153, 0.45)'
                      : isDarkMode ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(255,255,255,0.55)',
                    boxShadow: isSubscribed
                      ? isDarkMode ? '0 0 20px rgba(52, 211, 153, 0.15)' : '0 0 16px rgba(52, 211, 153, 0.12)'
                      : 'none',
                    backdropFilter: 'blur(20px)',
                  }}
                >
                  {logoSrc ? (
                    <img
                      src={logoSrc}
                      alt={ott.name}
                      className={`w-full h-full object-contain p-3 ${isDarkMode ? 'filter brightness-110' : ''}`}
                    />
                  ) : (
                    <span className={`text-[11px] font-bold text-center px-2 leading-tight ${isSubscribed ? 'text-emerald-400' : isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      {ott.name}
                    </span>
                  )}

                  {isSubscribed && (
                    <div className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-white rounded-lg p-1 shadow-lg shadow-emerald-500/30 animate-in zoom-in-50">
                      <CheckCircle2 size={11} strokeWidth={3} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 찜 목록 & 시청 기록 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className={`${glass} p-8 rounded-3xl`}>
            <div className="flex items-center gap-3 mb-7">
              <div className={`w-10 h-10 rounded-xl ${accentBg} border flex items-center justify-center ${accent}`}>
                <Heart size={18} />
              </div>
              <span className={`text-sm font-bold ${textPrimary} uppercase tracking-widest`}>찜 목록 ({wishlist.length})</span>
            </div>
            {wishlist.length > 0 ? (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                {wishlist.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-center gap-4 group cursor-pointer p-2 rounded-2xl transition-all ${isDarkMode ? 'hover:bg-white/[0.05]' : 'hover:bg-white/60'}`}
                    onClick={() => navigate(`/search?q=${encodeURIComponent(item.title)}`)}
                  >
                    <img
                      src={item.posterUrl || 'https://via.placeholder.com/100x150?text=No+Image'}
                      className={`w-12 object-cover rounded-xl shadow-lg border flex-shrink-0 ${isDarkMode ? 'border-white/[0.06]' : 'border-white/50'}`}
                      style={{ height: '72px' }}
                      alt="poster"
                    />
                    <div>
                      <span className={`font-bold ${textPrimary} text-sm line-clamp-1 group-hover:${accent} transition-colors tracking-tight`}>{item.title}</span>
                      <span className={`text-[9px] ${textSecondary} font-bold mt-1 block uppercase tracking-widest`}>
                        {item.releaseDate?.split('-')[0]} <span className="opacity-20 mx-1">•</span> {item.mediaType === 'movie' ? '영화' : 'TV'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : emptyState("찜한 콘텐츠가 없습니다")}
          </div>

          <div className={`${glass} p-8 rounded-3xl`}>
            <div className="flex items-center gap-3 mb-7">
              <div className={`w-10 h-10 rounded-xl ${accentBg} border flex items-center justify-center ${accent}`}>
                <PlayCircle size={18} />
              </div>
              <span className={`text-sm font-bold ${textPrimary} uppercase tracking-widest`}>시청 기록</span>
            </div>
            {recentHistory.length > 0 ? (
              <div className="space-y-3">
                {recentHistory.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between group cursor-pointer p-2 rounded-2xl transition-all ${isDarkMode ? 'hover:bg-white/[0.05]' : 'hover:bg-white/60'}`}
                    onClick={() => navigate(item.subTitle ? '/tv' : '/movies')}
                  >
                    <div className="flex items-center gap-4">
                      <img
                        src={item.posterUrl || 'https://via.placeholder.com/100x150?text=No+Image'}
                        className={`w-12 object-cover rounded-xl shadow-lg border flex-shrink-0 ${isDarkMode ? 'border-white/[0.06]' : 'border-white/50'}`}
                        style={{ height: '72px' }}
                        alt="poster"
                      />
                      <div>
                        <span className={`font-bold ${textPrimary} text-sm line-clamp-1 group-hover:${accent} transition-colors tracking-tight`}>{item.title}</span>
                        <span className={`text-[9px] ${textSecondary} font-bold mt-1 block uppercase tracking-widest`}>
                          {item.subTitle || '영화'} <span className="opacity-20 mx-1">|</span>
                          <span className={accent}> {item.progress}% 시청</span>
                        </span>
                      </div>
                    </div>
                    <Clock size={15} className={`${textMuted} group-hover:${accent} transition-colors shrink-0`} />
                  </div>
                ))}
              </div>
            ) : emptyState("시청 기록이 없습니다")}
          </div>
        </div>

        {/* 로그아웃 */}
        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 px-7 py-4 rounded-2xl font-bold text-[10px] uppercase tracking-widest transition-all active:scale-95 border group ${isDarkMode ? 'bg-white/[0.03] text-slate-500 border-white/[0.07] hover:bg-red-600/90 hover:text-white hover:border-transparent' : 'bg-white/50 text-slate-500 border-slate-200/60 hover:bg-red-600 hover:text-white hover:border-transparent'}`}
        >
          <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" />
          로그아웃
        </button>
      </div>
    </div>
  );
};

export default MyPage;
