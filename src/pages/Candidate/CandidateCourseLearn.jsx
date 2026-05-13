// pages/Candidate/CandidateCourseLearn.jsx
// Candidate-only: Learning interface — video must be fully watched before module can be completed
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  CheckCircle2, ChevronLeft, ChevronRight, Award, Zap,
  BookOpen, Clock, PlayCircle, Download, AlertCircle, RefreshCw,
  Trophy, Lock, Video, ExternalLink, Timer, CheckSquare, Home, Menu, X
} from 'lucide-react';
import CandidateLayout from '../../components/layout/CandidateLayout';
import { CourseLearnSkeleton } from '../../components/common/SkeletonLoader';
import { courseAPI } from '../../api/Api';

// ─── YouTube IFrame API singleton loader ───────────────────────────────────────
let _ytLoaded = false;
let _ytReady = false;
const _ytQueue = [];

const loadYouTubeAPI = () => {
  if (_ytLoaded) return;
  _ytLoaded = true;
  const s = document.createElement('script');
  s.src = 'https://www.youtube.com/iframe_api';
  document.head.appendChild(s);
  window.onYouTubeIframeAPIReady = () => {
    _ytReady = true;
    _ytQueue.forEach(cb => cb());
    _ytQueue.length = 0;
  };
};

const onYTReady = (cb) => {
  if (_ytReady && window.YT?.Player) { cb(); return; }
  _ytQueue.push(cb);
  loadYouTubeAPI();
};

// ─── URL detection helpers ─────────────────────────────────────────────────────
const detectVideoType = (url) => {
  if (!url) return null;
  if (/youtube\.com|youtu\.be/.test(url)) return 'youtube';
  if (/\.(mp4|webm|ogg|mov|mkv)(\?|$)/i.test(url)) return 'html5';
  if (/vimeo\.com/.test(url)) return 'vimeo';
  return 'iframe';
};

const toYouTubeEmbed = (url) => {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (!m) return url;
  return `https://www.youtube.com/embed/${m[1]}?enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}&rel=0`;
};

// ─── YouTube Player Component ──────────────────────────────────────────────────
const YouTubePlayer = ({ url, playerId, onComplete, alreadyWatched }) => {
  const playerRef  = useRef(null);
  const intervalRef = useRef(null);
  const [embedBlocked, setEmbedBlocked] = useState(false);
  const [openedOnYT, setOpenedOnYT] = useState(false);

  const getYouTubeId = (u) => {
    const m = u.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return m ? m[1] : null;
  };
  const videoId      = getYouTubeId(url);
  const watchUrl     = videoId ? `https://www.youtube.com/watch?v=${videoId}` : url;
  const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;

  useEffect(() => {
    if (alreadyWatched) return;
    const embedUrl = toYouTubeEmbed(url);
    if (!embedUrl.includes('enablejsapi')) return;

    onYTReady(() => {
      setTimeout(() => {
        try {
          playerRef.current = new window.YT.Player(playerId, {
            events: {
              onError: (e) => {
                if (e.data === 101 || e.data === 150) setEmbedBlocked(true);
              },
              onStateChange: (e) => {
                if (e.data === 0) { onComplete(); clearInterval(intervalRef.current); }
                if (e.data === 1) {
                  intervalRef.current = setInterval(() => {
                    try {
                      const p = playerRef.current;
                      if (!p?.getCurrentTime) return;
                      const curr = p.getCurrentTime();
                      const dur  = p.getDuration();
                      if (dur > 0 && curr / dur >= 0.9) { onComplete(); clearInterval(intervalRef.current); }
                    } catch (_) {}
                  }, 3000);
                } else { clearInterval(intervalRef.current); }
              }
            }
          });
        } catch (_) {}
      }, 300);
    });

    return () => {
      clearInterval(intervalRef.current);
      try { playerRef.current?.destroy(); } catch (_) {}
      playerRef.current = null;
    };
  }, [url, playerId, alreadyWatched]);

  if (embedBlocked) {
    return (
      <div className="aspect-video bg-gray-900 w-full rounded-xl overflow-hidden relative flex flex-col items-center justify-center gap-4 px-6 text-center">
        {thumbnailUrl && (
          <img src={thumbnailUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20 blur-sm" />
        )}
        <div className="relative z-10 flex flex-col items-center gap-3">
          <div className="w-14 h-14 bg-red-500/20 border border-red-400/40 rounded-2xl flex items-center justify-center">
            <svg className="w-7 h-7 text-red-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.2 8.2 0 004.79 1.53V6.77a4.85 4.85 0 01-1.02-.08z"/>
            </svg>
          </div>
          <div>
            <p className="text-white font-bold text-sm">Embedding Disabled</p>
            <p className="text-gray-300 text-xs mt-1 max-w-xs leading-relaxed">
              The video owner has disabled playback on external websites. Watch it directly on YouTube to complete this module.
            </p>
          </div>
          <div className="flex flex-col items-center gap-3 mt-1 w-full max-w-xs">
            <a href={watchUrl} target="_blank" rel="noreferrer"
              onClick={() => !alreadyWatched && setOpenedOnYT(true)}
              className="inline-flex items-center justify-center gap-2 w-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors shadow-lg">
              Open on YouTube →
            </a>
            {!alreadyWatched && openedOnYT && (
              <button onClick={onComplete}
                className="inline-flex items-center justify-center gap-1.5 w-full bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors">
                ✓ I've watched it — mark complete
              </button>
            )}
            {!alreadyWatched && !openedOnYT && (
              <p className="text-[11px] text-gray-400 text-center">
                Open the video on YouTube, watch it, then come back to mark it complete.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="aspect-video bg-black w-full">
      <iframe
        id={playerId}
        src={toYouTubeEmbed(url)}
        className="w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title="Module Video"
      />
    </div>
  );
};

// ─── HTML5 Video Player ────────────────────────────────────────────────────────
const HTML5VideoPlayer = ({ url, onComplete, alreadyWatched }) => {
  const videoRef = useRef(null);
  const handleTimeUpdate = useCallback(() => {
    if (alreadyWatched) return;
    const v = videoRef.current;
    if (!v || !v.duration) return;
    if (v.currentTime / v.duration >= 0.9) onComplete();
  }, [onComplete, alreadyWatched]);

  return (
    <div className="aspect-video bg-black w-full">
      <video ref={videoRef} src={url} controls controlsList="nodownload"
        onTimeUpdate={handleTimeUpdate} onEnded={!alreadyWatched ? onComplete : undefined}
        className="w-full h-full" onContextMenu={e => e.preventDefault()} />
    </div>
  );
};

// ─── Vimeo Player ─────────────────────────────────────────────────────────────
const VimeoPlayer = ({ url, onComplete, alreadyWatched }) => {
  const iframeRef = useRef(null);
  const getVimeoEmbed = (u) => {
    const m = u.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    return m ? `https://player.vimeo.com/video/${m[1]}?api=1` : u;
  };

  useEffect(() => {
    if (alreadyWatched) return;
    const handleMessage = (e) => {
      if (!e.data) return;
      try {
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        if (data.event === 'finish') onComplete();
        if (data.event === 'playProgress' && data.data?.percent >= 0.9) onComplete();
      } catch (_) {}
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [alreadyWatched, onComplete]);

  return (
    <div className="aspect-video bg-black w-full">
      <iframe ref={iframeRef} src={getVimeoEmbed(url)} className="w-full h-full"
        allow="autoplay; fullscreen; picture-in-picture" allowFullScreen title="Module Video" />
    </div>
  );
};

// ─── Timer Gate Player (generic iframe / Google Drive) ────────────────────────
const TimerGatePlayer = ({ url, moduleDuration, onComplete, alreadyWatched }) => {
  const requiredSeconds = Math.min(Math.max((moduleDuration || 0) * 60 * 0.7, 30), 300);
  const [elapsed, setElapsed] = useState(0);
  const [active, setActive] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (alreadyWatched || elapsed >= requiredSeconds || !active) return;
    timerRef.current = setInterval(() => {
      setElapsed(p => {
        const next = p + 1;
        if (next >= requiredSeconds) { clearInterval(timerRef.current); onComplete(); }
        return next;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [active, alreadyWatched, elapsed, requiredSeconds, onComplete]);

  const pct = Math.min((elapsed / requiredSeconds) * 100, 100);
  const remaining = Math.ceil(requiredSeconds - elapsed);

  return (
    <div className="space-y-3">
      <div className="aspect-video bg-black w-full relative">
        <iframe src={url} className="w-full h-full" allow="autoplay; fullscreen"
          allowFullScreen title="Module Video" onLoad={() => setActive(true)} />
      </div>
      {!alreadyWatched && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <Timer className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <div className="flex-1">
            <div className="flex justify-between text-xs text-amber-700 font-medium mb-1">
              <span>Watch time required</span>
              <span>{elapsed >= requiredSeconds ? 'Done ✓' : `${remaining}s remaining`}</span>
            </div>
            <div className="h-1.5 bg-amber-100 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Smart Video Player ────────────────────────────────────────────────────────
const SmartVideoPlayer = ({ url, moduleIndex, moduleDuration, onComplete, alreadyWatched }) => {
  const type = detectVideoType(url);
  const playerId = `yt-player-cand-${moduleIndex}`;
  if (type === 'youtube') return <YouTubePlayer url={url} playerId={playerId} onComplete={onComplete} alreadyWatched={alreadyWatched} />;
  if (type === 'html5')   return <HTML5VideoPlayer url={url} onComplete={onComplete} alreadyWatched={alreadyWatched} />;
  if (type === 'vimeo')   return <VimeoPlayer url={url} onComplete={onComplete} alreadyWatched={alreadyWatched} />;
  return <TimerGatePlayer url={url} moduleDuration={moduleDuration} onComplete={onComplete} alreadyWatched={alreadyWatched} />;
};

// ─── Session Storage helpers ───────────────────────────────────────────────────
const storageKey = (courseId) => `icl_cand_watched_${courseId}`;
const loadWatched = (courseId) => { try { return JSON.parse(sessionStorage.getItem(storageKey(courseId)) || '{}'); } catch { return {}; } };
const saveWatched = (courseId, data) => { try { sessionStorage.setItem(storageKey(courseId), JSON.stringify(data)); } catch (_) {} };

// ─── Main Component ────────────────────────────────────────────────────────────
const CandidateCourseLearn = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [course, setCourse]         = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [activeModule, setActiveModule]   = useState(0);
  const [marking, setMarking]             = useState(false);
  const [toast, setToast]                 = useState(null);
  const [sidebarOpen, setSidebarOpen]     = useState(true);
  const [completionCelebration, setCompletionCelebration] = useState(false);
  const [mobileModulesOpen, setMobileModulesOpen] = useState(false);
  const [videoWatched, setVideoWatched]   = useState({});

  useEffect(() => { fetchData(); }, [courseId]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await courseAPI.getCourseById(courseId);
      if (res.success) {
        setCourse(res.data);
        setEnrollment(res.data.enrollment);
        if (!res.data.enrollment) {
          // Not enrolled — redirect to course detail
          navigate(`/dashboard/candidate/courses/${courseId}`);
        } else {
          const stored = loadWatched(courseId);
          const prog   = res.data.enrollment?.moduleProgress || [];
          const merged = { ...stored };
          prog.forEach(m => { if (m.completed) merged[m.moduleIndex] = true; });
          setVideoWatched(merged);
        }
      } else {
        setError(res.message || 'Course not found');
      }
    } catch (err) {
      setError(err.message || 'Failed to load course');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleVideoWatched = useCallback((moduleIndex) => {
    setVideoWatched(prev => {
      const updated = { ...prev, [moduleIndex]: true };
      saveWatched(courseId, updated);
      return updated;
    });
    showToast('✅ Video watched! You can now mark this module complete.', 'success');
  }, [courseId]);

  const handleMarkComplete = async (moduleIndex, completed) => {
    setMarking(true);
    try {
      const res = await courseAPI.updateModuleProgress(courseId, { moduleIndex, completed });
      if (res.success) {
        setEnrollment(prev => {
          const updated = { ...prev };
          updated.moduleProgress = updated.moduleProgress.map(m =>
            m.moduleIndex === moduleIndex
              ? { ...m, completed, completedAt: completed ? new Date() : null }
              : m
          );
          updated.overallProgress   = res.data.overallProgress;
          updated.status            = res.data.status;
          if (res.data.certificateUrl) {
            updated.certificateUrl    = res.data.certificateUrl;
            updated.certificateIssued = true;
          }
          return updated;
        });
        if (res.data.status === 'completed') {
          setCompletionCelebration(true);
          setTimeout(() => setCompletionCelebration(false), 5000);
          showToast('🎉 Course completed! Certificate generated!', 'success');
        } else if (res.data.assessmentTriggered) {
          showToast('Assessment unlocked! Check your assessments.', 'success');
        } else {
          showToast(completed ? 'Module marked as complete!' : 'Module marked as incomplete');
        }
        if (completed && activeModule < (course.curriculum?.length || 0) - 1) {
          setTimeout(() => setActiveModule(prev => prev + 1), 800);
        }
      } else {
        showToast(res.message || 'Failed to update progress', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Failed to update progress', 'error');
    } finally {
      setMarking(false);
    }
  };

  const canAccessModule = (i, moduleProgress) => {
    if (i === 0) return true;
    const prev = moduleProgress.find(m => m.moduleIndex === i - 1);
    const curr = moduleProgress.find(m => m.moduleIndex === i);
    return curr?.completed || prev?.completed;
  };

  const handleModuleClick = (i) => {
    const moduleProgress = enrollment?.moduleProgress || [];
    if (!canAccessModule(i, moduleProgress)) {
      showToast(`⚠️ Complete Module ${i} first to unlock this module.`, 'error');
      return;
    }
    setActiveModule(i);
    setMobileModulesOpen(false);
  };

  const handleNextModule = () => {
    const next = activeModule + 1;
    const moduleProgress = enrollment?.moduleProgress || [];
    if (!canAccessModule(next, moduleProgress)) {
      showToast('Complete this module first before proceeding.', 'error');
      return;
    }
    setActiveModule(next);
  };

  if (loading) return <CourseLearnSkeleton />;

  if (error || !course) {
    return (
      <CandidateLayout title="Learn">
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
          <AlertCircle className="w-12 h-12 text-red-400" />
          <p className="text-gray-600">{error || 'Course not found'}</p>
          <button onClick={() => navigate('/dashboard/candidate/my-courses')} className="text-blue-600 underline text-sm">
            ← Back to My Courses
          </button>
        </div>
      </CandidateLayout>
    );
  }

  const curriculum        = course.curriculum || [];
  const moduleProgress    = enrollment?.moduleProgress || [];
  const overallProgress   = enrollment?.overallProgress || 0;
  const isCompleted       = enrollment?.status === 'completed';
  const currentModule     = curriculum[activeModule];
  const currentProgress   = moduleProgress.find(m => m.moduleIndex === activeModule);
  const isCurrentComplete = currentProgress?.completed || false;
  const completedCount    = moduleProgress.filter(m => m.completed).length;

  const primaryVideoUrl      = currentModule?.videoUrl || (activeModule === 0 ? course.videoUrl : null) || null;
  const hasVideo             = !!primaryVideoUrl;
  const videoWatchedForModule = videoWatched[activeModule] || false;
  const canMarkComplete      = isCurrentComplete || !hasVideo || videoWatchedForModule;

  // ── Shared module list item renderer ──────────────────────────────────────
  const ModuleItem = ({ mod, i, onClick }) => {
    const modProg    = moduleProgress.find(m => m.moduleIndex === i);
    const isDone     = modProg?.completed;
    const isActive   = activeModule === i;
    const isLocked   = !canAccessModule(i, moduleProgress);
    const modHasVideo = !!(mod.videoUrl || (i === 0 && course.videoUrl));
    const isWatched  = videoWatched[i];
    return (
      <button onClick={() => onClick(i)}
        className={`w-full flex items-center gap-3 p-4 text-left transition-all ${
          isLocked  ? 'opacity-50 cursor-not-allowed' :
          isActive  ? 'bg-blue-50 border-l-4 border-blue-500' :
                      'hover:bg-gray-50 border-l-4 border-transparent'
        }`}>
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
          isDone ? 'bg-green-100' : isLocked ? 'bg-gray-100' : isActive ? 'bg-blue-100' : 'bg-gray-100'
        }`}>
          {isDone   ? <CheckCircle2 className="w-4 h-4 text-green-600" /> :
           isLocked ? <Lock className="w-3.5 h-3.5 text-gray-400" /> :
                      <span className={`text-xs font-bold ${isActive ? 'text-blue-700' : 'text-gray-500'}`}>{i + 1}</span>}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium truncate ${
            isLocked ? 'text-gray-400' : isActive ? 'text-blue-700' : isDone ? 'text-gray-500' : 'text-gray-800'
          }`}>{mod.module}</p>
          <div className="flex items-center gap-2 mt-0.5">
            {mod.topics?.length > 0 && <span className="text-xs text-gray-400">{mod.topics.length} topics</span>}
            {modHasVideo && !isDone && (
              <span className={`flex items-center gap-0.5 text-xs ${isWatched ? 'text-green-500' : 'text-amber-500'}`}>
                <Video className="w-3 h-3" />{isWatched ? 'Watched' : 'Watch required'}
              </span>
            )}
            {mod.assessmentIds?.length > 0 && (
              <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded font-semibold flex-shrink-0">
                📝 Assessment
              </span>
            )}
          </div>
        </div>
      </button>
    );
  };

  return (
    <CandidateLayout title={`Learn: ${course.title}`} showSidebar={false}>
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-3 left-3 sm:left-auto sm:right-5 z-50 flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl shadow-xl text-[12px] sm:text-[13px] font-bold ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
          {toast.type === 'error' ? <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> : <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />}
          {toast.msg}
        </div>
      )}

      {/* Completion Celebration */}
      {completionCelebration && (
        <div className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none">
          <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-10 text-center border border-green-200 max-w-sm mx-4">
            <Trophy className="w-14 h-14 md:w-20 md:h-20 text-amber-400 mx-auto mb-3" />
            <h2 className="text-[18px] md:text-[22px] font-bold text-gray-900 mb-2">Course Completed! 🎉</h2>
            <p className="text-[13px] text-gray-600 mb-3">Congratulations! You've completed <strong>{course.title}</strong></p>
            {enrollment?.certificateIssued && (
              <p className="text-[12px] text-green-600 font-medium">Your certificate is ready for download!</p>
            )}
          </div>
        </div>
      )}

      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-[1240px] mx-auto w-full px-3 sm:px-4 md:px-6 lg:px-8 py-2">
          <div className="flex items-center justify-between gap-2">
            <nav className="flex items-center gap-1.5 text-sm text-gray-500 font-medium overflow-x-auto hide-scrollbar">
              <button onClick={() => navigate('/dashboard/candidate')} className="hover:text-blue-600 flex-shrink-0">
                <Home className="w-[18px] h-[18px]" />
              </button>
              <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <button onClick={() => navigate('/dashboard/candidate/courses')} className="hover:text-blue-600 flex-shrink-0">Courses</button>
              <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <button onClick={() => navigate(`/dashboard/candidate/courses/${courseId}`)}
                className="hover:text-blue-600 truncate max-w-[80px] sm:max-w-[140px] md:max-w-[200px] flex-shrink-0">
                {course.title}
              </button>
              <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="text-gray-900 font-bold flex-shrink-0">Learn</span>
            </nav>
            <button onClick={() => setMobileModulesOpen(true)}
              className="lg:hidden flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 text-white text-[11px] font-bold rounded-lg hover:bg-blue-700 transition-colors flex-shrink-0">
              <Menu className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Modules</span>
              <span className="bg-white/20 text-[10px] px-1 py-0.5 rounded">{completedCount}/{curriculum.length}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Hero */}
      <div className="relative bg-gradient-to-br from-[#f0f4ff] via-white to-[#f5f0ff] border-b border-gray-200">
        <div className="max-w-[1240px] mx-auto w-full px-3 sm:px-4 md:px-6 lg:px-8 py-4 md:py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-6">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 mb-2">
                <span className="bg-white border border-blue-200 text-blue-700 text-[10px] md:text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm">
                  {course.category}
                </span>
                <span className="bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] md:text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {course.level}
                </span>
              </div>
              <h1 className="text-[16px] sm:text-[20px] md:text-[26px] font-bold text-gray-900 leading-tight">{course.title}</h1>
            </div>
            <div className="flex items-center gap-3 bg-white/80 border border-gray-200 p-2.5 md:p-4 rounded-xl md:rounded-2xl shadow-sm flex-shrink-0">
              <div className="flex flex-col items-start md:items-end">
                <span className="text-[10px] md:text-[11px] font-bold text-gray-900 uppercase tracking-wider">Progress</span>
                <span className="text-[10px] font-bold text-gray-500">{completedCount}/{curriculum.length} done</span>
              </div>
              <div className="relative w-10 h-10 md:w-[52px] md:h-[52px] flex items-center justify-center">
                <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                  <circle className="text-gray-200" strokeWidth="4" stroke="currentColor" fill="transparent" r="16" cx="50%" cy="50%" />
                  <circle className="text-blue-500 transition-all duration-1000 ease-out" strokeWidth="4"
                    strokeDasharray="100.5" strokeDashoffset={100.5 - (100.5 * overallProgress) / 100}
                    strokeLinecap="round" stroke="currentColor" fill="transparent" r="16" cx="50%" cy="50%" />
                </svg>
                <span className={`text-[11px] md:text-[13px] font-bold ${isCompleted ? 'text-green-600' : 'text-blue-700'}`}>{overallProgress}%</span>
              </div>
              {isCompleted && enrollment?.certificateUrl && (
                <a href={enrollment.certificateUrl} target="_blank" rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center gap-0.5 w-10 h-10 md:w-[52px] md:h-[52px] bg-gradient-to-br from-green-100 to-emerald-100 text-green-700 font-bold border border-green-200 rounded-lg md:rounded-xl hover:shadow-md transition-all">
                  <Award className="w-4 h-4" />
                  <span className="text-[8px] uppercase tracking-wider">Cert</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main layout */}
      <div className="max-w-[1240px] mx-auto w-full px-3 sm:px-4 md:px-6 lg:px-8 py-3 md:py-6 flex flex-col lg:flex-row items-start gap-3 md:gap-6">

        {/* Desktop Sidebar */}
        <div className={`hidden lg:block flex-shrink-0 transition-all duration-300 ${sidebarOpen ? 'w-72' : 'w-14'}`}>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden sticky top-4">
            <div className="flex items-center justify-between p-4 border-b border-gray-50">
              {sidebarOpen && (
                <div>
                  <p className="font-bold text-gray-900 text-sm">Course Modules</p>
                  <p className="text-xs text-gray-400">{completedCount}/{curriculum.length} completed</p>
                </div>
              )}
              <button onClick={() => setSidebarOpen(p => !p)}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500">
                {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
            {sidebarOpen && (
              <div className="px-4 py-2 border-b border-gray-50">
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all" style={{ width: `${overallProgress}%` }} />
                </div>
              </div>
            )}
            <div className="overflow-y-auto max-h-[calc(100vh-300px)]">
              {curriculum.map((mod, i) => (
                sidebarOpen
                  ? <ModuleItem key={i} mod={mod} i={i} onClick={handleModuleClick} />
                  : (
                    <button key={i} onClick={() => handleModuleClick(i)}
                      className={`w-full flex items-center justify-center p-3 transition-all ${activeModule === i ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        moduleProgress.find(m => m.moduleIndex === i)?.completed ? 'bg-green-100' : activeModule === i ? 'bg-blue-100' : 'bg-gray-100'
                      }`}>
                        {moduleProgress.find(m => m.moduleIndex === i)?.completed
                          ? <CheckCircle2 className="w-4 h-4 text-green-600" />
                          : <span className={`text-xs font-bold ${activeModule === i ? 'text-blue-700' : 'text-gray-500'}`}>{i + 1}</span>}
                      </div>
                    </button>
                  )
              ))}
            </div>
          </div>
        </div>

        {/* Mobile Modules Drawer */}
        {mobileModulesOpen && (
          <div className="fixed inset-0 z-[100] lg:hidden flex">
            <div className="absolute inset-0 bg-black/40" onClick={() => setMobileModulesOpen(false)} />
            <div className="absolute right-0 top-0 bottom-0 w-[85vw] max-w-[340px] bg-white flex flex-col shadow-2xl filter-drawer-enter">
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <div>
                  <p className="font-bold text-gray-900 text-sm">Course Modules</p>
                  <p className="text-xs text-gray-400">{completedCount}/{curriculum.length} completed</p>
                </div>
                <button onClick={() => setMobileModulesOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="px-4 py-2 border-b border-gray-50">
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all" style={{ width: `${overallProgress}%` }} />
                </div>
              </div>
              <div className="overflow-y-auto flex-1">
                {curriculum.map((mod, i) => <ModuleItem key={i} mod={mod} i={i} onClick={handleModuleClick} />)}
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-2.5 md:space-y-4">
          {currentModule ? (
            <>
              {/* Module Header */}
              <div className="bg-white rounded-xl md:rounded-2xl border border-gray-100 shadow-sm p-3 md:p-5">
                <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                  <span className="text-[10px] md:text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                    Module {activeModule + 1}/{curriculum.length}
                  </span>
                  {isCurrentComplete && (
                    <span className="flex items-center gap-0.5 text-[10px] md:text-[11px] font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" /> Done
                    </span>
                  )}
                </div>
                <h2 className="text-[15px] md:text-[20px] font-bold text-gray-900 leading-snug">{currentModule.module}</h2>
                {currentModule.duration && (
                  <p className="flex items-center gap-1 text-[11px] md:text-[13px] text-gray-500 mt-1">
                    <Clock className="w-3 h-3 md:w-3.5 md:h-3.5" /> {currentModule.duration}h estimated
                  </p>
                )}
                <div className="mt-3">
                  {!canMarkComplete ? (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 text-gray-400 text-[12px] font-medium cursor-not-allowed select-none w-fit">
                      <Lock className="w-3.5 h-3.5" /> Watch video first
                    </div>
                  ) : (
                    <button onClick={() => handleMarkComplete(activeModule, !isCurrentComplete)} disabled={marking}
                      className={`flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-lg md:rounded-xl font-medium text-[12px] md:text-[13px] transition-all ${
                        isCurrentComplete
                          ? 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-200'
                          : 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700 shadow-md'
                      } disabled:opacity-60 disabled:cursor-not-allowed`}>
                      {marking ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> :
                       isCurrentComplete ? <><CheckCircle2 className="w-3.5 h-3.5" /> Completed</> :
                                           <><CheckSquare className="w-3.5 h-3.5" /> Mark Complete</>}
                    </button>
                  )}
                </div>
                {hasVideo && !videoWatchedForModule && !isCurrentComplete && (
                  <div className="mt-2.5 flex items-start gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
                    <Video className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[12px] font-semibold text-amber-800">Video required</p>
                      <p className="text-[11px] text-amber-700 mt-0.5">Watch the video fully to unlock module completion.</p>
                    </div>
                  </div>
                )}
                {hasVideo && videoWatchedForModule && !isCurrentComplete && (
                  <div className="mt-2.5 flex items-center gap-2 p-2.5 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                    <p className="text-[12px] text-green-700 font-medium">Video watched! Click "Mark Complete" to continue.</p>
                  </div>
                )}
              </div>

              {/* Video Player */}
              {primaryVideoUrl && (
                <div className="bg-white rounded-xl md:rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-3 py-2 md:p-4 border-b border-gray-50 flex items-center justify-between">
                    <p className="font-semibold text-gray-800 text-[12px] md:text-[13px] flex items-center gap-1.5">
                      <PlayCircle className="w-3.5 h-3.5 text-blue-500" /> Module Video
                    </p>
                    {videoWatchedForModule && (
                      <span className="flex items-center gap-1 text-[10px] md:text-[11px] text-green-600 font-semibold">
                        <CheckCircle2 className="w-3 h-3" /> Watched
                      </span>
                    )}
                  </div>
                  <SmartVideoPlayer url={primaryVideoUrl} moduleIndex={activeModule}
                    moduleDuration={currentModule.duration}
                    onComplete={() => handleVideoWatched(activeModule)}
                    alreadyWatched={videoWatchedForModule} />
                </div>
              )}

              {/* Additional Videos */}
              {currentModule.videos?.length > 0 && (
                <div className="bg-white rounded-xl md:rounded-2xl border border-gray-100 shadow-sm p-3 md:p-5">
                  <h3 className="font-bold text-gray-900 text-[13px] md:text-[15px] mb-3 flex items-center gap-1.5">
                    <PlayCircle className="w-4 h-4 text-cyan-500" /> Additional Videos ({currentModule.videos.length})
                  </h3>
                  <div className="space-y-2">
                    {currentModule.videos.map((v, j) => (
                      <a key={j} href={v.url} target="_blank" rel="noreferrer"
                        className="flex items-center gap-2.5 p-2.5 rounded-lg bg-gray-50 hover:bg-blue-50 border border-gray-100 hover:border-blue-200 transition-colors group">
                        <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-blue-200">
                          <PlayCircle className="w-3.5 h-3.5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] md:text-[13px] font-medium text-gray-800">{v.title || `Video ${j + 1}`}</p>
                          <p className="text-[10px] text-gray-400 truncate">{v.url}</p>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-gray-300 group-hover:text-blue-500 flex-shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Topics */}
              {currentModule.topics?.length > 0 && (
                <div className="bg-white rounded-xl md:rounded-2xl border border-gray-100 shadow-sm p-3 md:p-5">
                  <h3 className="font-bold text-gray-900 text-[13px] md:text-[15px] mb-3 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-blue-500" /> Topics in this Module
                  </h3>
                  <div className="space-y-1.5">
                    {currentModule.topics.map((topic, j) => (
                      <div key={j} className="flex items-start gap-2 p-2 md:p-2.5 rounded-lg bg-gray-50 hover:bg-blue-50 transition-colors">
                        <div className="w-5 h-5 md:w-6 md:h-6 bg-blue-100 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-[10px] md:text-[11px] font-bold text-blue-700">{j + 1}</span>
                        </div>
                        <p className="text-[12px] md:text-[13px] text-gray-700 flex-1">{topic}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-between gap-2 md:gap-3">
                <button onClick={() => setActiveModule(p => Math.max(0, p - 1))} disabled={activeModule === 0}
                  className="flex items-center gap-1 px-2.5 md:px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg md:rounded-xl font-medium text-[12px] md:text-[13px] hover:border-blue-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                  <ChevronLeft className="w-3.5 h-3.5" /> Prev
                </button>
                {activeModule < curriculum.length - 1 ? (
                  <button onClick={handleNextModule} disabled={!isCurrentComplete}
                    title={!isCurrentComplete ? 'Complete this module first' : ''}
                    className={`flex items-center gap-1 px-2.5 md:px-4 py-2 rounded-lg md:rounded-xl font-medium text-[12px] md:text-[13px] transition-all ${
                      isCurrentComplete
                        ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700 shadow-md'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}>
                    {!isCurrentComplete ? <Lock className="w-3.5 h-3.5" /> : null}
                    Next <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button onClick={() => !isCurrentComplete && handleMarkComplete(activeModule, true)}
                    disabled={isCurrentComplete || marking || !canMarkComplete}
                    className="flex items-center gap-1 px-2.5 md:px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg md:rounded-xl font-medium text-[12px] md:text-[13px] hover:from-green-600 hover:to-emerald-600 shadow-md transition-all disabled:opacity-60 disabled:cursor-not-allowed">
                    <Trophy className="w-3.5 h-3.5" />
                    {isCompleted ? 'Completed! 🎉' : 'Finish'}
                  </button>
                )}
              </div>

              {/* Completion Banner */}
              {isCompleted && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl md:rounded-2xl p-4 md:p-6 text-center">
                  <Trophy className="w-10 h-10 md:w-12 md:h-12 text-amber-400 mx-auto mb-2" />
                  <h3 className="font-bold text-gray-900 text-[14px] md:text-[18px] mb-1.5">Course Completed! 🎉</h3>
                  <p className="text-[12px] md:text-[13px] text-gray-600 mb-3">
                    You've completed <strong>{course.title}</strong>. Great work!
                  </p>
                  <div className="flex justify-center gap-2 flex-wrap">
                    {enrollment?.certificateUrl && (
                      <a href={enrollment.certificateUrl} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-2 bg-purple-600 text-white rounded-lg text-[11px] md:text-[12px] font-medium hover:bg-purple-700 transition-all">
                        <Download className="w-3.5 h-3.5" /> Certificate
                      </a>
                    )}
                    <button onClick={() => navigate('/dashboard/candidate/assessments')}
                      className="flex items-center gap-1.5 px-3 py-2 bg-amber-500 text-white rounded-lg text-[11px] md:text-[12px] font-medium hover:bg-amber-600 transition-all">
                      <Zap className="w-3.5 h-3.5" /> Assessment
                    </button>
                    <button onClick={() => navigate('/dashboard/candidate/courses')}
                      className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 text-gray-700 rounded-lg text-[11px] md:text-[12px] font-medium hover:border-blue-300 transition-all">
                      <BookOpen className="w-3.5 h-3.5" /> Courses
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-xl md:rounded-2xl border border-gray-100 shadow-sm p-6 md:p-10 text-center">
              <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-[13px] text-gray-500">No modules found in this course.</p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .filter-drawer-enter {
          animation: slideInRight 0.28s cubic-bezier(0.16,1,0.3,1) forwards;
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
      `}</style>
    </CandidateLayout>
  );
};

export default CandidateCourseLearn;