import React, { useState } from 'react';
import { Star, Play, X, Film, Trash2 } from 'lucide-react';

const MediaCard = ({ id, title, rawTitle, progress, posterUrl, overview, rating, url, platform, onDelete }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const displayTitle = title || "제목 없음";
  const displayProgress = parseFloat(progress) || 0;
  const displayRating = typeof rating === 'number' ? rating.toFixed(1) : "0.0";
  const displayOverview = overview || "상세 정보가 등록되지 않은 콘텐츠입니다.";
  const defaultPoster = 'https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?q=80&w=400';
  const finalPoster = posterUrl || defaultPoster;

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    onDelete(id, rawTitle);
  };

  const handlePlayClick = () => {
    if (url && url !== 'undefined') {
      window.open(url, '_blank');
    } else {
      alert("저장된 영상 주소가 없습니다. 확장 프로그램에서 다시 정보를 추출해주세요.");
    }
  };

  // 플랫폼별 로고 및 스타일 (가독성을 위해 배경과 로고 주소 최적화)
  const getPlatformStyle = (plat) => {
    switch (plat?.toLowerCase()) {
      case 'netflix': 
        return { 
          iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg', // 안정적인 워드마크형 로고
          name: 'Netflix' 
        };
      case 'tving': 
        return { 
          iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/e4/TVING_logo.svg',
          name: 'TVING' 
        };
      case 'disneyplus': 
        return { 
          iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/3/3e/Disney%2B_logo.svg',
          name: 'Disney+' 
        };
      default: 
        return { 
          text: 'OTT', 
          name: plat || 'Unknown' 
        };
    }
  };
  const platStyle = getPlatformStyle(platform);

  return (
    <>
      <div 
        onClick={() => setIsModalOpen(true)}
        className="flex flex-col w-full transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer group bg-white rounded-2xl p-2 border border-gray-100 relative"
      >
        <button 
          onClick={handleDeleteClick}
          className="absolute top-4 right-4 z-20 p-2 bg-black/60 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 backdrop-blur-sm"
          title="기록 삭제"
        >
          <Trash2 size={16} />
        </button>

        <div className="w-full aspect-[2/3] bg-slate-100 rounded-xl overflow-hidden relative shadow-sm">
          
          {/* [개선됨] 가독성을 위해 배경을 밝은 화이트 톤으로 변경하고 테두리 추가 */}
          <div className="absolute top-3 left-3 z-10 bg-white/95 backdrop-blur-sm px-2.5 py-1.5 rounded-lg shadow-md flex items-center justify-center min-w-[40px] min-h-[28px] border border-gray-100">
            {platStyle.iconUrl ? (
              <img src={platStyle.iconUrl} alt={platStyle.name} className="h-3 object-contain" />
            ) : (
              <span className="text-gray-800 text-[10px] font-black">{platStyle.text}</span>
            )}
          </div>

          <img 
            src={finalPoster} 
            alt={displayTitle} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
            onError={(e) => { e.target.src = defaultPoster; }}
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none z-10">
            <Play className="text-white fill-white" size={36} />
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/50 z-10">
            <div className="h-full bg-red-600 transition-all duration-500" style={{ width: `${displayProgress}%` }} />
          </div>
        </div>
        <div className="mt-3 px-1 pb-1">
          <h3 className="text-sm font-bold text-slate-800 truncate">{displayTitle}</h3>
          <p className="text-[11px] font-bold text-red-600 mt-1">{Math.round(displayProgress)}% 시청 중</p>
        </div>
      </div>

      {isModalOpen && (
        <div onClick={() => setIsModalOpen(false)} className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-3xl overflow-hidden max-w-2xl w-full shadow-2xl relative animate-in zoom-in-95 duration-300">
            <div className="relative h-72 sm:h-96 bg-black flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0">
                <img src={finalPoster} className="w-full h-full object-cover blur-2xl opacity-40 scale-110" alt="bg" />
              </div>
              <img src={finalPoster} className="relative h-[90%] object-contain rounded-lg shadow-2xl border border-white/10" alt="poster" />
              <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 w-10 h-10 flex-shrink-0 flex items-center justify-center bg-black/40 hover:bg-black/70 text-white rounded-full backdrop-blur-md transition-all z-50 border border-white/20">
                <X size={20} strokeWidth={3} />
              </button>
            </div>
            
            <div className="p-8 bg-white relative">
              <div className="flex justify-between items-start mb-6">
                <div className="flex-1">
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-3 tracking-tight">{displayTitle}</h2>
                  <div className="flex flex-wrap items-center gap-3">
                    
                    {/* 모달 내부 로고 배지도 밝은 톤으로 통일 */}
                    <span className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 text-gray-800 rounded-full text-[11px] font-bold shadow-sm border border-gray-100">
                      {platStyle.iconUrl && <img src={platStyle.iconUrl} alt={platStyle.name} className="h-2.5 object-contain" />}
                      {platStyle.name}
                    </span>
                    
                    <span className="flex items-center gap-1 px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-[11px] font-bold border border-slate-200">
                      <Film size={14} /> 4K ULTRA HD
                    </span>
                    <div className="flex items-center gap-1.5 bg-yellow-50 px-3 py-1 rounded-full border border-yellow-200">
                      <Star size={16} className="fill-yellow-500 text-yellow-500" />
                      <span className="text-sm font-black text-yellow-700">{displayRating}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mb-8">
                <p className="text-slate-600 leading-relaxed text-[15px] bg-slate-50 p-5 rounded-2xl border border-slate-100 max-h-32 overflow-y-auto">
                  {displayOverview}
                </p>
              </div>
              <div className="flex gap-3">
                <button onClick={handlePlayClick} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-blue-200 transition-transform active:scale-95">
                  <Play size={20} className="fill-white" /> {platStyle.name}에서 이어보기
                </button>
                <button onClick={() => { setIsModalOpen(false); onDelete(id, rawTitle); }} className="px-6 bg-red-50 hover:bg-red-100 text-red-600 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-colors border border-red-100">
                  <Trash2 size={20} /> 삭제
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MediaCard;