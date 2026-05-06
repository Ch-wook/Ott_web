import React, { useState, useEffect, useCallback } from 'react';
import { Tv } from 'lucide-react';
import MediaCard from '../components/MediaCard';
import SkeletonCard from '../components/SkeletonCard';

const TMDB_ACCESS_TOKEN = import.meta.env.VITE_TMDB_ACCESS_TOKEN;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const API_BASE_URL = 'http://localhost:8080';

const TvShowsPage = ({ searchTerm = '', isDarkMode }) => {
  const [tvShows, setTvShows] = useState([]);
  const [loading, setLoading] = useState(true);

  const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
  const userEmail = currentUser?.email || '';

  const textPrimary = isDarkMode ? "text-white" : "text-slate-900";
  const textMuted = isDarkMode ? "text-slate-500" : "text-slate-400";

  const fetchProviderAvailability = useCallback(async (title) => {
    if (!userEmail) return [];
    try {
      const response = await fetch(`${API_BASE_URL}/api/providers/availability?title=${encodeURIComponent(title)}&email=${encodeURIComponent(userEmail)}&region=KR`);
      if (response.ok) {
        const data = await response.json();
        return data.providers || [];
      }
    } catch (error) { console.error('플랫폼 정보 로드 실패:', error); }
    return [];
  }, [userEmail]);

  const fetchHistory = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/history`);
      if (!response.ok) throw new Error('서버 연결 실패');
      const historyData = await response.json();

      const enrichedShows = await Promise.all(
        historyData.map(async (show) => {
          try {
            const tmdbResp = await fetch(
              `${TMDB_BASE_URL}/search/multi?query=${encodeURIComponent(show.title)}&include_adult=false&language=ko-KR&page=1`,
              { headers: { Authorization: `Bearer ${TMDB_ACCESS_TOKEN}` } }
            );
            const tmdbData = await tmdbResp.json();
            const detail = tmdbData.results?.find(r => r.media_type === 'movie' || r.media_type === 'tv') || tmdbData.results?.[0] || {};
            const providerStatuses = await fetchProviderAvailability(show.title);
            return {
              ...show,
              posterUrl: detail.poster_path ? `https://image.tmdb.org/t/p/w500${detail.poster_path}` : null,
              overview: detail.overview || '상세 정보가 없습니다.',
              rating: detail.vote_average || 0,
              mediaType: detail?.media_type || (show.subTitle ? 'tv' : 'movie'),
              providerStatuses
            };
          } catch { return { ...show, mediaType: show.subTitle ? 'tv' : 'movie' }; }
        })
      );

      const tvOnly = enrichedShows.filter(item => item.mediaType === 'tv');
      tvOnly.sort((a, b) => b.id - a.id);
      setTvShows(tvOnly);
    } catch (error) { console.error("데이터 로드 에러:", error); } finally { setLoading(false); }
  }, [fetchProviderAvailability]);

  useEffect(() => {
    fetchHistory();
    const interval = setInterval(fetchHistory, 15000);
    return () => clearInterval(interval);
  }, [fetchHistory]);

  const handleDelete = async (id, title) => {
    if (!window.confirm(`'${title}' 시청 기록을 삭제하시겠습니까?`)) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/history/${id}`, { method: 'DELETE' });
      if (response.ok) setTvShows(tvShows.filter((s) => s.id !== id));
    } catch (error) { console.error("삭제 에러:", error); }
  };

  const filteredShows = tvShows.filter((s) =>
    s.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <section className="w-full animate-in fade-in duration-700">
      <div className="flex items-center gap-4 mb-10 px-1">
        <div className={`w-1 h-7 ${isDarkMode ? 'bg-indigo-400' : 'bg-indigo-500'} rounded-full shadow-[0_0_12px_rgba(99,102,241,0.6)]`} />
        <h2 className={`text-xl font-bold ${textPrimary} tracking-widest uppercase`}>TV 시리즈 보관함</h2>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
          {[...Array(10)].map((_, i) => <SkeletonCard key={i} isDarkMode={isDarkMode} />)}
        </div>
      ) : filteredShows.length === 0 ? (
        <div className={`p-32 text-center rounded-3xl border-2 border-dashed flex flex-col items-center gap-5 ${isDarkMode ? 'border-white/[0.07] bg-white/[0.02]' : 'border-slate-200/60 bg-white/30'}`}>
          <Tv size={44} className={isDarkMode ? 'text-slate-700' : 'text-slate-300'} />
          <p className={`${textMuted} font-bold text-sm uppercase tracking-widest`}>보관함에 저장된 TV 시리즈가 없습니다</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
          {filteredShows.map((show) => (
            <MediaCard
              key={show.id}
              id={show.id}
              title={show.subTitle ? `${show.title} : ${show.subTitle}` : show.title}
              rawTitle={show.title}
              progress={show.progress || 0}
              posterUrl={show.posterUrl}
              overview={show.overview}
              rating={show.rating}
              url={show.url}
              platform={show.platform}
              providerStatuses={show.providerStatuses}
              onDelete={handleDelete}
              isDarkMode={isDarkMode}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default TvShowsPage;
