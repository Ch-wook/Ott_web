import React, { useState, useEffect, useMemo } from 'react';
import MediaCard from '../components/MediaCard';
import { useTmdbSearch } from '../hooks/useTmdbSearch';

const TMDB_ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIwNmViOTIxZDczYTdmMDgyMDJjZjRiNjJkZWE4ZTcwMCIsIm5iZiI6MTc3NDM5OTY5NS42NzIsInN1YiI6IjY5YzMzMGNmOTYxZmZlOWFmZDZhYzA5YyIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.kSddRgvZuFP6as-RkpfFIFSo2P7P2UqyVuotXKAbKJA';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

const GlobalSearchPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { results, loading, search } = useTmdbSearch();

  const [trendTab, setTrendTab] = useState('movie');
  const [popularTab, setPopularTab] = useState('movie');
  const [trending, setTrending] = useState({ movie: [], tv: [] });
  const [popular, setPopular] = useState({ movie: [], tv: [] });
  const [personalized, setPersonalized] = useState([]);
  const [recsLoading, setRecsLoading] = useState(true);
  const [isPersonalizedLoading, setIsPersonalizedLoading] = useState(true);

  const tmdbHeaders = useMemo(
    () => ({ Authorization: `Bearer ${TMDB_ACCESS_TOKEN}` }),
    []
  );

  useEffect(() => {
    const fetchRecs = async () => {
      setRecsLoading(true);
      try {
        const [trendMovieRes, trendTvRes, popularMovieRes, popularTvRes] = await Promise.all([
          fetch(`${TMDB_BASE_URL}/trending/movie/day?language=ko-KR`, { headers: tmdbHeaders }),
          fetch(`${TMDB_BASE_URL}/trending/tv/day?language=ko-KR`, { headers: tmdbHeaders }),
          fetch(`${TMDB_BASE_URL}/movie/popular?language=ko-KR&page=1`, { headers: tmdbHeaders }),
          fetch(`${TMDB_BASE_URL}/tv/popular?language=ko-KR&page=1`, { headers: tmdbHeaders })
        ]);
        const [trendMovie, trendTv, popularMovie, popularTv] = await Promise.all([
          trendMovieRes.json(), trendTvRes.json(), popularMovieRes.json(), popularTvRes.json()
        ]);
        setTrending({
          movie: (trendMovie.results || []).map(m => ({
            id: m.id, title: m.title, posterUrl: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : null,
            overview: m.overview, rating: m.vote_average
          })),
          tv: (trendTv.results || []).map(t => ({
            id: t.id, title: t.name, posterUrl: t.poster_path ? `https://image.tmdb.org/t/p/w500${t.poster_path}` : null,
            overview: t.overview, rating: t.vote_average
          }))
        });
        setPopular({
          movie: (popularMovie.results || []).map(m => ({
            id: m.id, title: m.title, posterUrl: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : null,
            overview: m.overview, rating: m.vote_average
          })),
          tv: (popularTv.results || []).map(t => ({
            id: t.id, title: t.name, posterUrl: t.poster_path ? `https://image.tmdb.org/t/p/w500${t.poster_path}` : null,
            overview: t.overview, rating: t.vote_average
          }))
        });
      } catch (e) {
        setTrending({ movie: [], tv: [] });
        setPopular({ movie: [], tv: [] });
      } finally {
        setRecsLoading(false);
      }
    };
    fetchRecs();
  }, [tmdbHeaders]);

  useEffect(() => {
    const fetchPersonalizedRecs = async () => {
      setIsPersonalizedLoading(true);
      try {
        const historyRes = await fetch('http://localhost:8080/api/history');
        if (!historyRes.ok) throw new Error('History fetch failed');
        const historyData = await historyRes.json();

        // [추가] 내 구독 플랫폼 정보 가져오기
        const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
        const userEmail = currentUser?.email || '';
        let subscriptionSet = new Set();
        if (userEmail) {
          const subRes = await fetch(`http://localhost:8080/api/providers/availability?title=Dune&email=${encodeURIComponent(userEmail)}&region=KR`);
          if (subRes.ok) {
            const subData = await subRes.json();
            // subData.userSubscriptions 등을 활용해 정규화된 구독 목록 생성
            (subData.userSubscriptions || []).forEach(s => {
              subscriptionSet.add(s.toLowerCase().replace(/ /g, '').replace(/\+/g, 'plus'));
            });
          }
        }

        if (historyData.length === 0) {
          setPersonalized([]);
          return;
        }

        // 1. 최신 시청 기록 3개에 대해 추천 가져오기
        const recentHistory = historyData.slice(0, 3);
        const recommendationsPromises = recentHistory.map(async (item) => {
          // TMDB ID 찾기
          const searchRes = await fetch(
            `${TMDB_BASE_URL}/search/multi?query=${encodeURIComponent(item.title)}&language=ko-KR&page=1`,
            { headers: tmdbHeaders }
          );
          const searchData = await searchRes.json();
          const match = (searchData.results || []).find(r => r.media_type === 'movie' || r.media_type === 'tv');

          if (match) {
            const recRes = await fetch(
              `${TMDB_BASE_URL}/${match.media_type}/${match.id}/recommendations?language=ko-KR&page=1`,
              { headers: tmdbHeaders }
            );
            const recData = await recRes.json();
            
            // [수정] 각 추천 작품이 내 구독 플랫폼에 있는지 실시간 확인
            const rawRecs = recData.results || [];
            const filteredRecs = await Promise.all(rawRecs.map(async (r) => {
              const pRes = await fetch(`${TMDB_BASE_URL}/${r.media_type || match.media_type}/${r.id}/watch/providers`, { headers: tmdbHeaders });
              const pData = await pRes.json();
              const krProviders = pData.results?.KR?.flatrate || [];
              
              // 내 구독 플랫폼 중 하나라도 일치하는지 확인
              const isAvailable = krProviders.some(p => {
                const normalizedP = p.provider_name.toLowerCase().replace(/ /g, '').replace(/\+/g, 'plus');
                return subscriptionSet.has(normalizedP);
              });

              if (isAvailable || subscriptionSet.size === 0) { // 구독 정보가 없으면 전체 표시, 있으면 필터링
                return {
                  id: r.id,
                  title: r.title || r.name,
                  posterUrl: r.poster_path ? `https://image.tmdb.org/t/p/w500${r.poster_path}` : null,
                  overview: r.overview,
                  rating: r.vote_average,
                  isAvailable: isAvailable
                };
              }
              return null;
            }));

            return filteredRecs.filter(r => r !== null);
          }
          return [];
        });

        const resultsArrays = await Promise.all(recommendationsPromises);
        const allResults = resultsArrays.flat();

        // 2. 중복 제거 및 무작위 10개 추출
        const uniqueResults = Array.from(new Map(allResults.map(item => [item.id, item])).values());
        setPersonalized(uniqueResults.sort(() => 0.5 - Math.random()).slice(0, 10));
      } catch (e) {
        console.error("Personalized recs error:", e);
        setPersonalized([]);
      } finally {
        setIsPersonalizedLoading(false);
      }
    };

    fetchPersonalizedRecs();
  }, [tmdbHeaders]);

  useEffect(() => {
    const delay = setTimeout(() => {
      if (searchTerm) search(searchTerm);
    }, 500);
    return () => clearTimeout(delay);
  }, [searchTerm, search]);

  return (
    <section className="w-full p-4 space-y-8">
      <div className="px-2">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">전체 영화/TV 검색</h2>
        <input
          type="text"
          placeholder="검색어를 입력하세요..."
          className="w-full max-w-lg px-6 py-3 text-lg border-2 border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-800 px-2">맞춤형 추천</h3>
        {isPersonalizedLoading ? (
          <div className="p-6 text-center text-gray-400">나의 취향을 분석 중...</div>
        ) : personalized.length === 0 ? (
          <div className="p-10 text-center border-2 border-dashed rounded-3xl text-gray-400">
            시청 기록이 쌓이면 맞춤 추천이 시작됩니다.
          </div>
        ) : (
          <div className="flex overflow-x-auto space-x-4 px-2 pb-2">
            {personalized.map(item => (
              <div key={item.id} className="min-w-[180px] max-w-[180px]">
                <MediaCard
                  title={item.title}
                  posterUrl={item.posterUrl}
                  overview={item.overview}
                  rating={item.rating}
                  progress={0}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-xl font-semibold text-gray-800">트렌드</h3>
          <div className="space-x-2">
            <button onClick={() => setTrendTab('movie')} className={`px-3 py-1 rounded-full border ${trendTab==='movie'?'bg-blue-600 text-white border-blue-600':'bg-white text-gray-700'}`}>영화</button>
            <button onClick={() => setTrendTab('tv')} className={`px-3 py-1 rounded-full border ${trendTab==='tv'?'bg-blue-600 text-white border-blue-600':'bg-white text-gray-700'}`}>TV</button>
          </div>
        </div>
        {recsLoading ? (
          <div className="p-6 text-center text-gray-400">불러오는 중...</div>
        ) : (
          <div className="flex overflow-x-auto space-x-4 px-2 pb-2">
            {(trending[trendTab] || []).map(item => (
              <div key={item.id} className="min-w-[180px] max-w-[180px]">
                <MediaCard
                  title={item.title}
                  posterUrl={item.posterUrl}
                  overview={item.overview}
                  rating={item.rating}
                  progress={0}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-xl font-semibold text-gray-800">인기 콘텐츠</h3>
          <div className="space-x-2">
            <button onClick={() => setPopularTab('movie')} className={`px-3 py-1 rounded-full border ${popularTab==='movie'?'bg-blue-600 text-white border-blue-600':'bg-white text-gray-700'}`}>영화</button>
            <button onClick={() => setPopularTab('tv')} className={`px-3 py-1 rounded-full border ${popularTab==='tv'?'bg-blue-600 text-white border-blue-600':'bg-white text-gray-700'}`}>TV</button>
          </div>
        </div>
        {recsLoading ? (
          <div className="p-6 text-center text-gray-400">불러오는 중...</div>
        ) : (
          <div className="flex overflow-x-auto space-x-4 px-2 pb-2">
            {(popular[popularTab] || []).map(item => (
              <div key={item.id} className="min-w-[180px] max-w-[180px]">
                <MediaCard
                  title={item.title}
                  posterUrl={item.posterUrl}
                  overview={item.overview}
                  rating={item.rating}
                  progress={0}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-800 px-2">검색 결과</h3>
        {loading ? (
          <div className="p-20 text-center text-gray-400">데이터를 검색하는 중...</div>
        ) : results.length === 0 ? (
          <div className="p-20 text-center border-2 border-dashed rounded-3xl text-gray-400">
            {searchTerm ? "검색 결과가 없습니다." : "찾고 싶은 영화나 TV 쇼를 검색해보세요."}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {results.map((item) => (
              <MediaCard
                key={item.id}
                title={item.title}
                posterUrl={item.posterUrl}
                overview={item.overview}
                rating={item.rating}
                providerStatuses={item.providerStatuses}
                progress={0}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default GlobalSearchPage;
