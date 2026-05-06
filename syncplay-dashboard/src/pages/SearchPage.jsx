import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, ArrowLeft, AlertCircle, X, Star, Heart, Play, TrendingUp, Flame } from 'lucide-react';
import SkeletonCard from '../components/SkeletonCard';

const TMDB_ACCESS_TOKEN = import.meta.env.VITE_TMDB_ACCESS_TOKEN;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const API_BASE_URL = 'http://localhost:8080';

const LOGO_MAP = {
  "netflix": "/logos/netflix.png",
  "tving": "/logos/tving.png",
  "disneyplus": "/logos/disneyplus.svg",
  "disney": "/logos/disneyplus.svg",
  "coupangplay": "/logos/coupangplay.png",
  "coupang": "/logos/coupangplay.png",
  "wavve": "/logos/wavve.png",
  "watcha": "/logos/watcha.png",
  "appletv": "/logos/appletv.png",
  "appletvplus": "/logos/appletv.png",
  "amazonprimevideo": "/logos/amazonprime.png",
  "amazon": "/logos/amazonprime.png"
};

const OTT_NAME_MAP = {
  netflix: "Netflix",
  tving: "TVING",
  disneyplus: "Disney+",
  coupangplay: "Coupang Play",
  wavve: "Wavve",
  watcha: "왓챠",
  appletv: "Apple TV+",
  amazonprimevideo: "Amazon Prime Video",
};

// 전역 캐시 (페이지 이동 시에도 유지)
const providerCache = new Map();

const normalize = (s) => s?.toLowerCase().replace(/\s/g, '').replace('+', 'plus') ?? '';

const getLogoUrl = (providerName) => {
  if (!providerName) return null;
  return LOGO_MAP[normalize(providerName)] || null;
};

const buildProviderStatuses = (krProviders, userSubIds) => {
  if (!krProviders) return [];
  const seen = new Set();
  const result = [];
  const normalizedSubs = new Set(
    userSubIds.map(id => normalize(OTT_NAME_MAP[id] || id))
  );

  for (const type of ['flatrate', 'rent', 'buy']) {
    for (const p of krProviders[type] || []) {
      if (seen.has(p.provider_id)) continue;
      seen.add(p.provider_id);
      if (p.provider_name?.toLowerCase().includes('ads')) continue;
      result.push({
        providerId: p.provider_id,
        providerName: p.provider_name,
        logoPath: p.logo_path,
        status: normalizedSubs.has(normalize(p.provider_name)) ? 'SUBSCRIBED' : 'PURCHASE_REQUIRED',
      });
    }
  }
  return result;
};

const normalizeItem = (item, mediaType, providerStatuses = null) => ({
  id: item.id,
  title: item.title || item.name || '',
  mediaType: mediaType || item.media_type || 'movie',
  posterUrl: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
  overview: item.overview || '상세 정보가 없습니다.',
  releaseDate: item.release_date || item.first_air_date || '',
  rating: item.vote_average || 0,
  providerStatuses,
});

const SearchPage = ({ isDarkMode }) => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const navigate = useNavigate();

  const [searchInput, setSearchInput] = useState(query);
  const [results, setResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const [trending, setTrending] = useState([]);
  const [popularMovies, setPopularMovies] = useState([]);
  const [popularTv, setPopularTv] = useState([]);
  const [discoverLoading, setDiscoverLoading] = useState(true);

  const [selectedItem, setSelectedItem] = useState(null);
  const [modalProviders, setModalProviders] = useState([]);
  const [modalProvidersLoading, setModalProvidersLoading] = useState(false);
  const [myWishlist, setMyWishlist] = useState([]);
  const [userSubIds, setUserSubIds] = useState([]);

  const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
  const userEmail = currentUser?.email || '';

  const textPrimary = isDarkMode ? "text-white" : "text-slate-900";
  const textSecondary = isDarkMode ? "text-slate-500" : "text-slate-500";
  const textMuted = isDarkMode ? "text-slate-600" : "text-slate-400";

  const glass = isDarkMode
    ? "bg-white/[0.03] backdrop-blur-xl border border-white/[0.08]"
    : "bg-white/55 backdrop-blur-xl border border-white/50 shadow-xl shadow-slate-100/30";

  // 위시리스트 + 구독 정보 로드
  useEffect(() => {
    if (!userEmail) return;
    Promise.all([
      fetch(`${API_BASE_URL}/api/wishlist?email=${encodeURIComponent(userEmail)}`).then(r => r.json()).catch(() => []),
      fetch(`${API_BASE_URL}/api/users/subscriptions?email=${encodeURIComponent(userEmail)}`).then(r => r.json()).catch(() => ({})),
    ]).then(([wishData, subData]) => {
      setMyWishlist(wishData);
      setUserSubIds(subData.subscriptions || []);
    });
  }, [userEmail]);

  // 트렌딩/인기 로드 + OTT 정보 enrichment
  useEffect(() => {
    const fetchDiscover = async () => {
      setDiscoverLoading(true);
      try {
        const headers = { Authorization: `Bearer ${TMDB_ACCESS_TOKEN}` };

        const [trendRes, moviesRes, tvRes] = await Promise.all([
          fetch(`${TMDB_BASE_URL}/trending/all/week?language=ko-KR`, { headers }),
          fetch(`${TMDB_BASE_URL}/movie/popular?language=ko-KR&region=KR`, { headers }),
          fetch(`${TMDB_BASE_URL}/tv/popular?language=ko-KR`, { headers }),
        ]);
        const [trendData, moviesData, tvData] = await Promise.all([
          trendRes.json(), moviesRes.json(), tvRes.json()
        ]);

        const trendItems = (trendData.results || [])
          .filter(i => i.media_type === 'movie' || i.media_type === 'tv')
          .slice(0, 10);
        const movieItems = (moviesData.results || []).slice(0, 10);
        const tvItems = (tvData.results || []).slice(0, 10);

        setTrending(trendItems.map(i => normalizeItem(i)));
        setPopularMovies(movieItems.map(i => normalizeItem(i, 'movie')));
        setPopularTv(tvItems.map(i => normalizeItem(i, 'tv')));
        setDiscoverLoading(false);

      } catch (err) {
        console.error('Discover fetch error:', err);
        setDiscoverLoading(false);
      }
    };
    fetchDiscover();
  }, [userEmail]);

  // 검색 (TMDB 직접 호출 + 백엔드 OTT 매칭)
  useEffect(() => {
    setSearchInput(query);
    if (!query) { setResults([]); return; }

    const controller = new AbortController();

    const fetchSearch = async () => {
      setSearchLoading(true);
      try {
        const tmdbRes = await fetch(
          `${TMDB_BASE_URL}/search/multi?query=${encodeURIComponent(query)}&language=ko-KR&page=1&include_adult=false`,
          { headers: { Authorization: `Bearer ${TMDB_ACCESS_TOKEN}` }, signal: controller.signal }
        );
        const tmdbData = await tmdbRes.json();

        const filtered = (tmdbData.results || [])
          .filter(i => i.media_type === 'movie' || i.media_type === 'tv');

        // 초기 결과는 기본 정보만 포함 (속도 향상)
        const initialResults = filtered.map(item => {
          const cacheKey = `${item.media_type}_${item.id}`;
          return normalizeItem(item, item.media_type, providerCache.get(cacheKey));
        });

        if (!controller.signal.aborted) {
          setResults(initialResults);
        }

        // 비동기로 상위 결과들만 먼저 OTT 정보 업데이트 (UX 개선)
        const subs = userSubIds.length > 0 ? userSubIds : (() => {
          try { return JSON.parse(localStorage.getItem('user_subs') || '[]'); } catch { return []; }
        })();

        // 상위 5개만 즉시 병렬 fetch, 나머지는 ContentCard에서 지연 로딩
        const topItems = initialResults.slice(0, 5).filter(i => !i.providerStatuses);
        
        if (topItems.length > 0 && !controller.signal.aborted) {
          Promise.allSettled(
            topItems.map(async (item) => {
              const cacheKey = `${item.mediaType}_${item.id}`;
              try {
                const res = await fetch(
                  `${TMDB_BASE_URL}/${item.mediaType}/${item.id}/watch/providers`,
                  { headers: { Authorization: `Bearer ${TMDB_ACCESS_TOKEN}` }, signal: controller.signal }
                );
                const data = await res.json();
                const krProviders = data.results?.KR || null;
                const statuses = buildProviderStatuses(krProviders, subs);
                providerCache.set(cacheKey, statuses);
                
                setResults(prev => prev.map(p => 
                  (p.id === item.id && p.mediaType === item.mediaType) 
                    ? { ...p, providerStatuses: statuses } 
                    : p
                ));
              } catch (err) {
                if (err.name !== 'AbortError') console.error(err);
              }
            })
          );
        }
      } catch (err) {
        if (err.name !== 'AbortError') console.error(err);
      } finally {
        if (!controller.signal.aborted) setSearchLoading(false);
      }
    };

    fetchSearch();
    return () => controller.abort();
  }, [query]);

  // 모달 열기 (providers 없으면 fetch)
  const handleSelectItem = useCallback(async (item) => {
    setSelectedItem(item);
    const cacheKey = `${item.mediaType}_${item.id}`;
    const cached = providerCache.get(cacheKey);
    
    if (cached) {
      setModalProviders(cached);
      return;
    }

    const existing = item.providerStatuses;
    if (existing && existing.length >= 0) {
      setModalProviders(existing);
      providerCache.set(cacheKey, existing); // 캐시 업데이트
      return;
    }
    
    setModalProvidersLoading(true);
    try {
      const res = await fetch(
        `${TMDB_BASE_URL}/${item.mediaType}/${item.id}/watch/providers`,
        { headers: { Authorization: `Bearer ${TMDB_ACCESS_TOKEN}` } }
      );
      const data = await res.json();
      const krProviders = data.results?.KR || null;
      const subs = userSubIds.length > 0 ? userSubIds : (() => {
        try { return JSON.parse(localStorage.getItem('user_subs') || '[]'); } catch { return []; }
      })();
      const statuses = buildProviderStatuses(krProviders, subs);
      setModalProviders(statuses);
      providerCache.set(cacheKey, statuses);
    } catch {
      setModalProviders([]);
    } finally {
      setModalProvidersLoading(false);
    }
  }, [userSubIds]);

  useEffect(() => {
    if (selectedItem) {
      const cacheKey = `${selectedItem.mediaType}_${selectedItem.id}`;
      const cached = providerCache.get(cacheKey);
      
      if (cached) {
        setModalProviders(cached);
        return;
      }

      const existing = selectedItem.providerStatuses;
      setModalProviders(existing != null ? existing : []);
      if (existing == null) {
        setModalProvidersLoading(true);
        fetch(
          `${TMDB_BASE_URL}/${selectedItem.mediaType}/${selectedItem.id}/watch/providers`,
          { headers: { Authorization: `Bearer ${TMDB_ACCESS_TOKEN}` } }
        ).then(r => r.json()).then(data => {
          const subs = userSubIds.length > 0 ? userSubIds : (() => {
            try { return JSON.parse(localStorage.getItem('user_subs') || '[]'); } catch { return []; }
          })();
          const statuses = buildProviderStatuses(data.results?.KR || null, subs);
          setModalProviders(statuses);
          providerCache.set(cacheKey, statuses);
        }).catch(() => setModalProviders([]))
          .finally(() => setModalProvidersLoading(false));
      }
    }
  }, [selectedItem]);

  const toggleWishlist = async (item) => {
    if (!userEmail) return alert("로그인이 필요합니다.");
    try {
      const res = await fetch(`${API_BASE_URL}/api/wishlist?email=${encodeURIComponent(userEmail)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: item.id, title: item.title, mediaType: item.mediaType,
          posterUrl: item.posterUrl, releaseDate: item.releaseDate,
        })
      });
      if (res.ok) setMyWishlist(await res.json());
    } catch (err) { console.error(err); }
  };

  const isWished = (id) => myWishlist.some(w => w.id === id);

  // 검색 입력 디바운싱
  useEffect(() => {
    if (searchInput.trim() === query) return;
    
    const timer = setTimeout(() => {
      if (searchInput.trim()) {
        navigate(`/search?q=${encodeURIComponent(searchInput.trim())}`, { replace: true });
        setSelectedItem(null);
      } else if (query) {
        navigate('/search');
      }
    }, 500); // 500ms 디바운스

    return () => clearTimeout(timer);
  }, [searchInput, query, navigate]);

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchInput.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchInput.trim())}`);
      setSelectedItem(null);
    }
  };

  const handlePlayDirectly = (item, providers) => {
    const subscribed = providers.filter(p => p.status === 'SUBSCRIBED');
    if (!subscribed.length) return;
    const name = subscribed[0].providerName.toLowerCase().replace(/\s/g, '');
    const t = encodeURIComponent(item.title);
    
    // 딥링크 또는 더 정확한 검색 URL
    let url = `https://www.google.com/search?q=${t}+보러가기`;
    if (name.includes('netflix')) url = `https://www.netflix.com/search?q=${t}`;
    else if (name.includes('tving')) url = `https://www.tving.com/search?keyword=${t}`;
    else if (name.includes('wavve')) url = `https://www.wavve.com/search?searchWord=${t}`;
    else if (name.includes('disney')) url = `https://www.disneyplus.com`;
    else if (name.includes('coupang')) url = `https://www.coupangplay.com`;
    else if (name.includes('watcha')) url = `https://watcha.com/search?query=${t}`;
    
    window.open(url, '_blank');
  };

  // 카드 컴포넌트 (지연 로딩 및 캐싱 적용)
  const ContentCard = ({ item, rank }) => {
    const [localProviders, setLocalProviders] = useState(item.providerStatuses);
    const [isLoaded, setIsLoaded] = useState(!!item.providerStatuses);
    
    useEffect(() => {
      // 이미 정보가 있거나 캐시에 있으면 즉시 적용
      const cacheKey = `${item.mediaType}_${item.id}`;
      const cached = providerCache.get(cacheKey);
      
      if (item.providerStatuses) {
        setLocalProviders(item.providerStatuses);
        setIsLoaded(true);
        return;
      }

      if (cached) {
        setLocalProviders(cached);
        setIsLoaded(true);
        return;
      }

      // 지연 로딩: 컴포넌트가 마운트되고 300ms 후에 데이터 요청 (빠른 스크롤 시 요청 방지)
      const timer = setTimeout(async () => {
        try {
          const res = await fetch(
            `${TMDB_BASE_URL}/${item.mediaType}/${item.id}/watch/providers`,
            { headers: { Authorization: `Bearer ${TMDB_ACCESS_TOKEN}` } }
          );
          const data = await res.json();
          const krProviders = data.results?.KR || null;
          const subs = userSubIds.length > 0 ? userSubIds : (() => {
            try { return JSON.parse(localStorage.getItem('user_subs') || '[]'); } catch { return []; }
          })();
          const statuses = buildProviderStatuses(krProviders, subs);
          
          providerCache.set(cacheKey, statuses);
          setLocalProviders(statuses);
          setIsLoaded(true);
        } catch (err) {
          console.error('Lazy load providers error:', err);
        }
      }, 300);

      return () => clearTimeout(timer);
    }, [item.id, item.mediaType, item.providerStatuses, userSubIds]);

    const providers = localProviders;
    const providersReady = isLoaded;
    const subscribedProviders = providersReady && providers
      ? providers.filter(p => p.status === 'SUBSCRIBED').slice(0, 3)
      : [];
    const hasSubscribed = subscribedProviders.length > 0;
    const otherProviders = providersReady && providers
      ? providers.filter(p => p.status !== 'SUBSCRIBED').slice(0, hasSubscribed ? 0 : 3)
      : [];
    const showProviders = [...subscribedProviders, ...otherProviders].slice(0, 3);

    return (
      <div
        onClick={() => handleSelectItem(item)}
        className={`${glass} rounded-2xl overflow-hidden flex flex-col hover:-translate-y-2 transition-all duration-500 cursor-pointer group hover:border-white/[0.16] hover:shadow-2xl relative`}
      >
        {rank && (
          <div className={`absolute top-3 left-3 z-10 w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-black ${isDarkMode ? 'bg-black/60 text-white backdrop-blur-xl border border-white/10' : 'bg-black/50 text-white backdrop-blur-xl'}`}>
            {rank}
          </div>
        )}
        <div className="w-full aspect-[2/3] bg-black relative overflow-hidden">
          {item.posterUrl
            ? <img src={item.posterUrl} alt={item.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            : <div className={`w-full h-full flex items-center justify-center text-[10px] ${textMuted} uppercase font-bold`}>이미지 없음</div>
          }
          <div className="absolute top-3 right-3">
            <span className={`text-[9px] font-bold text-white px-2 py-1 rounded-lg border uppercase tracking-widest backdrop-blur-xl ${isDarkMode ? 'bg-black/50 border-white/10' : 'bg-black/40 border-white/20'}`}>
              {item.mediaType === 'movie' ? '영화' : 'TV'}
            </span>
          </div>
          {hasSubscribed && (
            <div className={`absolute bottom-3 right-3 ${isDarkMode ? 'bg-indigo-500' : 'bg-indigo-600'} text-white p-2 rounded-xl shadow-lg shadow-indigo-500/30`}>
              <Play size={14} fill="currentColor" />
            </div>
          )}
        </div>
        <div className="p-4 flex flex-col flex-1">
          <h3 className={`font-bold ${textPrimary} leading-tight mb-1 line-clamp-1 text-sm tracking-tight`}>{item.title}</h3>
          <div className="flex items-center justify-between mb-3">
            <span className={`text-[10px] ${textSecondary} font-bold`}>{item.releaseDate?.substring(0, 4) || ''}</span>
            <div className="flex items-center gap-1">
              <Star size={10} className={isDarkMode ? 'fill-indigo-400 text-indigo-400' : 'fill-indigo-500 text-indigo-500'} />
              <span className={`text-[10px] font-bold ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>{item.rating?.toFixed(1)}</span>
            </div>
          </div>

          {/* OTT 정보 */}
          <div className={`pt-3 border-t ${isDarkMode ? 'border-white/[0.06]' : 'border-slate-200/50'} min-h-[22px]`}>
            {!providersReady ? (
              <div className={`flex gap-1.5`}>
                {[...Array(3)].map((_, i) => (
                  <div key={i} className={`h-4 w-8 rounded animate-pulse ${isDarkMode ? 'bg-white/[0.06]' : 'bg-slate-200/60'}`} />
                ))}
              </div>
            ) : showProviders.length === 0 ? (
              <p className={`text-[9px] font-bold ${textMuted} uppercase tracking-widest`}>이용 불가</p>
            ) : (
              <div className="flex flex-wrap gap-2 items-center">
                {showProviders.map(p => {
                  const isSubscribed = p.status === 'SUBSCRIBED';
                  const logo = getLogoUrl(p.providerName);
                  return (
                    <div key={p.providerId}>
                      {logo ? (
                        <div className={`${!isSubscribed ? 'opacity-20 grayscale' : ''}`} title={p.providerName}>
                          <img src={logo} alt={p.providerName} className="h-4 w-auto object-contain" />
                        </div>
                      ) : (
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border uppercase ${isSubscribed
                          ? isDarkMode ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-indigo-50 border-indigo-200/60 text-indigo-600'
                          : isDarkMode ? 'bg-white/[0.04] border-white/[0.07] text-slate-600' : 'bg-slate-100/80 border-slate-200/60 text-slate-400'}`}>
                          {p.providerName}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto relative animate-in fade-in duration-700">

      {/* 검색 바 */}
      <div className="flex items-center gap-4 mb-12">
        <button
          onClick={() => navigate(-1)}
          className={`p-4 rounded-2xl transition-all border shrink-0 ${glass} ${isDarkMode ? 'text-slate-400 hover:text-white hover:border-white/[0.14]' : 'text-slate-500 hover:text-slate-900'}`}
        >
          <ArrowLeft size={20} />
        </button>
        <div className={`flex-1 rounded-2xl px-7 py-4 flex items-center transition-all ${glass} focus-within:border-indigo-500/40`}>
          <Search size={22} className={`${isDarkMode ? 'text-indigo-400' : 'text-indigo-500'} mr-4 shrink-0`} />
          <input
            type="text"
            className={`bg-transparent text-lg outline-none w-full font-bold ${isDarkMode ? 'text-white placeholder:text-slate-700' : 'text-slate-900 placeholder:text-slate-400'} tracking-tight`}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleSearch}
            placeholder="제목, 배우, 장르를 검색하세요..."
            autoFocus
          />
        </div>
      </div>

      {query ? (
        <>
          <div className="mb-8 px-1">
            <h2 className={`text-lg font-bold ${textPrimary} flex items-center gap-3 uppercase tracking-widest`}>
              <span className={`w-1 h-5 ${isDarkMode ? 'bg-indigo-400' : 'bg-indigo-500'} rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]`} />
              "<span className={isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}>{query}</span>" 검색 결과
            </h2>
          </div>
          {searchLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
              {[...Array(10)].map((_, i) => <SkeletonCard key={i} isDarkMode={isDarkMode} />)}
            </div>
          ) : results.length === 0 ? (
            <div className={`p-32 text-center border-2 border-dashed rounded-3xl font-bold uppercase tracking-widest text-xs ${isDarkMode ? 'text-slate-700 border-white/[0.07] bg-white/[0.02]' : 'text-slate-400 border-slate-200/60 bg-white/30'}`}>
              검색 결과가 없습니다.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
              {results.map(item => <ContentCard key={item.id} item={item} />)}
            </div>
          )}
        </>
      ) : (
        <div className="space-y-14">
          {/* 이번 주 트렌딩 */}
          <section>
            <div className="flex items-center gap-3 mb-6 px-1">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isDarkMode ? 'bg-orange-500/10 border border-orange-500/20' : 'bg-orange-50 border border-orange-200/60'}`}>
                <TrendingUp size={17} className={isDarkMode ? 'text-orange-400' : 'text-orange-500'} />
              </div>
              <h2 className={`text-sm font-bold ${textPrimary} uppercase tracking-widest`}>이번 주 트렌딩</h2>
            </div>
            {discoverLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                {[...Array(10)].map((_, i) => <SkeletonCard key={i} isDarkMode={isDarkMode} />)}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                {trending.map((item, i) => <ContentCard key={item.id} item={item} rank={i + 1} />)}
              </div>
            )}
          </section>

          {/* 인기 영화 */}
          <section>
            <div className="flex items-center gap-3 mb-6 px-1">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isDarkMode ? 'bg-indigo-500/10 border border-indigo-500/20' : 'bg-indigo-50 border border-indigo-200/60'}`}>
                <Flame size={17} className={isDarkMode ? 'text-indigo-400' : 'text-indigo-500'} />
              </div>
              <h2 className={`text-sm font-bold ${textPrimary} uppercase tracking-widest`}>인기 영화</h2>
            </div>
            {discoverLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                {[...Array(10)].map((_, i) => <SkeletonCard key={i} isDarkMode={isDarkMode} />)}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                {popularMovies.map((item, i) => <ContentCard key={item.id} item={item} rank={i + 1} />)}
              </div>
            )}
          </section>

          {/* 인기 TV 시리즈 */}
          <section>
            <div className="flex items-center gap-3 mb-6 px-1">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isDarkMode ? 'bg-violet-500/10 border border-violet-500/20' : 'bg-violet-50 border border-violet-200/60'}`}>
                <Flame size={17} className={isDarkMode ? 'text-violet-400' : 'text-violet-500'} />
              </div>
              <h2 className={`text-sm font-bold ${textPrimary} uppercase tracking-widest`}>인기 TV 시리즈</h2>
            </div>
            {discoverLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                {[...Array(10)].map((_, i) => <SkeletonCard key={i} isDarkMode={isDarkMode} />)}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                {popularTv.map((item, i) => <ContentCard key={item.id} item={item} rank={i + 1} />)}
              </div>
            )}
          </section>
        </div>
      )}

      {/* 상세 모달 */}
      {selectedItem && (
        <div
          onClick={() => setSelectedItem(null)}
          className={`fixed inset-0 z-[999] flex items-center justify-center p-6 backdrop-blur-2xl animate-in fade-in duration-300 ${isDarkMode ? 'bg-black/70' : 'bg-slate-900/30'}`}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`rounded-3xl overflow-hidden max-w-5xl w-full shadow-2xl border relative animate-in zoom-in-95 duration-300 ${isDarkMode ? 'bg-[#0d0d10]/90 backdrop-blur-2xl border-white/[0.1]' : 'bg-white/80 backdrop-blur-2xl border-white/60'}`}
          >
            <div className="flex flex-col md:flex-row">
              <div className="md:w-[45%] bg-black relative overflow-hidden" style={{ minHeight: '400px' }}>
                <img
                  src={selectedItem.posterUrl || 'https://via.placeholder.com/300x450?text=No+Image'}
                  className="w-full h-full object-cover absolute inset-0"
                  alt="poster"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/30" />
              </div>
              <div className="p-12 md:w-[55%] flex flex-col justify-between relative">
                <button
                  onClick={() => setSelectedItem(null)}
                  className={`absolute top-6 right-8 p-3 rounded-xl transition-all border ${isDarkMode ? 'bg-white/[0.05] border-white/[0.08] text-slate-500 hover:text-white hover:bg-white/[0.1]' : 'bg-white/60 border-slate-200/60 text-slate-400 hover:text-slate-900'}`}
                >
                  <X size={20} />
                </button>
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <span className={`px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-widest border ${isDarkMode ? 'bg-white/[0.05] text-slate-400 border-white/[0.08]' : 'bg-indigo-50/80 text-indigo-600 border-indigo-100/80'}`}>
                      {selectedItem.mediaType === 'movie' ? '영화' : 'TV 시리즈'}
                    </span>
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-xl border ${isDarkMode ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-indigo-50/80 border-indigo-200/60 text-indigo-700'}`}>
                      <Star size={13} className={isDarkMode ? 'fill-indigo-400 text-indigo-400' : 'fill-indigo-500 text-indigo-500'} />
                      <span className="text-sm font-bold">{selectedItem.rating?.toFixed(1)}</span>
                    </div>
                  </div>
                  <h2 className={`text-4xl font-black ${textPrimary} mb-6 tracking-tighter leading-tight`}>{selectedItem.title}</h2>
                  <div className={`mb-8 p-6 rounded-2xl border ${isDarkMode ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-white/50 border-slate-100/80'}`}>
                    <h4 className={`text-[10px] font-bold ${textSecondary} uppercase tracking-[0.2em] mb-3`}>줄거리</h4>
                    <p className={`leading-relaxed font-medium text-base max-h-40 overflow-y-auto pr-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{selectedItem.overview}</p>
                  </div>
                </div>

                <div className="flex gap-4 mt-4">
                  {modalProvidersLoading ? (
                    <div className={`flex-1 py-4 rounded-2xl flex items-center justify-center border ${isDarkMode ? 'bg-white/[0.04] border-white/[0.07]' : 'bg-slate-100/80 border-slate-200/70'}`}>
                      <div className={`flex gap-2`}>
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className={`h-4 w-12 rounded animate-pulse ${isDarkMode ? 'bg-white/[0.08]' : 'bg-slate-200'}`} />
                        ))}
                      </div>
                    </div>
                  ) : modalProviders.some(p => p.status === 'SUBSCRIBED') ? (
                    <button
                      onClick={() => handlePlayDirectly(selectedItem, modalProviders)}
                      className={`flex-1 font-bold py-4 rounded-2xl flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95 ${isDarkMode ? 'bg-indigo-500 text-white hover:bg-indigo-400 shadow-indigo-500/25' : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-600/20'}`}
                    >
                      {(() => {
                        const p = modalProviders.find(p => p.status === 'SUBSCRIBED');
                        const logo = getLogoUrl(p?.providerName);
                        return logo ? <img src={logo} alt="OTT" className="h-6 w-auto object-contain" /> : null;
                      })()}
                      <span className="text-lg">지금 시청</span>
                    </button>
                  ) : (
                    <div className={`flex-1 font-bold py-4 rounded-2xl flex items-center justify-center gap-3 border uppercase tracking-widest text-[10px] ${isDarkMode ? 'bg-white/[0.04] text-slate-600 border-white/[0.07]' : 'bg-slate-100/80 text-slate-400 border-slate-200/70'}`}>
                      <AlertCircle size={18} /> 구독 중인 서비스 없음
                    </div>
                  )}
                  <button
                    onClick={() => toggleWishlist(selectedItem)}
                    className={`px-10 py-4 font-bold rounded-2xl flex items-center gap-3 border transition-all active:scale-95 ${isWished(selectedItem.id) ? isDarkMode ? 'bg-indigo-500 text-white border-transparent shadow-lg shadow-indigo-500/30' : 'bg-indigo-600 text-white border-transparent shadow-lg shadow-indigo-600/20' : isDarkMode ? 'bg-white/[0.04] text-indigo-400 border-white/[0.07] hover:bg-white/[0.08]' : 'bg-white/60 text-indigo-500 border-white/50 hover:bg-white/80'}`}
                  >
                    <Heart size={22} className={isWished(selectedItem.id) ? "fill-white" : ""} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchPage;
