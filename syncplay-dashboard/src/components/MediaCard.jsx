import React, { useState } from 'react';
import { Star, Play, X, Trash2 } from 'lucide-react';

const OTT_LOGOS = {
  "netflix": "/logos/netflix.png",
  "tving": "/logos/tving.png",
  "disneyplus": "/logos/disneyplus.svg",
  "disney+": "/logos/disneyplus.svg",
  "coupangplay": "/logos/coupangplay.png",
  "coupang play": "/logos/coupangplay.png",
  "wavve": "/logos/wavve.png"
};

const MediaCard = ({ id, title, rawTitle, progress, posterUrl, overview, rating, url, platform, onDelete, isDarkMode }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const displayTitle = title || "제목 없음";
  const displayProgress = parseFloat(progress) || 0;
  const displayRating = typeof rating === 'number' ? rating.toFixed(1) : "0.0";
  const displayOverview = overview || "상세 정보가 등록되지 않은 콘텐츠입니다.";
  const defaultPoster = 'https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?q=80&w=400';
  const finalPoster = posterUrl || defaultPoster;

  const textPrimary = isDarkMode ? "text-white" : "text-slate-900";
  const textSecondary = isDarkMode ? "text-slate-500" : "text-slate-500";
  const accentText = isDarkMode ? "text-indigo-400" : "text-indigo-600";

  const glass = isDarkMode
    ? "bg-white/[0.03] backdrop-blur-xl border border-white/[0.08]"
    : "bg-white/55 backdrop-blur-xl border border-white/50 shadow-xl shadow-slate-100/30";

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

  const getPlatformStyle = (plat) => {
    const platKey = plat?.toLowerCase();
    if (platKey && OTT_LOGOS[platKey]) {
      return { iconUrl: OTT_LOGOS[platKey], name: plat || platKey.toUpperCase() };
    }
    return { text: 'OTT', name: plat || '알 수 없음' };
  };

  const platStyle = getPlatformStyle(platform);

  return (
    <>
      <div
        onClick={() => setIsModalOpen(true)}
        className={`flex flex-col w-full transition-all duration-500 hover:-translate-y-2 cursor-pointer group ${glass} rounded-2xl p-2 relative overflow-hidden hover:border-white/[0.16] hover:shadow-2xl`}
      >
        <button
          onClick={handleDeleteClick}
          className={`absolute top-4 right-4 z-20 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 border ${isDarkMode ? "bg-black/60 backdrop-blur-xl hover:bg-red-600 text-white border-white/10" : "bg-white/80 backdrop-blur-xl hover:bg-red-600 hover:text-white border-white/50"}`}
          title="기록 삭제"
        >
          <Trash2 size={16} />
        </button>

        <div className="w-full aspect-[2/3] rounded-xl overflow-hidden relative">
          <div className={`absolute top-3 left-3 z-10 px-2.5 py-1 rounded-lg flex items-center justify-center ${isDarkMode ? 'bg-black/50 backdrop-blur-xl border border-white/10' : 'bg-white/70 backdrop-blur-xl border border-white/50'}`}>
            {platStyle.iconUrl ? (
              <img src={platStyle.iconUrl} alt={platStyle.name} className={`h-3 w-auto object-contain ${isDarkMode ? 'filter brightness-110' : ''}`} />
            ) : (
              <span className={`${isDarkMode ? 'text-white' : 'text-slate-900'} text-[9px] font-black tracking-widest uppercase`}>{platStyle.text}</span>
            )}
          </div>

          <img
            src={finalPoster}
            alt={displayTitle}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />

          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none z-10">
            <div className="w-14 h-14 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/20 shadow-2xl">
              <Play className="text-white fill-white translate-x-0.5" size={24} />
            </div>
          </div>

          {/* 진행률 바 */}
          <div className={`absolute bottom-0 left-0 right-0 h-1 ${isDarkMode ? 'bg-white/[0.06]' : 'bg-slate-200/60'} z-10`}>
            <div
              className={`h-full ${isDarkMode ? 'bg-indigo-400' : 'bg-indigo-500'} shadow-[0_0_12px_rgba(99,102,241,0.7)] transition-all duration-700`}
              style={{ width: `${displayProgress}%` }}
            />
          </div>
        </div>

        <div className="mt-4 px-2 pb-2">
          <h3 className={`text-sm font-bold ${textPrimary} truncate tracking-tight group-hover:${accentText} transition-colors`}>{displayTitle}</h3>
          <p className={`text-[10px] font-bold ${textSecondary} mt-1 uppercase tracking-widest flex items-center gap-2`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isDarkMode ? 'bg-indigo-400' : 'bg-indigo-500'} shadow-[0_0_8px_rgba(99,102,241,0.8)]`} />
            {Math.round(displayProgress)}% 시청
          </p>
        </div>
      </div>

      {isModalOpen && (
        <div
          onClick={() => setIsModalOpen(false)}
          className={`fixed inset-0 z-[999] flex items-center justify-center p-6 backdrop-blur-2xl animate-in fade-in duration-300 ${isDarkMode ? 'bg-black/70' : 'bg-slate-900/30'}`}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`rounded-3xl overflow-hidden max-w-5xl w-full shadow-2xl border relative animate-in zoom-in-95 duration-300 ${isDarkMode ? 'bg-[#0d0d10]/90 backdrop-blur-2xl border-white/[0.1]' : 'bg-white/80 backdrop-blur-2xl border-white/60'}`}
          >
            <div className="flex flex-col md:flex-row h-full">
              <div className="md:w-[45%] bg-black relative overflow-hidden">
                <img src={finalPoster} className="w-full h-full object-cover" alt="poster" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/30" />
              </div>

              <div className="p-12 md:w-[55%] flex flex-col justify-between relative">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className={`absolute top-6 right-8 p-3 rounded-xl transition-all border ${isDarkMode ? 'bg-white/[0.05] border-white/[0.08] text-slate-500 hover:text-white hover:bg-white/[0.1]' : 'bg-white/60 border-slate-200/60 text-slate-400 hover:text-slate-900'}`}
                >
                  <X size={20} />
                </button>

                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <span className={`flex items-center gap-2 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border ${isDarkMode ? 'bg-white/[0.05] border-white/[0.08] text-white' : 'bg-slate-50/80 border-slate-200/70 text-slate-700'}`}>
                      {platStyle.iconUrl && <img src={platStyle.iconUrl} alt={platStyle.name} className={`h-3 w-auto object-contain ${isDarkMode ? 'filter brightness-110' : ''}`} />}
                      {platStyle.name}
                    </span>
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border ${isDarkMode ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-indigo-50/80 border-indigo-200/60 text-indigo-700'}`}>
                      <Star size={14} className={isDarkMode ? 'fill-indigo-400 text-indigo-400' : 'fill-indigo-500 text-indigo-500'} />
                      <span className="text-sm font-bold">{displayRating}</span>
                    </div>
                  </div>

                  <h2 className={`text-4xl font-black ${textPrimary} mb-6 tracking-tighter leading-tight`}>{displayTitle}</h2>

                  <div className={`mb-8 p-6 rounded-2xl border ${isDarkMode ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-white/50 border-slate-100/80'}`}>
                    <h4 className={`text-[10px] font-bold ${textSecondary} uppercase tracking-[0.2em] mb-3`}>줄거리</h4>
                    <p className={`leading-relaxed font-medium text-base max-h-40 overflow-y-auto pr-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{displayOverview}</p>
                  </div>
                </div>

                <div className="flex gap-4 mt-4">
                  <button
                    onClick={handlePlayClick}
                    className={`flex-1 font-bold py-4 rounded-2xl flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all ${isDarkMode ? 'bg-indigo-500 text-white hover:bg-indigo-400 shadow-indigo-500/25' : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-600/20'}`}
                  >
                    <Play size={20} className="fill-white" />
                    <span className="text-lg">지금 시청</span>
                  </button>
                  <button
                    onClick={() => { setIsModalOpen(false); onDelete(id, rawTitle); }}
                    className={`px-6 rounded-2xl flex items-center justify-center transition-all border ${isDarkMode ? 'bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-600 hover:text-white' : 'bg-red-50/80 border-red-100 text-red-600 hover:bg-red-600 hover:text-white'}`}
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MediaCard;
