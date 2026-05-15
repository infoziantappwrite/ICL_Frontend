import { useState, useEffect, useRef, useCallback } from 'react';
import {
  MessageSquare, RefreshCw, AlertCircle, Send,
  BookOpen, Search, X, Reply, Trash2, ChevronDown, ChevronUp,
} from 'lucide-react';
import TrainerDashboardLayout from '../../../components/layout/Trainerdashboardlayout';
import { commentAPI } from '../../../api/Api';

/* ── Helpers ─────────────────────────────────────────────────────────────── */
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '';

const fmtTime = (d) =>
  d ? new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '';

const Avatar = ({ name, bg = '#003399', size = 9 }) => (
  <div
    className={`w-${size} h-${size} rounded-full flex items-center justify-center flex-shrink-0 text-[12px] font-black uppercase text-white`}
    style={{ background: bg, minWidth: size === 9 ? '2.25rem' : '2rem', minHeight: size === 9 ? '2.25rem' : '2rem' }}
  >
    {(name || '?').charAt(0)}
  </div>
);

/* ── Single reply row ────────────────────────────────────────────────────── */
const ReplyRow = ({ reply, commentId, onDeleted }) => {
  const [deleting, setDeleting] = useState(false);
  if (reply.is_deleted) return null;

  const name = reply.replied_by?.fullName || 'Trainer';
  const role = reply.replied_by?.role || 'trainer';

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await commentAPI.deleteReply(commentId, reply._id);
      if (res.success) onDeleted(reply._id);
    } catch (_) {}
    setDeleting(false);
  };

  return (
    <div className="flex gap-2.5 p-2.5 rounded-xl bg-blue-50 border border-blue-100 group">
      <Avatar name={name} bg="#00A9CE" size={7} />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1.5 flex-wrap mb-0.5">
          <span className="text-xs font-bold text-blue-800">{name}</span>
          <span className="text-[10px] text-blue-400 capitalize bg-blue-100 px-1.5 py-0.5 rounded-full">{role}</span>
          <span className="text-[10px] text-slate-400 ml-auto">{fmtDate(reply.created_at)}</span>
        </div>
        <p className="text-xs text-blue-700 leading-relaxed break-words">{reply.reply}</p>
      </div>
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-100 text-slate-300 hover:text-red-500 transition-all disabled:opacity-50"
        title="Delete reply"
      >
        {deleting ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
      </button>
    </div>
  );
};

/* ── Comment card with inline reply ─────────────────────────────────────── */
const CommentCard = ({ comment, onReplyAdded, onReplyDeleted }) => {
  const [showReplies, setShowReplies] = useState(false);
  const [replyOpen, setReplyOpen]     = useState(false);
  const [replyText, setReplyText]     = useState('');
  const [submitting, setSubmitting]   = useState(false);
  const [error, setError]             = useState('');
  const textareaRef = useRef(null);

  const name     = comment.student_id?.fullName || 'Student';
  const email    = comment.student_id?.email || '';
  const active   = (comment.replies || []).filter(r => !r.is_deleted);

  const handleReply = async () => {
    const text = replyText.trim();
    if (!text) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await commentAPI.addReply(comment._id, text);
      if (res.success) {
        onReplyAdded(comment._id, res.data);
        setReplyText('');
        setReplyOpen(false);
        setShowReplies(true);
      } else {
        setError(res.message || 'Failed to send reply');
      }
    } catch (e) {
      setError(e.message || 'Failed to send reply');
    }
    setSubmitting(false);
  };

  useEffect(() => {
    if (replyOpen && textareaRef.current) textareaRef.current.focus();
  }, [replyOpen]);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Comment body */}
      <div className="flex gap-3 p-4">
        <Avatar name={name} bg="#003399" size={9} />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-1.5 flex-wrap mb-1">
            <span className="text-sm font-bold text-slate-800">{name}</span>
            {email && <span className="text-[10px] text-slate-400">{email}</span>}
            <span className="text-[10px] text-slate-400 ml-auto">
              {fmtDate(comment.created_at)}{comment.created_at ? ` · ${fmtTime(comment.created_at)}` : ''}
            </span>
          </div>
          {comment.course_title && (
            <div className="flex items-center gap-1 mb-1.5">
              <BookOpen className="w-3 h-3 text-[#00A9CE]" />
              <span className="text-[10px] text-[#00A9CE] font-semibold">{comment.course_title}</span>
            </div>
          )}
          <p className="text-sm text-slate-700 leading-relaxed break-words">{comment.comment}</p>
        </div>
      </div>

      {/* Actions bar */}
      <div className="flex items-center gap-2 px-4 pb-3 pt-1 border-t border-slate-50">
        <button
          onClick={() => { setReplyOpen(r => !r); setError(''); }}
          className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg transition-colors ${
            replyOpen ? 'bg-[#003399] text-white' : 'text-[#003399] hover:bg-[#003399]/10'
          }`}
        >
          <Reply className="w-3 h-3" /> Reply
        </button>

        {active.length > 0 && (
          <button
            onClick={() => setShowReplies(s => !s)}
            className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-700 px-2.5 py-1 rounded-lg hover:bg-slate-50 transition-colors ml-auto"
          >
            {showReplies ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {active.length} {active.length === 1 ? 'reply' : 'replies'}
          </button>
        )}
      </div>

      {/* Reply input */}
      {replyOpen && (
        <div className="px-4 pb-4 space-y-2">
          {error && (
            <div className="flex items-center gap-1.5 text-[11px] text-red-600 bg-red-50 rounded-lg px-2 py-1">
              <AlertCircle className="w-3 h-3" /> {error}
            </div>
          )}
          <div className="flex gap-2 items-end">
            <textarea
              ref={textareaRef}
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReply(); } }}
              placeholder="Type your reply… (Enter to send)"
              rows={2}
              className="flex-1 text-xs border border-slate-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-[#003399]/30 focus:border-[#003399]/50 text-slate-700 placeholder-slate-400"
            />
            <button
              onClick={handleReply}
              disabled={submitting || !replyText.trim()}
              className="flex-shrink-0 w-9 h-9 flex items-center justify-center bg-[#003399] hover:bg-[#002d8b] text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      )}

      {/* Replies list */}
      {showReplies && active.length > 0 && (
        <div className="px-4 pb-4 space-y-2">
          <div className="h-px bg-slate-100 mb-1" />
          {active.map(r => (
            <ReplyRow
              key={r._id}
              reply={r}
              commentId={comment._id}
              onDeleted={(rid) => onReplyDeleted(comment._id, rid)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/* ════════ MAIN PAGE ════════ */
const TrainerMessages = () => {
  const [comments, setComments]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [search, setSearch]       = useState('');
  const [courseFilter, setCourse] = useState('');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await commentAPI.getAllTrainerComments();
      if (res.success) setComments(res.data || []);
      else setError(res.message || 'Failed to load comments');
    } catch (e) {
      setError(e.message || 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleReplyAdded = (commentId, updatedDoc) => {
    setComments(prev =>
      prev.map(c =>
        c._id === commentId
          ? { ...updatedDoc, course_title: c.course_title }  // preserve course_title
          : c
      )
    );
  };

  const handleReplyDeleted = (commentId, replyId) => {
    setComments(prev =>
      prev.map(c => {
        if (c._id !== commentId) return c;
        return {
          ...c,
          replies: c.replies.map(r => r._id === replyId ? { ...r, is_deleted: true } : r),
        };
      })
    );
  };

  const courseOptions = [...new Set(comments.map(c => c.course_title).filter(Boolean))].sort();

  const filtered = comments.filter(c => {
    const matchCourse = !courseFilter || c.course_title === courseFilter;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      (c.student_id?.fullName || '').toLowerCase().includes(q) ||
      (c.student_id?.email || '').toLowerCase().includes(q) ||
      c.comment.toLowerCase().includes(q) ||
      (c.course_title || '').toLowerCase().includes(q);
    return matchCourse && matchSearch;
  });

  const awaitingReply = comments.filter(c => !(c.replies || []).some(r => !r.is_deleted)).length;

  return (
    <TrainerDashboardLayout>
      <div className="max-w-screen-xl mx-auto space-y-5 py-2">

        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-black text-slate-800">Messages</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Student comments from your courses — reply directly here
            </p>
          </div>
          <div className="flex items-center gap-2">
            {awaitingReply > 0 && (
              <span className="text-[11px] font-bold bg-amber-100 text-amber-700 border border-amber-200 px-3 py-1 rounded-full">
                {awaitingReply} awaiting reply
              </span>
            )}
            <button
              onClick={fetchAll}
              title="Refresh"
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:text-[#003399] hover:border-[#003399]/30 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by student, course, or keyword…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-9 py-2.5 text-xs font-semibold border border-slate-100 rounded-xl focus:outline-none focus:border-[#003399]/30 bg-white"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {courseOptions.length > 1 && (
            <select
              value={courseFilter}
              onChange={e => setCourse(e.target.value)}
              className="pl-4 pr-10 py-2.5 text-xs font-semibold border border-slate-100 rounded-xl focus:outline-none focus:border-[#003399]/30 bg-white appearance-none cursor-pointer text-slate-600 min-w-[180px]"
            >
              <option value="">All Courses</option>
              {courseOptions.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          )}
        </div>

        {/* Stats */}
        {!loading && comments.length > 0 && (
          <div className="flex items-center gap-4 text-[11px] text-slate-400 font-semibold">
            <span><span className="text-slate-700 font-black">{filtered.length}</span> comment{filtered.length !== 1 ? 's' : ''}{search || courseFilter ? ' (filtered)' : ''}</span>
            <span>·</span>
            <span><span className="text-[#003399] font-black">{filtered.filter(c => (c.replies || []).some(r => !r.is_deleted)).length}</span> replied</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-16">
            <RefreshCw className="w-6 h-6 text-[#003399] animate-spin" />
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && comments.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: 'linear-gradient(135deg, #00A9CE, #003399)' }}>
              <MessageSquare className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-lg font-black text-slate-800 mb-2">No Comments Yet</h2>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              When students comment on your courses, all their messages will appear here. You can reply directly from this page.
            </p>
          </div>
        )}

        {/* No results after filter */}
        {!loading && !error && comments.length > 0 && filtered.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <Search className="w-8 h-8 mx-auto mb-2 opacity-25" />
            <p className="text-sm font-semibold">No comments match your search.</p>
            <button onClick={() => { setSearch(''); setCourse(''); }} className="mt-2 text-xs text-[#003399] hover:underline">
              Clear filters
            </button>
          </div>
        )}

        {/* Comments */}
        {!loading && !error && filtered.length > 0 && (
          <div className="space-y-4">
            {filtered.map(c => (
              <CommentCard
                key={c._id}
                comment={c}
                onReplyAdded={handleReplyAdded}
                onReplyDeleted={handleReplyDeleted}
              />
            ))}
          </div>
        )}
      </div>
    </TrainerDashboardLayout>
  );
};

export default TrainerMessages;