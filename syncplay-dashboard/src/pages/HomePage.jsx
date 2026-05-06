import React, { useState, useEffect } from 'react';
import { Play, Search, ChevronRight, Heart, Tv, Film } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SkeletonCard from '../components/SkeletonCard';

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

const getGreeting = () => {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return '좋은 아침이에요';
  if (h >= 12 && h < 18) return '좋은 오후에요';
  if (h >= 18 && h < 22) return '좋은 저녁이에요';
  return '좋은 밤이에요';
};

const HomePage = ({ isDarkMode }) => {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState({ name: '', email: '' });
  const [mySubscriptions, setMySubscriptions] = useState([]);
  const [recentHistory, setRecentHistory] = useState([]);
  const [totalHistoryCount, setTotalHistoryCount] = useState(0);
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  const glass = isDarkMode
    ? "bg-white/[0.03] backdrop-blur-xl border border-white/[0.08]"
    : "bg-white/55 backdrop-blur-xl border border-white/50 shadow-xl shadow-slate-200/30";

  const textPrimary = isDarkMode ? "text-white" : "text-slate-900";
  const textSecondary = isDarkMode ? "text-slate-400" : "text-slate-500";
  const textMuted = isDarkMode ? "text-slate-600" : "text-slate-400";
  const accent = isDarkMode ? "text-indigo-400" : "text-indigo-600";

  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem('user'));
    if (savedUser) {
      setUserInfo({ name: savedUser.name, email: savedUser.email });
      fetchAllData(savedUser.email);
    }
  }, []);

  const fetchAllData = async (email) => {
    setLoading(true);
    try {
      const subRes = await fetch(`http://localhost:8080/api/users/subscriptions?email=${encodeURIComponent(email)}`);
      if (subRes.ok) {
        const subData = await subRes.json();
        setMySubscriptions(subData.subscriptions || []);
      }

      const wishRes = await fetch(`http://localhost:8080/api/wishlist?email=${encodeURIComponent(email)}`);
      if (wishRes.ok) {
        const wishData = await wishRes.json();
        setWishlist(wishData); // 전체 저장 — 표시는 JSX에서 slice
      }

      const historyRes = await fetch('http://localhost:8080/api/history');
      if (historyRes.ok) {
        const historyData = await historyRes.json();
        setTotalHistoryCount(historyData.length);
        const enriched = await Promise.all(
          historyData.reverse().map(async (item) => { // 전체 enrich
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
        setRecentHistory(enriched); // 전체 저장 — 표시는 JSX에서 slice
      }
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const activeServices = OTT_LIST.filter(ott => mySubscriptions.includes(ott.id));

  const stats = [
    { label: '구독 서비스', value: loading ? '-' : `${activeServices.length}개`, Icon: Tv },
    { label: '찜 목록', value: loading ? '-' : `${wishlist.length}편`, Icon: Heart },
    { label: '시청 기록', value: loading ? '-' : `${totalHistoryCount}편`, Icon: Film },
  ];

  // 포스터 소스: 찜 목록 + 최근 기록 이미지 전부
  const posterSources = [...wishlist, ...recentHistory].filter(i => i.posterUrl);

  // 3컬럼으로 분배, 최소 4개씩 패딩해서 루프 매끄럽게
  const padToMin = (arr, min = 4) => {
    if (!arr.length) return [];
    const out = [];
    while (out.length < min) out.push(...arr);
    return out;
  };
  const fallback = posterSources.length ? posterSources : [];
  const rawCol1 = posterSources.filter((_, i) => i % 3 === 0);
  const rawCol2 = posterSources.filter((_, i) => i % 3 === 1);
  const rawCol3 = posterSources.filter((_, i) => i % 3 === 2);
  const col1 = padToMin(rawCol1.length ? rawCol1 : fallback);
  const col2 = padToMin(rawCol2.length ? rawCol2 : fallback);
  const col3 = padToMin(rawCol3.length ? rawCol3 : fallback);

  return (
    <div className="animate-in fade-in duration-700 space-y-5">

      {/* ── 히어로 배너 ── */}
      <section className={`relative overflow-hidden rounded-3xl ${glass}`}>
        <div className={`absolute inset-0 ${isDarkMode
          ? 'bg-gradient-to-br from-indigo-500/[0.12] via-transparent to-violet-600/[0.08]'
          : 'bg-gradient-to-br from-indigo-100/60 via-transparent to-violet-100/40'
        } pointer-events-none`} />
        <div className={`absolute -top-24 -right-24 w-72 h-72 rounded-full blur-[80px] pointer-events-none ${isDarkMode ? 'bg-indigo-500/10' : 'bg-indigo-200/30'}`} />
        <div className={`absolute -bottom-16 -left-16 w-48 h-48 rounded-full blur-[60px] pointer-events-none ${isDarkMode ? 'bg-violet-500/8' : 'bg-violet-200/20'}`} />

        <div className="relative z-10 p-8 lg:p-12">
          <div className="flex flex-col md:flex-row items-center gap-10">

            {/* 왼쪽: 텍스트 */}
            <div className="flex-1 min-w-0">
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl mb-6 text-[10px] font-bold uppercase tracking-[0.15em] ${isDarkMode ? 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-400' : 'bg-indigo-500/10 border border-indigo-400/30 text-indigo-600'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isDarkMode ? 'bg-indigo-400' : 'bg-indigo-500'} animate-pulse`} />
                {getGreeting()}
              </div>

              <h2
                className={`font-black tracking-tighter leading-[0.88] mb-5 ${textPrimary}`}
                style={{ fontSize: 'clamp(2.8rem, 4.5vw, 5.5rem)' }}
              >
                안녕하세요,<br />
                <span className={accent}>{userInfo.name || '...'}</span>님
              </h2>

              <p className={`${textSecondary} text-base font-medium leading-relaxed mb-9 max-w-sm`}>
                오늘도 즐거운 시청 되세요.<br />
                <span className={textMuted}>맞춤 콘텐츠가 기다리고 있어요.</span>
              </p>

              <button
                onClick={() => navigate('/search')}
                className={`inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-sm transition-all active:scale-95 shadow-lg ${isDarkMode ? 'bg-indigo-500 hover:bg-indigo-400 text-white shadow-indigo-500/25' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'}`}
              >
                <Search size={18} />
                콘텐츠 검색하기
              </button>

              {/* 통계 행 */}
              <div className={`flex flex-wrap gap-7 mt-10 pt-8 border-t ${isDarkMode ? 'border-white/[0.07]' : 'border-indigo-100/60'}`}>
                {stats.map(({ label, value, Icon }) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDarkMode ? 'bg-indigo-500/10 border border-indigo-500/20' : 'bg-indigo-50/80 border border-indigo-200/60'}`}>
                      <Icon size={17} className={accent} />
                    </div>
                    <div>
                      <div className={`text-2xl font-black tracking-tight leading-none ${textPrimary}`}>{value}</div>
                      <div className={`text-[9px] font-bold uppercase tracking-widest mt-0.5 ${textMuted}`}>{label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 오른쪽: 3컬럼 스크롤 포스터 월 */}
            {posterSources.length > 0 ? (
              <div
                className="hidden lg:flex gap-3 overflow-hidden flex-shrink-0"
                style={{
                  width: '288px',
                  height: '320px',
                  maskImage: 'linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%)',
                  WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%)',
                }}
              >
                {/* 컬럼 1 — 위로 (느리게) */}
                <div
                  className="flex flex-col gap-3 flex-shrink-0"
                  style={{ animation: 'posterScrollUp 24s linear infinite', willChange: 'transform' }}
                >
                  {[...col1, ...col1].map((item, i) => (
                    <div key={i} className="relative w-[88px] h-[124px] rounded-2xl overflow-hidden flex-shrink-0 group"
                      style={{ border: '1.5px solid rgba(255,255,255,0.1)', boxShadow: '0 6px 24px rgba(0,0,0,0.4)' }}
                    >
                      <img src={item.posterUrl} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  ))}
                </div>

                {/* 컬럼 2 — 아래로 (중간 속도) */}
                <div
                  className="flex flex-col gap-3 flex-shrink-0"
                  style={{ animation: 'posterScrollDown 18s linear infinite', willChange: 'transform' }}
                >
                  {[...col2, ...col2].map((item, i) => (
                    <div key={i} className="relative w-[88px] h-[124px] rounded-2xl overflow-hidden flex-shrink-0 group"
                      style={{ border: '1.5px solid rgba(255,255,255,0.1)', boxShadow: '0 6px 24px rgba(0,0,0,0.4)' }}
                    >
                      <img src={item.posterUrl} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  ))}
                </div>

                {/* 컬럼 3 — 위로 (빠르게) */}
                <div
                  className="flex flex-col gap-3 flex-shrink-0"
                  style={{ animation: 'posterScrollUp 14s linear infinite', willChange: 'transform' }}
                >
                  {[...col3, ...col3].map((item, i) => (
                    <div key={i} className="relative w-[88px] h-[124px] rounded-2xl overflow-hidden flex-shrink-0 group"
                      style={{ border: '1.5px solid rgba(255,255,255,0.1)', boxShadow: '0 6px 24px rgba(0,0,0,0.4)' }}
                    >
                      <img src={item.posterUrl} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="hidden lg:flex w-64 h-64 flex-shrink-0 items-center justify-center">
                <div className={`w-56 h-56 rounded-3xl ${isDarkMode ? 'bg-white/[0.04]' : 'bg-white/30'} backdrop-blur-xl border ${isDarkMode ? 'border-white/[0.08]' : 'border-white/50'} flex items-center justify-center`}>
                  <Play size={80} className={`${isDarkMode ? 'fill-indigo-400 text-indigo-400' : 'fill-indigo-500 text-indigo-500'} drop-shadow-[0_0_40px_rgba(99,102,241,0.5)]`} />
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── 벤토 그리드 ── */}
      <div className="grid grid-cols-12 gap-5">

        {/* 구독 서비스 */}
        <div className={`col-span-12 lg:col-span-4 ${glass} rounded-3xl p-8`}>
          <div className="flex justify-between items-start mb-7">
            <div>
              <h3 className={`text-sm font-bold ${textPrimary} uppercase tracking-widest`}>구독 서비스</h3>
              <p className={`text-[10px] ${textMuted} font-bold mt-1 uppercase tracking-[0.15em]`}>연결된 플랫폼</p>
            </div>
            <button
              onClick={() => navigate('/mypage')}
              className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border transition-colors ${isDarkMode ? 'text-slate-400 border-white/[0.08] hover:text-white hover:bg-white/[0.06]' : 'text-slate-500 border-slate-200/70 hover:bg-white/70'}`}
            >
              관리
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {loading
              ? [...Array(4)].map((_, i) => (
                  <div key={i} className={`${isDarkMode ? 'bg-white/[0.04]' : 'bg-white/40'} rounded-2xl animate-pulse h-28`} />
                ))
              : activeServices.length > 0
              ? activeServices.map((ott) => (
                  <div key={ott.id} className={`${isDarkMode ? 'bg-white/[0.04] border-white/[0.06] hover:bg-white/[0.08]' : 'bg-white/50 border-white/50 hover:bg-white/80'} border rounded-2xl p-5 transition-all flex flex-col justify-between`}>
                    {OTT_LOGOS[ott.name] && (
                      <img src={OTT_LOGOS[ott.name]} alt={ott.name} className={`h-7 mb-5 object-contain ${isDarkMode ? 'filter brightness-110' : ''}`} />
                    )}
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]" />
                      <span className={`text-[9px] font-bold ${textMuted} uppercase tracking-widest`}>구독 중</span>
                    </div>
                  </div>
                ))
              : (
                <div
                  className={`col-span-2 ${isDarkMode ? 'border-white/[0.07]' : 'border-slate-300/50'} border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer hover:border-indigo-500/40 transition-colors`}
                  onClick={() => navigate('/mypage')}
                >
                  <p className={`${textMuted} font-bold text-[10px] uppercase tracking-widest mb-3`}>연결된 서비스 없음</p>
                  <div className={`${accent} font-bold text-[10px] uppercase tracking-widest`}>지금 연결하기 +</div>
                </div>
              )}
          </div>
        </div>

        {/* 이어보기 */}
        <div className={`col-span-12 lg:col-span-8 ${glass} rounded-3xl p-8`}>
          <div className="flex justify-between items-start mb-7">
            <div>
              <h3 className={`text-sm font-bold ${textPrimary} uppercase tracking-widest`}>이어보기</h3>
              <p className={`text-[10px] ${textMuted} font-bold mt-1 uppercase tracking-[0.15em]`}>최근 시청 기록</p>
            </div>
            <button
              onClick={() => navigate('/movies')}
              className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border transition-colors flex items-center ${isDarkMode ? 'text-slate-400 border-white/[0.08] hover:text-white hover:bg-white/[0.06]' : 'text-slate-500 border-slate-200/70 hover:bg-white/70'}`}
            >
              전체보기 <ChevronRight size={12} className="ml-1" />
            </button>
          </div>

          <div className="space-y-3">
            {loading
              ? [...Array(3)].map((_, i) => (
                  <div key={i} className={`${isDarkMode ? 'bg-white/[0.04]' : 'bg-white/40'} rounded-2xl animate-pulse h-28`} />
                ))
              : recentHistory.length > 0
              ? recentHistory.slice(0, 3).map((watch) => (
                  <div
                    key={watch.id}
                    className={`${isDarkMode ? 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.07]' : 'bg-white/40 border-white/50 hover:bg-white/70'} border rounded-2xl p-4 transition-all group cursor-pointer flex items-center justify-between`}
                    onClick={() => navigate(watch.subTitle ? '/tv' : '/movies')}
                  >
                    <div className="flex items-center gap-5">
                      <div className="relative shrink-0">
                        <img
                          src={watch.posterUrl || 'https://via.placeholder.com/100x150?text=No+Image'}
                          alt={watch.title}
                          className={`w-14 h-20 object-cover rounded-xl shadow-lg border ${isDarkMode ? 'border-white/[0.06]' : 'border-white/50'}`}
                        />
                        <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Play size={16} className="text-white fill-white" />
                        </div>
                      </div>
                      <div>
                        <h4 className={`font-bold ${textPrimary} text-base line-clamp-1 mb-1 tracking-tight group-hover:${accent} transition-colors`}>
                          {watch.title}
                        </h4>
                        <p className={`text-[10px] ${textMuted} font-bold uppercase tracking-widest`}>
                          {watch.subTitle || '영화'}
                          <span className="mx-2 opacity-20">|</span>
                          <span className={accent}>{watch.progress}% 완료</span>
                        </p>
                      </div>
                    </div>
                    <div className="hidden sm:block w-36 px-4">
                      <div className={`w-full ${isDarkMode ? 'bg-white/[0.06]' : 'bg-slate-200/60'} h-1 rounded-full overflow-hidden`}>
                        <div
                          className={`${isDarkMode ? 'bg-indigo-400' : 'bg-indigo-500'} h-full rounded-full shadow-[0_0_10px_rgba(99,102,241,0.6)]`}
                          style={{ width: `${watch.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))
              : (
                <div className={`py-16 text-center rounded-2xl border-2 border-dashed ${isDarkMode ? 'border-white/[0.06]' : 'border-slate-200/60'}`}>
                  <p className={`${textMuted} font-bold text-[10px] uppercase tracking-widest`}>최근 시청 기록이 없습니다</p>
                </div>
              )}
          </div>
        </div>
      </div>

      {/* ── 찜 목록 ── */}
      <section className={`${glass} rounded-3xl p-8`}>
        <div className="flex justify-between items-start mb-7">
          <div className="flex items-center gap-4">
            <div className={`w-11 h-11 rounded-2xl ${isDarkMode ? 'bg-indigo-500/10 border border-indigo-500/20' : 'bg-indigo-50/80 border border-indigo-200/60'} flex items-center justify-center ${accent}`}>
              <Heart size={20} />
            </div>
            <div>
              <h3 className={`text-sm font-bold ${textPrimary} uppercase tracking-widest`}>찜 목록</h3>
              <p className={`text-[10px] ${textMuted} font-bold mt-1 uppercase tracking-[0.15em]`}>나중에 볼 콘텐츠</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/mypage')}
            className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border transition-colors ${isDarkMode ? 'text-slate-400 border-white/[0.08] hover:text-white hover:bg-white/[0.06]' : 'text-slate-500 border-slate-200/70 hover:bg-white/70'}`}
          >
            전체보기
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {loading
            ? [...Array(4)].map((_, i) => <SkeletonCard key={i} isDarkMode={isDarkMode} />)
            : wishlist.length > 0
            ? wishlist.slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  className="group cursor-pointer"
                  onClick={() => navigate(`/search?q=${encodeURIComponent(item.title)}`)}
                >
                  <div className="relative aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl transition-all duration-500 hover:-translate-y-2">
                    <img
                      src={item.posterUrl || 'https://via.placeholder.com/300x450?text=No+Image'}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className={`absolute bottom-0 left-0 right-0 p-4 ${isDarkMode ? 'bg-black/30' : 'bg-black/20'} backdrop-blur-md`}>
                      <h4 className="font-bold text-white text-sm line-clamp-1 mb-0.5 group-hover:text-indigo-300 transition-colors">{item.title}</h4>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                        {item.releaseDate?.split('-')[0]}
                        <span className="mx-1.5 opacity-30">•</span>
                        {item.mediaType === 'movie' ? '영화' : 'TV'}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            : (
              <div className={`col-span-full py-20 text-center rounded-2xl border-2 border-dashed ${isDarkMode ? 'border-white/[0.06]' : 'border-slate-200/60'}`}>
                <p className={`${textMuted} font-bold text-[10px] uppercase tracking-widest`}>찜한 콘텐츠가 없습니다</p>
              </div>
            )}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
