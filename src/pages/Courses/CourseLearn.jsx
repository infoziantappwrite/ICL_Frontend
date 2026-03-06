// pages/Courses/CourseLearn.jsx
// Student: Learning interface — video must be fully watched before module can be completed
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  CheckCircle2, Circle, ChevronLeft, ChevronRight, Award, Zap,
  BookOpen, Clock, PlayCircle, Download, AlertCircle, RefreshCw,
  Trophy, Lock, Video, ExternalLink, Eye, Timer, CheckSquare
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
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
  return 'iframe'; // generic embed (Drive, etc.)
};

const toYouTubeEmbed = (url) => {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (!m) return url;
  return `https://www.youtube.com/embed/${m[1]}?enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}&rel=0`;
};

// ─── YouTube Player Component ──────────────────────────────────────────────────
const YouTubePlayer = ({ url, playerId, onComplete, alreadyWatched }) => {
  const playerRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (alreadyWatched) return;
    const embedUrl = toYouTubeEmbed(url);
    if (!embedUrl.includes('enablejsapi')) return;

    onYTReady(() => {
      // Small delay to ensure DOM element exists
      setTimeout(() => {
        try {
          playerRef.current = new window.YT.Player(playerId, {
            events: {
              onStateChange: (e) => {
                // State 0 = ENDED
                if (e.data === 0) {
                  onComplete();
                  clearInterval(intervalRef.current);
                }
                // State 1 = PLAYING — poll for 90% watched
                if (e.data === 1) {
                  intervalRef.current = setInterval(() => {
                    try {
                      const p = playerRef.current;
                      if (!p?.getCurrentTime) return;
                      const curr = p.getCurrentTime();
                      const dur = p.getDuration();
                      if (dur > 0 && curr / dur >= 0.9) {
                        onComplete();
                        clearInterval(intervalRef.current);
                      }
                    } catch (_) {}
                  }, 3000);
                } else {
                  clearInterval(intervalRef.current);
                }
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

  const embedUrl = toYouTubeEmbed(url);

  return (
    <div className="aspect-video bg-black w-full">
      <iframe
        id={playerId}
        src={embedUrl}
        className="w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title="Module Video"
      />
    </div>
  );
};

// ─── HTML5 Video Player Component ─────────────────────────────────────────────
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
      <video
        ref={videoRef}
        src={url}
        controls
        controlsList="nodownload"
        onTimeUpdate={handleTimeUpdate}
        onEnded={!alreadyWatched ? onComplete : undefined}
        className="w-full h-full"
        onContextMenu={e => e.preventDefault()}
      />
    </div>
  );
};

// ─── Vimeo Player Component ────────────────────────────────────────────────────
const VimeoPlayer = ({ url, onComplete, alreadyWatched }) => {
  const iframeRef = useRef(null);

  // Convert Vimeo URL to embed
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
      <iframe
        ref={iframeRef}
        src={getVimeoEmbed(url)}
        className="w-full h-full"
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        title="Module Video"
      />
    </div>
  );
};

// ─── Iframe with Timer Gate (for unknown embeds like Google Drive) ─────────────
const TimerGatePlayer = ({ url, moduleDuration, onComplete, alreadyWatched }) => {
  // Require watching for at least (duration * 60 * 0.7) seconds, min 30s, max 300s
  const requiredSeconds = Math.min(Math.max((moduleDuration || 0) * 60 * 0.7, 30), 300);
  const [elapsed, setElapsed] = useState(0);
  const [active, setActive] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (alreadyWatched || elapsed >= requiredSeconds) return;
    if (!active) return;
    timerRef.current = setInterval(() => {
      setElapsed(p => {
        const next = p + 1;
        if (next >= requiredSeconds) {
          clearInterval(timerRef.current);
          onComplete();
        }
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
        <iframe
          src={url}
          className="w-full h-full"
          allow="autoplay; fullscreen"
          allowFullScreen
          title="Module Video"
          onLoad={() => setActive(true)}
        />
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

// ─── Smart Video Player (auto-detects type) ────────────────────────────────────
const SmartVideoPlayer = ({ url, moduleIndex, moduleDuration, onComplete, alreadyWatched }) => {
  const type = detectVideoType(url);
  const playerId = `yt-player-mod-${moduleIndex}`;

  if (type === 'youtube') {
    return (
      <YouTubePlayer
        url={url} playerId={playerId}
        onComplete={onComplete} alreadyWatched={alreadyWatched}
      />
    );
  }
  if (type === 'html5') {
    return (
      <HTML5VideoPlayer url={url} onComplete={onComplete} alreadyWatched={alreadyWatched} />
    );
  }
  if (type === 'vimeo') {
    return (
      <VimeoPlayer url={url} onComplete={onComplete} alreadyWatched={alreadyWatched} />
    );
  }
  // Generic iframe
  return (
    <TimerGatePlayer
      url={url} moduleDuration={moduleDuration}
      onComplete={onComplete} alreadyWatched={alreadyWatched}
    />
  );
};

// ─── Session Storage key ───────────────────────────────────────────────────────
const storageKey = (courseId) => `icl_watched_${courseId}`;

const loadWatched = (courseId) => {
  try {
    return JSON.parse(sessionStorage.getItem(storageKey(courseId)) || '{}');
  } catch { return {}; }
};

const saveWatched = (courseId, data) => {
  try { sessionStorage.setItem(storageKey(courseId), JSON.stringify(data)); } catch (_) {}
};

// ─── Main Component ────────────────────────────────────────────────────────────
const CourseLearn = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeModule, setActiveModule] = useState(0);
  const [marking, setMarking] = useState(false);
  const [toast, setToast] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [completionCelebration, setCompletionCelebration] = useState(false);

  // videoWatched[i] = true means the primary video of module i has been watched
  const [videoWatched, setVideoWatched] = useState({});

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
          navigate(`/dashboard/student/courses/${courseId}`);
        } else {
          // Restore watched state from session storage
          const stored = loadWatched(courseId);
          // Also pre-mark completed modules as watched (they've been watched before)
          const prog = res.data.enrollment?.moduleProgress || [];
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

  // Called when video player detects completion
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
          updated.overallProgress = res.data.overallProgress;
          updated.status = res.data.status;
          if (res.data.certificateUrl) {
            updated.certificateUrl = res.data.certificateUrl;
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

        // Auto-advance to next module
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

  // Can student navigate to module i?
  const canAccessModule = (i, moduleProgress) => {
    if (i === 0) return true;
    const prev = moduleProgress.find(m => m.moduleIndex === i - 1);
    const curr = moduleProgress.find(m => m.moduleIndex === i);
    // Can access if this module is already completed OR the previous one is done
    return curr?.completed || prev?.completed;
  };

  const handleModuleClick = (i) => {
    const moduleProgress = enrollment?.moduleProgress || [];
    if (!canAccessModule(i, moduleProgress)) {
      showToast(`⚠️ Complete Module ${i} first to unlock this module.`, 'error');
      return;
    }
    setActiveModule(i);
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

  if (loading) {
    return <LoadingSpinner message="Loading Course..." submessage="Preparing your learning interface" icon={BookOpen} />;
  }

  if (error || !course) {
    return (
      <DashboardLayout title="Learn">
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
          <AlertCircle className="w-12 h-12 text-red-400" />
          <p className="text-gray-600">{error || 'Course not found'}</p>
          <button onClick={() => navigate('/dashboard/student/my-courses')} className="text-blue-600 underline text-sm">
            ← Back to My Courses
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const curriculum = course.curriculum || [];
  const moduleProgress = enrollment?.moduleProgress || [];
  const overallProgress = enrollment?.overallProgress || 0;
  const isCompleted = enrollment?.status === 'completed';
  const currentModule = curriculum[activeModule];
  const currentProgress = moduleProgress.find(m => m.moduleIndex === activeModule);
  const isCurrentComplete = currentProgress?.completed || false;
  const completedCount = moduleProgress.filter(m => m.completed).length;

  // Primary video for current module (module-level takes priority, else course-level for module 0)
  const primaryVideoUrl = currentModule?.videoUrl || (activeModule === 0 ? course.videoUrl : null) || null;
  const hasVideo = !!primaryVideoUrl;

  // Can mark complete? Only if no video, OR video has been watched, OR already complete
  const videoWatchedForModule = videoWatched[activeModule] || false;
  const canMarkComplete = isCurrentComplete || !hasVideo || videoWatchedForModule;

  // Can go to next module?
  const canGoNext = isCurrentComplete && activeModule < curriculum.length - 1;
  const canGoNextModule = canAccessModule(activeModule + 1, moduleProgress);

  return (
    <DashboardLayout title={`Learn: ${course.title}`} showSidebar={false}>
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-sm font-medium ${
          toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
        }`}>
          {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Completion Celebration */}
      {completionCelebration && (
        <div className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none">
          <div className="bg-white rounded-3xl shadow-2xl p-10 text-center border border-green-200 max-w-sm mx-4">
            <Trophy className="w-20 h-20 text-amber-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Course Completed! 🎉</h2>
            <p className="text-gray-600 mb-4">Congratulations! You've completed <strong>{course.title}</strong></p>
            {enrollment?.certificateIssued && (
              <p className="text-sm text-green-600 font-medium">Your certificate is ready for download!</p>
            )}
          </div>
        </div>
      )}

      {/* Top Navigation Bar */}
      <div className="mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(`/dashboard/student/courses/${courseId}`)}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition-colors">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="font-bold text-gray-900 text-sm sm:text-base truncate">{course.title}</h1>
              <p className="text-xs text-gray-500">{course.category} • {course.level}</p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs font-semibold text-gray-700">{overallProgress}% Complete</span>
                <span className="text-xs text-gray-400">{completedCount}/{curriculum.length} modules</span>
              </div>
              <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-500 ${isCompleted ? 'bg-green-500' : 'bg-gradient-to-r from-blue-500 to-cyan-500'}`}
                  style={{ width: `${overallProgress}%` }} />
              </div>
              {isCompleted && enrollment?.certificateUrl && (
                <a href={enrollment.certificateUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 text-purple-700 text-xs font-semibold rounded-xl hover:bg-purple-200 transition-all">
                  <Award className="w-4 h-4" /> Certificate
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className={`flex-shrink-0 transition-all duration-300 ${sidebarOpen ? 'w-72' : 'w-14'}`}>
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
                  <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all"
                    style={{ width: `${overallProgress}%` }} />
                </div>
              </div>
            )}

            <div className="overflow-y-auto max-h-[calc(100vh-300px)]">
              {curriculum.map((mod, i) => {
                const modProg = moduleProgress.find(m => m.moduleIndex === i);
                const isDone = modProg?.completed;
                const isActive = activeModule === i;
                const isLocked = !canAccessModule(i, moduleProgress);
                const modHasVideo = !!(mod.videoUrl || (i === 0 && course.videoUrl));
                const isWatched = videoWatched[i];

                return (
                  <button key={i} onClick={() => handleModuleClick(i)}
                    className={`w-full flex items-center gap-3 p-4 text-left transition-all ${
                      isLocked ? 'opacity-50 cursor-not-allowed' :
                      isActive ? 'bg-blue-50 border-l-4 border-blue-500' :
                      'hover:bg-gray-50 border-l-4 border-transparent'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isDone ? 'bg-green-100' : isLocked ? 'bg-gray-100' : isActive ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                      {isDone ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      ) : isLocked ? (
                        <Lock className="w-3.5 h-3.5 text-gray-400" />
                      ) : (
                        <span className={`text-xs font-bold ${isActive ? 'text-blue-700' : 'text-gray-500'}`}>{i + 1}</span>
                      )}
                    </div>

                    {sidebarOpen && (
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${
                          isLocked ? 'text-gray-400' : isActive ? 'text-blue-700' : isDone ? 'text-gray-500' : 'text-gray-800'
                        }`}>
                          {mod.module}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {mod.topics?.length > 0 && (
                            <span className="text-xs text-gray-400">{mod.topics.length} topics</span>
                          )}
                          {modHasVideo && !isDone && (
                            <span className={`flex items-center gap-0.5 text-xs ${isWatched ? 'text-green-500' : 'text-amber-500'}`}>
                              <Video className="w-3 h-3" />
                              {isWatched ? 'Watched' : 'Watch required'}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0 space-y-5">
          {currentModule ? (
            <>
              {/* Module Header */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                        Module {activeModule + 1} of {curriculum.length}
                      </span>
                      {isCurrentComplete && (
                        <span className="flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                        </span>
                      )}
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">{currentModule.module}</h2>
                    {currentModule.duration && (
                      <p className="flex items-center gap-1.5 text-sm text-gray-500 mt-1">
                        <Clock className="w-4 h-4" /> {currentModule.duration}h estimated
                      </p>
                    )}
                  </div>

                  {/* Mark Complete button — locked until video watched */}
                  <div className="flex-shrink-0">
                    {!canMarkComplete ? (
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-100 text-gray-400 text-sm font-medium cursor-not-allowed select-none">
                          <Lock className="w-4 h-4" />
                          Watch video first
                        </div>
                        <span className="text-xs text-amber-600 flex items-center gap-1">
                          <Eye className="w-3 h-3" /> Watch the video to unlock
                        </span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleMarkComplete(activeModule, !isCurrentComplete)}
                        disabled={marking}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
                          isCurrentComplete
                            ? 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-200'
                            : 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700 shadow-md'
                        } disabled:opacity-60 disabled:cursor-not-allowed`}
                      >
                        {marking ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : isCurrentComplete ? (
                          <><CheckCircle2 className="w-4 h-4" /> Completed</>
                        ) : (
                          <><CheckSquare className="w-4 h-4" /> Mark Complete</>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Video watch required notice */}
                {hasVideo && !videoWatchedForModule && !isCurrentComplete && (
                  <div className="mt-4 flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                    <Video className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-amber-800">Video required</p>
                      <p className="text-xs text-amber-700 mt-0.5">
                        You must watch the module video completely before you can mark this module as complete or proceed to the next one.
                      </p>
                    </div>
                  </div>
                )}
                {hasVideo && videoWatchedForModule && !isCurrentComplete && (
                  <div className="mt-4 flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl">
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <p className="text-sm text-green-700 font-medium">Video watched! Click "Mark Complete" to continue.</p>
                  </div>
                )}
              </div>

              {/* Primary Video Player */}
              {primaryVideoUrl && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-gray-50 flex items-center justify-between">
                    <p className="font-semibold text-gray-800 text-sm flex items-center gap-2">
                      <PlayCircle className="w-4 h-4 text-blue-500" /> Module Video
                    </p>
                    {videoWatchedForModule && (
                      <span className="flex items-center gap-1 text-xs text-green-600 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Watched
                      </span>
                    )}
                  </div>
                  <SmartVideoPlayer
                    url={primaryVideoUrl}
                    moduleIndex={activeModule}
                    moduleDuration={currentModule.duration}
                    onComplete={() => handleVideoWatched(activeModule)}
                    alreadyWatched={videoWatchedForModule}
                  />
                </div>
              )}

              {/* Additional module videos */}
              {currentModule.videos?.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <PlayCircle className="w-5 h-5 text-cyan-500" />
                    Additional Videos ({currentModule.videos.length})
                  </h3>
                  <div className="space-y-3">
                    {currentModule.videos.map((v, j) => (
                      <a key={j} href={v.url} target="_blank" rel="noreferrer"
                        className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-blue-50 border border-gray-100 hover:border-blue-200 transition-colors group">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-blue-200">
                          <PlayCircle className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800">{v.title || `Video ${j + 1}`}</p>
                          <p className="text-xs text-gray-400 truncate">{v.url}</p>
                        </div>
                        <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-blue-500 flex-shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Topics */}
              {currentModule.topics?.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-blue-500" />
                    Topics in this Module
                  </h3>
                  <div className="space-y-3">
                    {currentModule.topics.map((topic, j) => (
                      <div key={j} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 hover:bg-blue-50 transition-colors">
                        <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-bold text-blue-700">{j + 1}</span>
                        </div>
                        <p className="text-sm text-gray-700 flex-1">{topic}</p>
                        <Circle className="w-4 h-4 text-gray-300 flex-shrink-0 mt-0.5" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-between gap-4">
                <button
                  onClick={() => setActiveModule(p => Math.max(0, p - 1))}
                  disabled={activeModule === 0}
                  className="flex items-center gap-2 px-5 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium text-sm hover:border-blue-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>

                {activeModule < curriculum.length - 1 ? (
                  <div className="flex flex-col items-end gap-1">
                    <button
                      onClick={handleNextModule}
                      disabled={!isCurrentComplete}
                      title={!isCurrentComplete ? 'Complete this module first' : ''}
                      className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium text-sm transition-all ${
                        isCurrentComplete
                          ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700 shadow-md'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {!isCurrentComplete ? <Lock className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      Next Module
                    </button>
                    {!isCurrentComplete && (
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Complete this module to unlock next
                      </span>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => !isCurrentComplete && handleMarkComplete(activeModule, true)}
                    disabled={isCurrentComplete || marking || !canMarkComplete}
                    className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-medium text-sm hover:from-green-600 hover:to-emerald-600 shadow-md transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <Trophy className="w-4 h-4" />
                    {isCompleted ? 'Course Completed! 🎉' : 'Complete Course'}
                  </button>
                )}
              </div>

              {/* Completion message */}
              {isCompleted && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6 text-center">
                  <Trophy className="w-12 h-12 text-amber-400 mx-auto mb-3" />
                  <h3 className="font-bold text-gray-900 text-lg mb-2">Course Completed! 🎉</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    You've successfully completed <strong>{course.title}</strong>. Great work!
                  </p>
                  <div className="flex justify-center gap-3 flex-wrap">
                    {enrollment?.certificateUrl && (
                      <a href={enrollment.certificateUrl} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 transition-all">
                        <Download className="w-4 h-4" /> Download Certificate
                      </a>
                    )}
                    <button onClick={() => navigate('/dashboard/student/assessments')}
                      className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-medium hover:bg-amber-600 transition-all">
                      <Zap className="w-4 h-4" /> Take Assessment
                    </button>
                    <button onClick={() => navigate('/dashboard/student/courses')}
                      className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:border-blue-300 transition-all">
                      <BookOpen className="w-4 h-4" /> More Courses
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No modules found in this course.</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CourseLearn;