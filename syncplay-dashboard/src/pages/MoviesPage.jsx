import React, { useState, useEffect, useCallback } from 'react';
import MediaCard from '../components/MediaCard';

const TMDB_ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIwNmViOTIxZDczYTdmMDgyMDJjZjRiNjJkZWE4ZTcwMCIsIm5iZiI6MTc3NDM5OTY5NS42NzIsInN1YiI6IjY5YzMzMGNmOTYxZmZlOWFmZDZhYzA5YyIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.kSddRgvZuFP6as-RkpfFIFSo2P7P2UqyVuotXKAbKJA';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const API_BASE_URL = 'http://localhost:8080'; // 민우님 환경에 맞춰 8080으로 유지

const MoviesPage = ({ searchTerm = '' }) => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  // [팀원 기능 추가] 내 이메일 가져오기
  const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
  const userEmail = currentUser?.email || '';

  // [팀원 기능 추가] 영화 제목으로 구독 플랫폼 정보를 가져오는 함수
  const fetchProviderAvailability = useCallback(async (title) => {
    if (!userEmail) return [];
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/providers/availability?title=${encodeURIComponent(title)}&email=${encodeURIComponent(userEmail)}&region=KR`
      );
      if (response.ok) {
        const data = await response.json();
        return data.providers || [];
      }
    } catch (error) {
      console.error('플랫폼 정보 로드 실패:', error);
    }
    return [];
  }, [userEmail]);

  const MOVIE_GENRES = {
    28: '액션', 12: '모험', 16: '애니메이션', 35: '코미디', 80: '범죄',
    99: '다큐', 18: '드라마', 10751: '가족', 14: '판타지', 36: '역사',
    27: '공포', 10402: '음악', 9648: '미스터리', 10749: '로맨스', 878: 'SF',
    10770: 'TV 영화', 53: '스릴러', 10752: '전쟁', 37: '서부'
  };

  const fetchMovieDetail = async (title) => {
    try {
      const response = await fetch(
        `${TMDB_BASE_URL}/search/multi?query=${encodeURIComponent(title)}&include_adult=false&language=ko-KR&page=1`,
        {
          headers: { Authorization: `Bearer ${TMDB_ACCESS_TOKEN}` }
        }
      );
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        const item = data.results.find(res => res.media_type === 'movie' || res.media_type === 'tv') || data.results[0];
        return {
          posterUrl: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
          overview: item.overview,
          rating: item.vote_average,
          mediaType: item.media_type,
          genreIds: item.genre_ids || []
        };
      }
    } catch (error) {
      console.error("TMDB API 호출 에러:", error);
    }
    return null;
  };

  const fetchHistory = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/history`);
      if (!response.ok) throw new Error('서버 연결 실패');
      const historyData = await response.json();

      const enrichedMovies = await Promise.all(
        historyData.map(async (movie) => {
          const detail = await fetchMovieDetail(movie.title);
          
          // [팀원 기능 추가] 플랫폼 구독 정보 가져오기 연동
          const providerStatuses = await fetchProviderAvailability(movie.title);

          let calculatedType = detail?.mediaType;
          if (!calculatedType) {
            calculatedType = movie.subTitle ? 'tv' : 'movie';
          }

          const primaryGenreId = detail?.genreIds?.[0];
          const primaryGenre = primaryGenreId ? (MOVIE_GENRES[primaryGenreId] || '기타') : '기타';

          return {
            ...movie,
            posterUrl: detail?.posterUrl || null,
            overview: detail?.overview || '상세 정보가 없습니다.',
            rating: detail?.rating || 0,
            mediaType: calculatedType,
            providerStatuses,
            primaryGenre
          };
        })
      );

      // 영화만 필터링하고 최신순 정렬 유지
      const moviesOnly = enrichedMovies.filter(item => item.mediaType === 'movie');
      moviesOnly.sort((a, b) => b.id - a.id);
      
      setMovies(moviesOnly);
    } catch (error) {
      console.error("데이터 로드 에러:", error);
    } finally {
      setLoading(false);
    }
  }, [fetchProviderAvailability]);

  // 15초 자동 갱신 유지
  useEffect(() => {
    fetchHistory();
    const interval = setInterval(fetchHistory, 15000);
    return () => clearInterval(interval);
  }, [fetchHistory]);

  const handleDelete = async (id, title) => {
    if (!window.confirm(`'${title}' 시청 기록을 삭제하시겠습니까?`)) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/history/${id}`, { method: 'DELETE' });
      if (response.ok) setMovies(movies.filter((movie) => movie.id !== id));
      else alert('삭제 실패');
    } catch (error) {
      console.error("삭제 에러:", error);
    }
  };

  const filteredMovies = movies.filter((movie) =>
    movie.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const grouped = filteredMovies.reduce((acc, m) => {
    const key = m.primaryGenre || '기타';
    if (!acc[key]) acc[key] = [];
    acc[key].push(m);
    return acc;
  }, {});

  return (
    <section className="w-full p-4">
      <h2 className="text-xl font-bold text-gray-800 mb-6 px-2">Movies (영화)</h2>
      {filteredMovies.length === 0 ? (
        <div className="p-20 text-center border-2 border-dashed rounded-3xl text-gray-400">
          {loading ? "데이터를 불러오는 중..." : "시청 중인 영화가 없습니다."}
        </div>
      ) : (
        Object.keys(grouped).sort().map((genre) => (
          <div key={genre} className="mb-8">
            <div className="flex items-center justify-between px-2 mb-3">
              <h3 className="text-lg font-semibold text-gray-800">{genre}</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {grouped[genre].map((movie) => (
                <MediaCard
                  key={movie.id}
                  id={movie.id}
                  title={movie.title}
                  rawTitle={movie.title}
                  progress={movie.progress}
                  posterUrl={movie.posterUrl}
                  overview={movie.overview}
                  rating={movie.rating}
                  url={movie.url}
                  platform={movie.platform}
                  providerStatuses={movie.providerStatuses}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </div>
        ))
      )}
    </section>
  );
};

export default MoviesPage;
