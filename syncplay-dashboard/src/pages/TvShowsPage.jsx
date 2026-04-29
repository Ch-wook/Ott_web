import React, { useState, useEffect } from 'react';
import MediaCard from '../components/MediaCard';

const TMDB_ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIwNmViOTIxZDczYTdmMDgyMDJjZjRiNjJkZWE4ZTcwMCIsIm5iZiI6MTc3NDM5OTY5NS42NzIsInN1YiI6IjY5YzMzMGNmOTYxZmZlOWFmZDZhYzA5YyIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.kSddRgvZuFP6as-RkpfFIFSo2P7P2UqyVuotXKAbKJA';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

const TvShowsPage = ({ searchTerm = '' }) => {
  const [tvShows, setTvShows] = useState([]);
  const [loading, setLoading] = useState(true);

  const TV_GENRES = {
    10759: '액션/모험', 16: '애니메이션', 35: '코미디', 80: '범죄', 99: '다큐',
    18: '드라마', 10751: '가족', 10762: '키즈', 9648: '미스터리', 10763: '뉴스',
    10764: '리얼리티', 10765: 'SF/판타지', 10766: '연속극', 10767: '토크', 10768: '전쟁/정치',
    37: '서부'
  };

  const fetchMovieDetail = async (title) => {
    try {
      const response = await fetch(
        `${TMDB_BASE_URL}/search/multi?query=${encodeURIComponent(title)}&include_adult=false&language=ko-KR&page=1`,
        {
          method: 'GET',
          headers: {
            accept: 'application/json',
            Authorization: `Bearer ${TMDB_ACCESS_TOKEN}`
          }
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

  const fetchHistory = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/history');
      if (!response.ok) throw new Error('서버 연결 실패');
      const historyData = await response.json();

      const enrichedShows = await Promise.all(
        historyData.map(async (show) => {
          const detail = await fetchMovieDetail(show.title);
          
          let calculatedType = detail?.mediaType;
          if (!calculatedType) {
            calculatedType = show.subTitle ? 'tv' : 'movie';
          }

          const primaryGenreId = detail?.genreIds?.[0];
          const primaryGenre = primaryGenreId ? (TV_GENRES[primaryGenreId] || '기타') : '기타';

          return {
            ...show,
            posterUrl: detail?.posterUrl || null,
            overview: detail?.overview || '상세 정보가 없습니다.',
            rating: detail?.rating || 0,
            mediaType: calculatedType,
            primaryGenre
          };
        })
      );

      // [분리 로직] mediaType이 'tv'인 데이터만 남기고 최신순 정렬
      const tvOnly = enrichedShows.filter(item => item.mediaType === 'tv');
      tvOnly.sort((a, b) => b.id - a.id);
      
      setTvShows(tvOnly);
    } catch (error) {
      console.error("데이터 로드 에러:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    const interval = setInterval(fetchHistory, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleDelete = async (id, title) => {
    if (!window.confirm(`'${title}' 시청 기록을 삭제하시겠습니까?`)) return;
    try {
      const response = await fetch(`http://localhost:8080/api/history/${id}`, { method: 'DELETE' });
      if (response.ok) setTvShows(tvShows.filter((show) => show.id !== id));
      else alert('삭제 실패');
    } catch (error) {
      console.error("삭제 에러:", error);
    }
  };

  const filteredShows = tvShows.filter((show) =>
    show.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const grouped = filteredShows.reduce((acc, s) => {
    const key = s.primaryGenre || '기타';
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});

  return (
    <section className="w-full p-4">
      <h2 className="text-xl font-bold text-gray-800 mb-6 px-2">TV Shows (시리즈/드라마)</h2>
      
      {filteredShows.length === 0 ? (
        <div className="p-20 text-center border-2 border-dashed rounded-3xl text-gray-400">
          {loading ? "데이터를 불러오는 중..." : "시청 중인 TV 쇼가 없습니다."}
        </div>
      ) : (
        Object.keys(grouped).sort().map((genre) => (
          <div key={genre} className="mb-8">
            <div className="flex items-center justify-between px-2 mb-3">
              <h3 className="text-lg font-semibold text-gray-800">{genre}</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {grouped[genre].map((show) => (
                <MediaCard 
                  key={show.id} 
                  id={show.id}
                  title={show.subTitle ? `${show.title} : ${show.subTitle}` : show.title} 
                  rawTitle={show.title}
                  progress={show.progress} 
                  posterUrl={show.posterUrl}
                  overview={show.overview} 
                  rating={show.rating}
                  url={show.url}
                  platform={show.platform}
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

export default TvShowsPage;
