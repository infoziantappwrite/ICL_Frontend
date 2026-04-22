// pages/SuperAdmin/Courses/SuperAdminCourseForm.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  BookOpen, ArrowLeft, Plus, Trash2, Save, AlertCircle,
  CheckCircle2, Layers, Target, Award, Clock, RefreshCw, X,
  Globe, Video, Link, Building2, CheckSquare, Square, Info,
} from 'lucide-react';
import SuperAdminDashboardLayout from '../../../components/layout/SuperAdminDashboardLayout';
import { DetailSkeleton } from '../../../components/common/SkeletonLoader';
import { superAdminCourseAPI } from '../../../api/Api';
import { superAdminStudentAPI } from '../../../api/studentAPI';

const INITIAL_FORM = {
  title: '', description: '', shortDescription: '',
  category: 'Full Stack Development', level: 'Beginner',
  duration: { hours: 1, weeks: 0 },
  price: { original: 0, discounted: 0, currency: 'INR' },
  instructor: { name: '', bio: '', experience: 0 },
  curriculum: [], prerequisites: [], learningOutcomes: [],
  thumbnail: '', videoUrl: '', syllabusUrl: '',
  // Default status is Draft; workflow: Draft → Coming Soon → Active (auto) → Inactive
  status: 'Draft', deliveryMode: 'ONLINE', language: 'English',
  tags: [], certificateProvided: true, maxEnrollments: '',
  startDate: '', endDate: '', registrationDeadline: '',
  collegeIds: [], // empty = platform-wide
};

const inputClass = 'w-full px-3 py-2.5 border border-gray-200 hover:border-gray-300 rounded-xl focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-xs text-gray-800 placeholder-gray-400 bg-white transition-all';
const selectClass = inputClass;

// Status workflow rules for super_admin
const STATUS_OPTIONS = [
  { value: 'Draft', label: 'Draft', color: 'text-gray-500', hint: 'Not visible to students' },
  { value: 'Coming Soon', label: 'Coming Soon', color: 'text-amber-600', hint: 'Visible but not yet enrollable' },
  { value: 'Active', label: 'Active', color: 'text-green-600', hint: 'Auto-activated at start date; or set manually' },
  { value: 'Inactive', label: 'Inactive', color: 'text-red-500', hint: 'Hidden from students' },
];

const SHead = ({ icon: Icon, title, sub, color = '#003399', noBg }) => (
  <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-50">
    <div
      className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${noBg ? '' : 'border'}`}
      style={noBg ? {} : {
        backgroundColor: `${color}15`,
        borderColor: `${color}30`,
      }}
    >
      <Icon className="w-3.5 h-3.5" style={{ color }} />
    </div>
    <div>
      <h3 className="text-sm font-bold text-slate-800 leading-none">{title}</h3>
      {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

const FormField = ({ label, required, hint, error, children }) => (
  <div>
    <label className="block text-xs font-bold text-gray-600 mb-1.5">
      {label} {required && <span className="text-blue-500">*</span>}
    </label>
    {hint && <p className="text-[10px] text-gray-400 mb-1.5">{hint}</p>}
    {children}
    {error && (
      <p className="text-red-500 text-[11px] mt-1 flex items-center gap-1 font-medium">
        <AlertCircle className="w-3 h-3 flex-shrink-0" />{error}
      </p>
    )}
  </div>
);

const SelectWithOther = ({ value, onChange, options, className }) => {
  const isOther = value && !options.includes(value);
  const [showCustom, setShowCustom] = useState(isOther);
  const [customVal, setCustomVal] = useState(isOther ? value : '');
  const handleSelect = (e) => {
    if (e.target.value === '__other__') { setShowCustom(true); onChange(customVal || ''); }
    else { setShowCustom(false); onChange(e.target.value); }
  };
  const selectValue = showCustom ? '__other__' : (options.includes(value) ? value : (value ? '__other__' : options[0]));
  return (
    <div className="space-y-2">
      <select value={selectValue} onChange={handleSelect} className={className}>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
        <option value="__other__">Other (specify)</option>
      </select>
      {showCustom && (
        <input type="text" value={customVal}
          onChange={e => { setCustomVal(e.target.value); onChange(e.target.value); }}
          placeholder="Please specify..." className={className} />
      )}
    </div>
  );
};

const ListInput = ({ values, onChange, placeholder }) => {
  const [input, setInput] = useState('');
  const add = () => { if (!input.trim()) return; onChange([...values, input.trim()]); setInput(''); };
  return (
    <div>
      <div className="flex gap-2 mb-2">
        <input type="text" placeholder={placeholder} value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }} className={inputClass} />
        <button type="button" onClick={add}
          className="px-3 py-2 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl hover:bg-blue-100 transition-colors flex-shrink-0">
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {values.map((v, i) => (
            <span key={i} className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-100 text-[11px] px-2.5 py-1 rounded-full font-medium">
              {v}
              <button type="button" onClick={() => onChange(values.filter((_, j) => j !== i))}
                className="text-blue-400 hover:text-red-500 transition-colors">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

const ModuleItem = ({ mod, index, onChange, onRemove }) => {
  const [topicInput, setTopicInput] = useState('');
  const [videoInput, setVideoInput] = useState({ title: '', url: '' });
  const addTopic = () => {
    if (!topicInput.trim()) return;
    onChange({ ...mod, topics: [...(mod.topics || []), topicInput.trim()] });
    setTopicInput('');
  };
  const addVideo = () => {
    if (!videoInput.url.trim()) return;
    onChange({ ...mod, videos: [...(mod.videos || []), { title: videoInput.title.trim(), url: videoInput.url.trim() }] });
    setVideoInput({ title: '', url: '' });
  };

  return (
    <div className="border border-blue-100 rounded-xl p-3 bg-blue-50/30">
      <div className="flex items-start gap-2.5">
        <div className="w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="text-xs font-black text-[#003399]">{index + 1}</span>
        </div>
        <div className="flex-1 space-y-3">
          <div className="flex gap-2">
            <input type="text" placeholder="Module name *" value={mod.module}
              onChange={e => onChange({ ...mod, module: e.target.value })} className={inputClass} />
            <input type="number" placeholder="Hrs" value={mod.duration || ''}
              onChange={e => onChange({ ...mod, duration: +e.target.value })}
              className={`${inputClass} w-20`} min="0" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Topics</p>
            <div className="flex gap-2 mb-2">
              <input type="text" placeholder="Add topic (Enter)" value={topicInput}
                onChange={e => setTopicInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTopic(); } }} className={inputClass} />
              <button type="button" onClick={addTopic}
                className="px-2.5 py-2 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl hover:bg-blue-100 flex-shrink-0">
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            {mod.topics?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {mod.topics.map((t, j) => (
                  <span key={j} className="inline-flex items-center gap-1 bg-white text-gray-700 text-[10px] px-2 py-0.5 rounded-full border border-gray-200">
                    {t}
                    <button type="button" onClick={() => onChange({ ...mod, topics: mod.topics.filter((_, k) => k !== j) })}
                      className="text-gray-400 hover:text-red-500"><X className="w-2.5 h-2.5" /></button>
                  </span>
                ))}
              </div>
            )}
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-500 mb-1.5 flex items-center gap-1 uppercase tracking-wider">
              <Video className="w-3 h-3 text-cyan-500" /> Primary Module Video URL
            </p>
            <input type="url" placeholder="https://youtube.com/watch?v=... or embed URL"
              value={mod.videoUrl || ''}
              onChange={e => onChange({ ...mod, videoUrl: e.target.value })}
              className={inputClass} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-500 mb-1.5 flex items-center gap-1 uppercase tracking-wider">
              <Link className="w-3 h-3 text-indigo-500" /> Additional Videos
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
              <input type="text" placeholder="Video title (optional)" value={videoInput.title}
                onChange={e => setVideoInput(p => ({ ...p, title: e.target.value }))} className={inputClass} />
              <div className="flex gap-2">
                <input type="url" placeholder="Video URL *" value={videoInput.url}
                  onChange={e => setVideoInput(p => ({ ...p, url: e.target.value }))}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addVideo(); } }} className={inputClass} />
                <button type="button" onClick={addVideo}
                  className="px-2.5 py-2 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-xl hover:bg-indigo-100 flex-shrink-0">
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            {(mod.videos || []).length > 0 && (
              <div className="space-y-1.5">
                {mod.videos.map((v, j) => (
                  <div key={j} className="flex items-center gap-2 bg-white border border-gray-100 rounded-lg px-3 py-1.5 group">
                    <Video className="w-3 h-3 text-indigo-400 flex-shrink-0" />
                    <span className="text-[11px] text-gray-600 flex-1 min-w-0 truncate">
                      {v.title && <span className="font-semibold mr-1">{v.title} —</span>}
                      <a href={v.url} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">{v.url}</a>
                    </span>
                    <button type="button"
                      onClick={() => onChange({ ...mod, videos: mod.videos.filter((_, k) => k !== j) })}
                      className="text-gray-300 hover:text-red-500 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <button type="button" onClick={onRemove}
          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

const Section = ({ children, title, icon, sub, noBg }) => (
  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
    <SHead icon={icon} title={title} sub={sub} noBg={noBg} />
    <div className="space-y-4">{children}</div>
  </div>
);

// ── Multi-College Picker ─────────────────────────────────────────────────────
const CollegePicker = ({ selectedIds, onChange, colleges, loading }) => {
  const [search, setSearch] = useState('');
  const filtered = colleges.filter(c =>
    !search.trim() || c.name.toLowerCase().includes(search.toLowerCase()) || c.code?.toLowerCase().includes(search.toLowerCase())
  );
  const toggle = (id) => {
    if (selectedIds.includes(id)) onChange(selectedIds.filter(x => x !== id));
    else onChange([...selectedIds, id]);
  };
  const isPlatformWide = selectedIds.length === 0;

  return (
    <div className="space-y-3">
      {/* Scope indicator */}
      <div className={`flex items-start gap-2.5 p-3 rounded-xl border transition-all ${isPlatformWide ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}`}>
        <Globe className={`w-4 h-4 flex-shrink-0 mt-0.5 ${isPlatformWide ? 'text-green-600' : 'text-blue-500'}`} />
        <div>
          <p className={`text-xs font-bold ${isPlatformWide ? 'text-green-700' : 'text-blue-700'}`}>
            {isPlatformWide ? '🌐 Platform-Wide Course' : `🏫 Restricted to ${selectedIds.length} College(s)`}
          </p>
          <p className={`text-[10px] mt-0.5 ${isPlatformWide ? 'text-green-600' : 'text-blue-600'}`}>
            {isPlatformWide
              ? 'All colleges can access this course. Individual student assignment will be disabled.'
              : 'Only students from selected colleges can access this course. Individual assignment is enabled.'}
          </p>
        </div>
      </div>

      {/* Selected colleges chips */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedIds.map(id => {
            const col = colleges.find(c => c._id === id);
            return col ? (
              <span key={id} className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-800 border border-blue-200 text-[11px] px-2.5 py-1 rounded-full font-semibold">
                <Building2 className="w-3 h-3" />{col.name}
                <button type="button" onClick={() => toggle(id)} className="text-blue-400 hover:text-red-500 transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ) : null;
          })}
        </div>
      )}

      {/* College search + list */}
      {loading ? (
        <div className="flex items-center gap-2 py-3 text-xs text-gray-400">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Loading colleges...
        </div>
      ) : (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="relative border-b border-gray-100">
            <input
              type="text"
              placeholder="Search colleges..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full px-3 py-2 text-xs focus:outline-none bg-gray-50"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="py-4 text-center text-xs text-gray-400">No colleges found</div>
            ) : filtered.map(col => {
              const isSelected = selectedIds.includes(col._id);
              return (
                <button
                  key={col._id}
                  type="button"
                  onClick={() => toggle(col._id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-all border-b border-gray-50 last:border-0 hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}
                >
                  <div className={`flex-shrink-0 transition-colors ${isSelected ? 'text-blue-600' : 'text-gray-300'}`}>
                    {isSelected ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold truncate ${isSelected ? 'text-blue-700' : 'text-gray-800'}`}>{col.name}</p>
                    {col.code && <p className="text-[10px] text-gray-400">{col.code}</p>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
      <p className="text-[10px] text-gray-400 flex items-center gap-1">
        <Info className="w-3 h-3" /> Select no colleges for platform-wide access, or pick specific colleges to restrict access.
      </p>
    </div>
  );
};

// ══════════════════════════════════════════
const SuperAdminCourseForm = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const isEdit = !!courseId;
  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);
  const [colleges, setColleges] = useState([]);
  const [collegesLoading, setCollegesLoading] = useState(true);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    fetchColleges();
    if (isEdit) fetchCourse();
  }, [courseId]);

  const fetchColleges = async () => {
    setCollegesLoading(true);
    try {
      const res = await superAdminStudentAPI.getColleges();
      if (res?.success) setColleges(res.data || res.colleges || []);
    } catch { }
    finally { setCollegesLoading(false); }
  };

  const fetchCourse = async () => {
    try {
      const res = await superAdminCourseAPI.getCourseById(courseId);
      if (res.success) {
        const c = res.data;
        setForm({
          title: c.title || '', description: c.description || '', shortDescription: c.shortDescription || '',
          category: c.category || 'Full Stack Development', level: c.level || 'Beginner',
          duration: { hours: c.duration?.hours || 1, weeks: c.duration?.weeks || 0 },
          price: { original: c.price?.original || 0, discounted: c.price?.discounted || 0, currency: c.price?.currency || 'INR' },
          instructor: { name: c.instructor?.name || '', bio: c.instructor?.bio || '', experience: c.instructor?.experience || 0 },
          curriculum: (c.curriculum || []).map(m => ({ ...m, videoUrl: m.videoUrl || '', videos: m.videos || [] })),
          prerequisites: c.prerequisites || [], learningOutcomes: c.learningOutcomes || [],
          thumbnail: c.thumbnail || '', videoUrl: c.videoUrl || '', syllabusUrl: c.syllabusUrl || '',
          status: c.status || 'Draft', deliveryMode: c.deliveryMode || 'ONLINE', language: c.language || 'English',
          tags: c.tags || [], certificateProvided: c.certificateProvided !== false,
          maxEnrollments: c.maxEnrollments || '',
          startDate: c.startDate ? c.startDate.split('T')[0] : '',
          endDate: c.endDate ? c.endDate.split('T')[0] : '',
          registrationDeadline: c.registrationDeadline ? c.registrationDeadline.split('T')[0] : '',
          // Support both new collegeIds array and legacy collegeId
          collegeIds: c.collegeIds?.map(col => col._id || col) || (c.collegeId ? [c.collegeId._id || c.collegeId] : []),
        });
      }
    } catch { showToast('Failed to load course data', 'error'); }
    finally { setLoading(false); }
  };

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));
  const setNested = (parent, field, value) => setForm(prev => ({ ...prev, [parent]: { ...prev[parent], [field]: value } }));

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Title is required';
    if (!form.description.trim()) errs.description = 'Description is required';
    if (!form.instructor.name.trim()) errs.instructorName = 'Instructor name is required';
    if (!form.duration.hours || form.duration.hours < 1) errs.hours = 'Duration must be at least 1 hour';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) { showToast('Please fix validation errors', 'error'); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        collegeIds: form.collegeIds,
        maxEnrollments: form.maxEnrollments ? +form.maxEnrollments : undefined,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        registrationDeadline: form.registrationDeadline || undefined,
      };
      const res = isEdit
        ? await superAdminCourseAPI.updateCourse(courseId, payload)
        : await superAdminCourseAPI.createCourse(payload);
      if (res.success) {
        showToast(isEdit ? 'Course updated!' : 'Course created!');
        setTimeout(() => navigate('/dashboard/super-admin/courses'), 1200);
      } else { showToast(res.message || 'Operation failed', 'error'); }
    } catch (err) { showToast(err.message || 'Operation failed', 'error'); }
    finally { setSaving(false); }
  };

  if (loading) return <DetailSkeleton layout={SuperAdminDashboardLayout} />;

  return (
    <SuperAdminDashboardLayout>
      <div className="px-6 py-4 md:px-8 md:py-6 space-y-5 font-sans">

        {toast && (
          <div className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl text-xs font-bold border backdrop-blur-xl ${toast.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
            {toast.type === 'error' ? <AlertCircle className="w-4 h-4 flex-shrink-0" /> : <CheckCircle2 className="w-4 h-4 flex-shrink-0" />}
            {toast.msg}
          </div>
        )}

        {/* Brand Header */}
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span className="w-2 h-8 bg-gradient-to-b from-[#003399] to-[#00A9CE] rounded-full" />
              {isEdit ? 'Edit Course' : 'Create New Course'}
            </h1>
            <p className="text-sm text-slate-400 mt-1 font-medium">
              {isEdit ? 'Update existing course details and curriculum' : 'Fill in the details to launch a new course'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

        {/* Platform Scope */}
        <Section title="Platform Scope" icon={Globe} sub="Select which colleges can access this course">
          <CollegePicker
            selectedIds={form.collegeIds}
            onChange={ids => set('collegeIds', ids)}
            colleges={colleges}
            loading={collegesLoading}
          />
        </Section>

        {/* Basic Info */}
        <Section title="Basic Information" icon={BookOpen} sub="Core course identity and classification">
          <FormField label="Course Title" required error={errors.title}>
            <input type="text" value={form.title} onChange={e => set('title', e.target.value)}
              className={inputClass} placeholder="e.g., Full Stack Web Development" />
          </FormField>
          <FormField label="Short Description" hint="Max 200 characters">
            <textarea value={form.shortDescription} onChange={e => set('shortDescription', e.target.value)}
              className={inputClass} rows={2} maxLength={200} />
            <p className="text-[10px] text-gray-400 mt-1">{form.shortDescription.length}/200</p>
          </FormField>
          <FormField label="Full Description" required error={errors.description}>
            <textarea value={form.description} onChange={e => set('description', e.target.value)}
              className={inputClass} rows={5} />
          </FormField>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Category" required>
              <SelectWithOther value={form.category} onChange={v => set('category', v)}
                options={['Full Stack Development','Data Science','AI/ML','DevOps','Cloud Computing','Mobile Development','Cybersecurity','Blockchain']}
                className={selectClass} />
            </FormField>
            <FormField label="Level" required>
              <SelectWithOther value={form.level} onChange={v => set('level', v)}
                options={['Beginner','Intermediate','Advanced']} className={selectClass} />
            </FormField>

            {/* Status with workflow hints */}
            <FormField label="Status" hint="Draft → Coming Soon → Active (auto at start date) → Inactive">
              <select value={form.status} onChange={e => set('status', e.target.value)} className={selectClass}>
                {STATUS_OPTIONS.map(s => (
                  <option key={s.value} value={s.value}>{s.label} — {s.hint}</option>
                ))}
              </select>
              <div className="mt-1.5 flex items-center gap-1.5">
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                  form.status === 'Active' ? 'bg-green-50 text-green-700 border-green-200' :
                  form.status === 'Draft' ? 'bg-gray-50 text-gray-500 border-gray-200' :
                  form.status === 'Coming Soon' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                  'bg-red-50 text-red-600 border-red-200'
                }`}>{form.status}</span>
                {form.status === 'Coming Soon' && <span className="text-[10px] text-amber-600">Will auto-activate on start date</span>}
                {form.status === 'Active' && <span className="text-[10px] text-green-600">Will auto-deactivate on end date</span>}
              </div>
            </FormField>

            <FormField label="Delivery Mode">
              <SelectWithOther value={form.deliveryMode} onChange={v => set('deliveryMode', v)}
                options={['ONLINE','OFFLINE','HYBRID']} className={selectClass} />
            </FormField>
            <FormField label="Language">
              <SelectWithOther value={form.language} onChange={v => set('language', v)}
                options={['English','Hindi','Tamil','Telugu','Bilingual']} className={selectClass} />
            </FormField>
            <FormField label="Tags" hint="Press Enter to add">
              <ListInput values={form.tags} onChange={v => set('tags', v)} placeholder="e.g., react, nodejs" />
            </FormField>
          </div>
        </Section>

        {/* Duration & Pricing */}
        <Section title="Duration & Pricing" icon={Clock} sub="Time commitment and cost details">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField label="Duration (Hours)" required error={errors.hours}>
              <input type="number" value={form.duration.hours} onChange={e => setNested('duration','hours',+e.target.value)} className={inputClass} min="1" />
            </FormField>
            <FormField label="Duration (Weeks)">
              <input type="number" value={form.duration.weeks} onChange={e => setNested('duration','weeks',+e.target.value)} className={inputClass} min="0" />
            </FormField>
            <FormField label="Max Enrollments" hint="Blank = unlimited">
              <input type="number" value={form.maxEnrollments} onChange={e => set('maxEnrollments', e.target.value)} className={inputClass} min="0" placeholder="Unlimited" />
            </FormField>
            <FormField label="Original Price (₹)">
              <input type="number" value={form.price.original} onChange={e => setNested('price','original',+e.target.value)} className={inputClass} min="0" />
            </FormField>
            <FormField label="Discounted Price (₹)">
              <input type="number" value={form.price.discounted} onChange={e => setNested('price','discounted',+e.target.value)} className={inputClass} min="0" />
            </FormField>
            <FormField label="Currency">
              <select value={form.price.currency} onChange={e => setNested('price','currency',e.target.value)} className={selectClass}>
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
              </select>
            </FormField>
          </div>
        </Section>

        {/* Instructor */}
        <Section title="Instructor" icon={Target} sub="Details about the course instructor">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Instructor Name" required error={errors.instructorName}>
              <input type="text" value={form.instructor.name} onChange={e => setNested('instructor','name',e.target.value)} className={inputClass} placeholder="Full name" />
            </FormField>
            <FormField label="Years of Experience">
              <input type="number" value={form.instructor.experience} onChange={e => setNested('instructor','experience',+e.target.value)} className={inputClass} min="0" />
            </FormField>
            <div className="sm:col-span-2">
              <FormField label="Instructor Bio">
                <textarea value={form.instructor.bio} onChange={e => setNested('instructor','bio',e.target.value)} className={inputClass} rows={3} />
              </FormField>
            </div>
          </div>
        </Section>

        {/* Curriculum */}
        <Section title="Course Curriculum" icon={Layers} sub="Modules, topics, and video resources" noBg>
          <p className="text-[10px] text-gray-400 -mt-2">Paste any YouTube URL (watch or share link) — the player handles conversion automatically.</p>
          <div className="space-y-3">
            {form.curriculum.map((mod, i) => (
              <ModuleItem key={i} mod={mod} index={i}
                onChange={updated => set('curriculum', form.curriculum.map((m, j) => j === i ? updated : m))}
                onRemove={() => set('curriculum', form.curriculum.filter((_, j) => j !== i))} />
            ))}
            <button type="button"
              onClick={() => set('curriculum', [...form.curriculum, { module: '', topics: [], duration: 0, videoUrl: '', videos: [] }])}
              className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-blue-200 text-blue-600 rounded-xl hover:border-blue-400 hover:bg-blue-50/40 text-xs font-bold transition-all">
              <Plus className="w-3.5 h-3.5" /> Add Module
            </button>
          </div>
        </Section>

        {/* Outcomes & Prerequisites */}
        <Section title="Learning & Prerequisites" icon={Award} sub="What students learn and what they need">
          <FormField label="Learning Outcomes">
            <ListInput values={form.learningOutcomes} onChange={v => set('learningOutcomes', v)} placeholder="e.g., Build full-stack apps" />
          </FormField>
          <FormField label="Prerequisites">
            <ListInput values={form.prerequisites} onChange={v => set('prerequisites', v)} placeholder="e.g., Basic HTML/CSS" />
          </FormField>
        </Section>

        {/* Media */}
        <Section title="Media & Resources" icon={BookOpen} sub="Thumbnails, preview video, and syllabus">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Thumbnail URL">
              <input type="url" value={form.thumbnail} onChange={e => set('thumbnail', e.target.value)} className={inputClass} placeholder="https://..." />
            </FormField>
            <FormField label="Preview Video URL" hint="YouTube watch/share links are accepted">
              <input type="url" value={form.videoUrl} onChange={e => set('videoUrl', e.target.value)} className={inputClass} placeholder="https://youtube.com/watch?v=..." />
            </FormField>
            <FormField label="Syllabus PDF URL">
              <input type="url" value={form.syllabusUrl} onChange={e => set('syllabusUrl', e.target.value)} className={inputClass} placeholder="https://..." />
            </FormField>
          </div>
        </Section>

        {/* Dates */}
        <Section title="Dates & Settings" icon={Award} sub="Scheduling and certificate options">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-700 flex items-start gap-2">
            <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span><strong>Auto-transition:</strong> When status is "Coming Soon", the course automatically becomes <strong>Active</strong> on the start date. It becomes <strong>Inactive</strong> after the end date.</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField label="Start Date">
              <input type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)} className={inputClass} />
            </FormField>
            <FormField label="End Date">
              <input type="date" value={form.endDate} onChange={e => set('endDate', e.target.value)} className={inputClass} />
            </FormField>
            <FormField label="Registration Deadline">
              <input type="date" value={form.registrationDeadline} onChange={e => set('registrationDeadline', e.target.value)} className={inputClass} />
            </FormField>
          </div>
          <div
            className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${form.certificateProvided ? 'bg-blue-50 border-blue-100' : 'bg-gray-50 border-gray-200'}`}
            onClick={() => set('certificateProvided', !form.certificateProvided)}>
            <div className={`relative w-9 h-5 rounded-full flex-shrink-0 transition-colors duration-200 ${form.certificateProvided ? 'bg-gradient-to-r from-blue-500 to-cyan-400' : 'bg-gray-300'}`}>
              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${form.certificateProvided ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
            </div>
            <label className={`text-xs font-bold cursor-pointer ${form.certificateProvided ? 'text-blue-700' : 'text-gray-600'}`}>
              Provide certificate upon completion
            </label>
          </div>
        </Section>

        {/* Submit row */}
        <div className="flex justify-end gap-3 pb-4">
          <button type="button" onClick={() => navigate('/dashboard/super-admin/courses')}
            className="inline-flex items-center gap-2 border border-gray-200 bg-white text-gray-600 text-xs font-semibold px-5 py-2.5 rounded-xl hover:bg-gray-50 transition-all">
            <X className="w-3.5 h-3.5" /> Cancel
          </button>
          <button type="submit" disabled={saving}
            className="inline-flex items-center gap-2 bg-[#003399] hover:bg-[#002d8b] text-white text-xs font-black px-5 py-2.5 rounded-xl shadow-sm hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100">
            {saving ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving…</> : <><Save className="w-3.5 h-3.5" />{isEdit ? 'Update Course' : 'Create Course'}</>}
          </button>
        </div>
      </form>
      </div>

    </SuperAdminDashboardLayout>
  );
};

export default SuperAdminCourseForm;