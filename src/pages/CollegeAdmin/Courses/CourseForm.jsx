// pages/CollegeAdmin/Courses/CourseForm.jsx
// Admin: Create or Edit a course — full form with curriculum builder
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  BookOpen, ChevronLeft, Plus, Trash2, Save, AlertCircle,
  CheckCircle2, Layers, Target, Award, Clock, RefreshCw,
  X, Video, Link
} from 'lucide-react';
import CollegeAdminLayout from '../../../components/layout/CollegeAdminLayout';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { collegeAdminCourseAPI as courseAPI } from '../../../api/Api';

const INITIAL_FORM = {
  title: '', description: '', shortDescription: '',
  category: 'Full Stack Development', level: 'Beginner',
  duration: { hours: 1, weeks: 0 },
  price: { original: 0, discounted: 0, currency: 'INR' },
  instructor: { name: '', bio: '', experience: 0 },
  curriculum: [],
  prerequisites: [],
  learningOutcomes: [],
  thumbnail: '', videoUrl: '', syllabusUrl: '',
  status: 'Active', deliveryMode: 'ONLINE', language: 'English',
  tags: [],
  certificateProvided: true,
  maxEnrollments: '',
  startDate: '', endDate: '', registrationDeadline: '',
};

const inputClass = "w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-sm text-gray-800 placeholder-gray-400 bg-white";
const selectClass = `${inputClass}`;

const SelectWithOther = ({ value, onChange, options, className }) => {
  const knownOptions = options;
  const isOther = value && !knownOptions.includes(value);
  const [showCustom, setShowCustom] = useState(isOther);
  const [customVal, setCustomVal] = useState(isOther ? value : '');

  const handleSelect = (e) => {
    if (e.target.value === '__other__') {
      setShowCustom(true);
      onChange(customVal || '');
    } else {
      setShowCustom(false);
      onChange(e.target.value);
    }
  };

  const selectValue = showCustom ? '__other__' : (knownOptions.includes(value) ? value : (value ? '__other__' : knownOptions[0]));

  return (
    <div className="space-y-2">
      <select value={selectValue} onChange={handleSelect} className={className}>
        {knownOptions.map(o => <option key={o} value={o}>{o}</option>)}
        <option value="__other__">Other (specify)</option>
      </select>
      {showCustom && (
        <input
          type="text"
          value={customVal}
          onChange={e => { setCustomVal(e.target.value); onChange(e.target.value); }}
          placeholder="Please specify..."
          className={className}
        />
      )}
    </div>
  );
};

const FormField = ({ label, required, hint, children }) => (
  <div>
    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {hint && <p className="text-xs text-gray-400 mb-1.5">{hint}</p>}
    {children}
  </div>
);

const Section = ({ title, icon: Icon, gradient, children }) => (
  <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-5">
    <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-50">
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${gradient}`}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <h3 className="font-bold text-gray-900 text-sm">{title}</h3>
    </div>
    <div className="space-y-5">{children}</div>
  </div>
);

const ListInput = ({ values, onChange, placeholder }) => {
  const [input, setInput] = useState('');
  const add = () => { if (!input.trim()) return; onChange([...values, input.trim()]); setInput(''); };
  return (
    <div>
      <div className="flex gap-2 mb-2">
        <input type="text" placeholder={placeholder} value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }} className={inputClass} />
        <button type="button" onClick={add} className="px-3 py-2.5 bg-blue-100 text-blue-600 rounded-xl hover:bg-blue-200 transition-colors flex-shrink-0">
          <Plus className="w-4 h-4" />
        </button>
      </div>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {values.map((v, i) => (
            <span key={i} className="flex items-center gap-1.5 bg-blue-50 text-blue-700 text-xs px-3 py-1.5 rounded-full border border-blue-100">
              {v}
              <button type="button" onClick={() => onChange(values.filter((_, j) => j !== i))} className="text-blue-400 hover:text-red-500 transition-colors">
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
    <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/50">
      <div className="flex items-start gap-3">
        <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
          <span className="text-xs font-bold text-white">{index + 1}</span>
        </div>
        <div className="flex-1 space-y-3">
          <div className="flex gap-2">
            <input type="text" placeholder="Module name *" value={mod.module}
              onChange={e => onChange({ ...mod, module: e.target.value })} className={inputClass} />
            <input type="number" placeholder="Hours" value={mod.duration || ''}
              onChange={e => onChange({ ...mod, duration: +e.target.value })}
              className={`${inputClass} w-28`} min="0" />
          </div>

          <div>
            <p className="text-xs font-bold text-gray-500 mb-1.5">Topics</p>
            <div className="flex gap-2 mb-2">
              <input type="text" placeholder="Add topic and press Enter" value={topicInput}
                onChange={e => setTopicInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTopic(); } }}
                className={inputClass} />
              <button type="button" onClick={addTopic} className="px-3 py-2 bg-blue-100 text-blue-600 rounded-xl hover:bg-blue-200 flex-shrink-0">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {mod.topics?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {mod.topics.map((t, j) => (
                  <span key={j} className="flex items-center gap-1 bg-white text-gray-700 text-xs px-2.5 py-1 rounded-full border border-gray-200">
                    {t}
                    <button type="button" onClick={() => onChange({ ...mod, topics: mod.topics.filter((_, k) => k !== j) })} className="text-gray-400 hover:text-red-500">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="text-xs font-bold text-gray-500 mb-1.5 flex items-center gap-1.5">
              <Video className="w-3.5 h-3.5 text-cyan-500" /> Primary Module Video URL
            </p>
            <input type="url" placeholder="https://youtube.com/... or any video URL"
              value={mod.videoUrl || ''}
              onChange={e => onChange({ ...mod, videoUrl: e.target.value })}
              className={inputClass} />
          </div>

          <div>
            <p className="text-xs font-bold text-gray-500 mb-1.5 flex items-center gap-1.5">
              <Link className="w-3.5 h-3.5 text-indigo-500" /> Additional Videos
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
              <input type="text" placeholder="Video title (optional)"
                value={videoInput.title}
                onChange={e => setVideoInput(p => ({ ...p, title: e.target.value }))}
                className={inputClass} />
              <div className="flex gap-2">
                <input type="url" placeholder="Video URL *"
                  value={videoInput.url}
                  onChange={e => setVideoInput(p => ({ ...p, url: e.target.value }))}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addVideo(); } }}
                  className={inputClass} />
                <button type="button" onClick={addVideo} className="px-3 py-2 bg-indigo-100 text-indigo-600 rounded-xl hover:bg-indigo-200 flex-shrink-0">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
            {(mod.videos || []).length > 0 && (
              <div className="space-y-1.5">
                {mod.videos.map((v, j) => (
                  <div key={j} className="flex items-center gap-2 bg-white border border-gray-100 rounded-lg px-3 py-2 group">
                    <Video className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                    <span className="text-xs text-gray-600 flex-1 min-w-0">
                      {v.title && <span className="font-semibold mr-1">{v.title} —</span>}
                      <a href={v.url} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline truncate inline-block max-w-xs">{v.url}</a>
                    </span>
                    <button type="button" onClick={() => onChange({ ...mod, videos: mod.videos.filter((_, k) => k !== j) })}
                      className="text-gray-300 hover:text-red-500 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <button type="button" onClick={onRemove} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors mt-1 flex-shrink-0">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

const CourseForm = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const isEdit = !!courseId;

  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };

  useEffect(() => { if (isEdit) fetchCourse(); }, [courseId]);

  const fetchCourse = async () => {
    try {
      const res = await courseAPI.getCourseById(courseId);
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
          status: c.status || 'Active', deliveryMode: c.deliveryMode || 'ONLINE', language: c.language || 'English',
          tags: c.tags || [], certificateProvided: c.certificateProvided !== false,
          maxEnrollments: c.maxEnrollments || '',
          startDate: c.startDate ? c.startDate.split('T')[0] : '',
          endDate: c.endDate ? c.endDate.split('T')[0] : '',
          registrationDeadline: c.registrationDeadline ? c.registrationDeadline.split('T')[0] : '',
        });
      }
    } catch (err) { showToast('Failed to load course data', 'error'); }
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
    if (form.price.original < 0) errs.price = 'Price cannot be negative';
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
        maxEnrollments: form.maxEnrollments ? +form.maxEnrollments : undefined,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        registrationDeadline: form.registrationDeadline || undefined,
      };
      const res = isEdit ? await courseAPI.updateCourse(courseId, payload) : await courseAPI.createCourse(payload);
      if (res.success) {
        showToast(isEdit ? 'Course updated successfully!' : 'Course created successfully!');
        setTimeout(() => navigate('/dashboard/college-admin/courses'), 1200);
      } else { showToast(res.message || 'Operation failed', 'error'); }
    } catch (err) { showToast(err.message || 'Operation failed', 'error'); }
    finally { setSaving(false); }
  };

  if (loading) return <LoadingSpinner message="Loading Course..." submessage="Fetching course data" icon={BookOpen} />;

  return (
    <CollegeAdminLayout>
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-sm font-medium ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
          {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Hero Banner */}
      <div className="relative bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 rounded-2xl px-5 py-4 mb-4 shadow-xl shadow-blue-500/20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-10 -right-10 w-44 h-44 bg-white/10 rounded-full" />
          <div className="absolute -bottom-8 left-1/3 w-28 h-28 bg-white/10 rounded-full" />
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle,white 1px,transparent 1px)', backgroundSize: '18px 18px' }} />
        </div>
        <div className="relative flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-black text-lg leading-tight">{isEdit ? 'Edit Course' : 'Create New Course'}</h1>
              <p className="text-blue-200 text-[11px] mt-0.5">{isEdit ? 'Update course details and curriculum' : 'Fill in the details below to create a new course'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => navigate('/dashboard/college-admin/courses')}
              className="inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Back
            </button>
            <button onClick={handleSubmit} disabled={saving}
              className="inline-flex items-center gap-1.5 bg-white text-blue-600 text-xs font-bold px-4 py-2.5 rounded-xl shadow-md hover:bg-blue-50 hover:scale-105 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {saving ? 'Saving...' : isEdit ? 'Update Course' : 'Create Course'}
            </button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Basic Information */}
        <Section title="Basic Information" icon={BookOpen} gradient="bg-gradient-to-br from-blue-500 to-cyan-500">
          <FormField label="Course Title" required>
            <input type="text" value={form.title} onChange={e => set('title', e.target.value)} className={inputClass} placeholder="e.g., Full Stack Web Development with React & Node.js" />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
          </FormField>
          <FormField label="Short Description" hint="Max 200 characters — shown in course cards">
            <textarea value={form.shortDescription} onChange={e => set('shortDescription', e.target.value)} className={inputClass} rows={2} placeholder="Brief overview of the course" maxLength={200} />
            <p className="text-xs text-gray-400 mt-1">{form.shortDescription.length}/200</p>
          </FormField>
          <FormField label="Full Description" required>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} className={inputClass} rows={5} placeholder="Detailed course description..." />
            {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
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
            <FormField label="Status">
              <select value={form.status} onChange={e => set('status', e.target.value)} className={selectClass}>
                {['Active','Inactive','Draft','Coming Soon'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
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
              <ListInput values={form.tags} onChange={v => set('tags', v)} placeholder="e.g., react, javascript" />
            </FormField>
          </div>
        </Section>

        {/* Duration & Pricing */}
        <Section title="Duration & Pricing" icon={Clock} gradient="bg-gradient-to-br from-amber-400 to-orange-500">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField label="Duration (Hours)" required>
              <input type="number" value={form.duration.hours} onChange={e => setNested('duration','hours',+e.target.value)} className={inputClass} min="1" />
              {errors.hours && <p className="text-xs text-red-500 mt-1">{errors.hours}</p>}
            </FormField>
            <FormField label="Duration (Weeks)">
              <input type="number" value={form.duration.weeks} onChange={e => setNested('duration','weeks',+e.target.value)} className={inputClass} min="0" />
            </FormField>
            <FormField label="Max Enrollments" hint="Leave blank for unlimited">
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
        <Section title="Instructor" icon={Target} gradient="bg-gradient-to-br from-purple-500 to-violet-600">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Instructor Name" required>
              <input type="text" value={form.instructor.name} onChange={e => setNested('instructor','name',e.target.value)} className={inputClass} placeholder="Full name" />
              {errors.instructorName && <p className="text-xs text-red-500 mt-1">{errors.instructorName}</p>}
            </FormField>
            <FormField label="Years of Experience">
              <input type="number" value={form.instructor.experience} onChange={e => setNested('instructor','experience',+e.target.value)} className={inputClass} min="0" />
            </FormField>
            <div className="sm:col-span-2">
              <FormField label="Instructor Bio">
                <textarea value={form.instructor.bio} onChange={e => setNested('instructor','bio',e.target.value)} className={inputClass} rows={3} placeholder="Brief biography..." />
              </FormField>
            </div>
          </div>
        </Section>

        {/* Curriculum */}
        <Section title="Course Curriculum" icon={Layers} gradient="bg-gradient-to-br from-cyan-500 to-teal-600">
          <p className="text-xs text-gray-400 -mt-2 mb-1">Each module has a primary video URL and supports multiple additional videos.</p>
          <div className="space-y-3">
            {form.curriculum.map((mod, i) => (
              <ModuleItem key={i} mod={mod} index={i}
                onChange={updated => set('curriculum', form.curriculum.map((m, j) => j === i ? updated : m))}
                onRemove={() => set('curriculum', form.curriculum.filter((_, j) => j !== i))} />
            ))}
            <button type="button"
              onClick={() => set('curriculum', [...form.curriculum, { module: '', topics: [], duration: 0, videoUrl: '', videos: [] }])}
              className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-blue-200 text-blue-600 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all text-sm font-semibold">
              <Plus className="w-4 h-4" /> Add Module
            </button>
          </div>
        </Section>

        {/* Learning & Prerequisites */}
        <Section title="Learning & Prerequisites" icon={Award} gradient="bg-gradient-to-br from-green-500 to-emerald-600">
          <FormField label="Learning Outcomes" hint="What students will learn — press Enter to add">
            <ListInput values={form.learningOutcomes} onChange={v => set('learningOutcomes', v)} placeholder="e.g., Build full-stack web applications" />
          </FormField>
          <FormField label="Prerequisites" hint="Required background knowledge">
            <ListInput values={form.prerequisites} onChange={v => set('prerequisites', v)} placeholder="e.g., Basic HTML/CSS knowledge" />
          </FormField>
        </Section>

        {/* Media & Resources */}
        <Section title="Media & Resources" icon={BookOpen} gradient="bg-gradient-to-br from-indigo-500 to-blue-600">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Thumbnail URL" hint="Course cover image">
              <input type="url" value={form.thumbnail} onChange={e => set('thumbnail', e.target.value)} className={inputClass} placeholder="https://..." />
            </FormField>
            <FormField label="Preview Video URL">
              <input type="url" value={form.videoUrl} onChange={e => set('videoUrl', e.target.value)} className={inputClass} placeholder="YouTube embed or video URL" />
            </FormField>
            <FormField label="Syllabus PDF URL">
              <input type="url" value={form.syllabusUrl} onChange={e => set('syllabusUrl', e.target.value)} className={inputClass} placeholder="https://..." />
            </FormField>
          </div>
        </Section>

        {/* Dates & Settings */}
        <Section title="Dates & Settings" icon={Clock} gradient="bg-gradient-to-br from-rose-500 to-pink-600">
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
          <div className="flex items-center gap-3 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
            <input id="cert" type="checkbox" checked={form.certificateProvided} onChange={e => set('certificateProvided', e.target.checked)} className="w-4 h-4 rounded accent-blue-600" />
            <label htmlFor="cert" className="text-sm font-medium text-gray-700 cursor-pointer">Provide certificate upon course completion</label>
          </div>
        </Section>

        {/* Submit Row */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-4 flex items-center justify-end gap-3">
          <button type="button" onClick={() => navigate('/dashboard/college-admin/courses')}
            className="px-5 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold rounded-xl hover:opacity-90 shadow-lg shadow-blue-500/20 transition-all disabled:opacity-60 text-sm">
            {saving ? <><RefreshCw className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> {isEdit ? 'Update Course' : 'Create Course'}</>}
          </button>
        </div>
      </form>
    </CollegeAdminLayout>
  );
};

export default CourseForm;