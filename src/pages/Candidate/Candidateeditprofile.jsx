// src/pages/Candidate/CandidateEditProfile.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';
import CandidateLayout from '../../components/layout/CandidateLayout';
import {
  User, Mail, Phone, MapPin, GraduationCap,
  Briefcase, Target, BookOpen, ChevronLeft,
  Save, Calendar, Hash, Building2,
  Globe, Code, Layers, Lightbulb, Check
} from 'lucide-react';

// ─── Shared input styles ───────────────────────────────────────────────────
const iCls =
  'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none transition bg-white';
const lCls =
  'block text-[11px] font-bold text-gray-500 mb-1 uppercase tracking-wide';
const gridTwo = 'grid grid-cols-1 sm:grid-cols-2 gap-4';

// ─── Section wrapper ───────────────────────────────────────────────────────
const Section = ({ icon: Icon, title, color = 'blue', children }) => {
  const colors = {
    blue:   { bg: 'bg-blue-600',   light: 'bg-blue-50',   border: 'border-blue-100',   text: 'text-blue-700'   },
    purple: { bg: 'bg-purple-600', light: 'bg-purple-50', border: 'border-purple-100', text: 'text-purple-700' },
    green:  { bg: 'bg-green-600',  light: 'bg-green-50',  border: 'border-green-100',  text: 'text-green-700'  },
    orange: { bg: 'bg-orange-500', light: 'bg-orange-50', border: 'border-orange-100', text: 'text-orange-700' },
    teal:   { bg: 'bg-teal-600',   light: 'bg-teal-50',   border: 'border-teal-100',   text: 'text-teal-700'   },
  };
  const c = colors[color] || colors.blue;
  return (
    <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-gray-100 overflow-hidden">
      <div className={`flex items-center gap-3 px-5 py-4 border-b ${c.border} ${c.light}`}>
        <div className={`w-8 h-8 ${c.bg} rounded-xl flex items-center justify-center shadow-sm`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <h2 className={`font-bold text-sm ${c.text}`}>{title}</h2>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );
};

// ─── Tag chip ──────────────────────────────────────────────────────────────
const Tag = ({ label, onRemove }) => (
  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
    {label}
    {onRemove && (
      <button type="button" onClick={onRemove}
        className="ml-0.5 hover:text-red-500 transition text-blue-400">×</button>
    )}
  </span>
);

// ─── Tag input ─────────────────────────────────────────────────────────────
const TagInput = ({ label, tags = [], onAdd, onRemove, placeholder }) => {
  const [val, setVal] = useState('');
  const add = () => {
    if (val.trim()) { onAdd(val.trim()); setVal(''); }
  };
  return (
    <div>
      <label className={lCls}>{label}</label>
      <div className="flex gap-2 mb-2">
        <input
          className={iCls + ' flex-1'}
          value={val}
          onChange={e => setVal(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          placeholder={placeholder || 'Type and press Enter'}
        />
        <button type="button" onClick={add}
          className="px-3 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition text-lg leading-none font-bold">
          +
        </button>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((t, i) => <Tag key={i} label={t} onRemove={() => onRemove(i)} />)}
        </div>
      )}
    </div>
  );
};

// ─── Skill multi-select — static options, no API ──────────────────────────
const SKILL_OPTIONS = [
  'JavaScript', 'TypeScript', 'React', 'Next.js', 'Node.js', 'Express',
  'Python', 'Django', 'Flask', 'Java', 'Spring Boot', 'C++', 'C#', '.NET',
  'PHP', 'Laravel', 'Ruby', 'Rails', 'Go', 'Rust', 'Swift', 'Kotlin',
  'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Firebase', 'Supabase',
  'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Git', 'Linux',
  'HTML', 'CSS', 'Tailwind CSS', 'Bootstrap', 'GraphQL', 'REST API',
  'Machine Learning', 'Data Science', 'TensorFlow', 'PyTorch',
  'Figma', 'Adobe XD', 'UI/UX Design',
].map(s => ({ value: s, label: s }));

const SkillSelect = ({ label, values = [], onChange }) => (
  <div>
    <label className={lCls}>{label}</label>
    <Select
      isMulti
      isSearchable
      closeMenuOnSelect={false}
      options={SKILL_OPTIONS}
      placeholder="Search and select..."
      value={values.map(s => ({ value: s, label: s }))}
      menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
      menuPosition="fixed"
      styles={{
        menuPortal: base => ({ ...base, zIndex: 9999 }),
        menu: base => ({ ...base, zIndex: 9999 }),
        control: (base, state) => ({
          ...base,
          minHeight: 44,
          borderRadius: 12,
          borderColor: state.isFocused ? '#3b82f6' : '#e5e7eb',
          boxShadow: state.isFocused ? '0 0 0 2px rgba(191,219,254,1)' : 'none',
          '&:hover': { borderColor: state.isFocused ? '#3b82f6' : '#d1d5db' },
          fontSize: 13,
        }),
      }}
      onChange={selected => onChange(selected ? selected.map(i => i.value) : [])}
    />
  </div>
);

// ─── Avatar initials + progress ring ──────────────────────────────────────
const Avatar = ({ name, percent }) => {
  const initials = (() => {
    const parts = (name || 'U').split(' ');
    return parts.length >= 2
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : (name || 'U').substring(0, 2).toUpperCase();
  })();
  const r = 42, circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  return (
    <div className="relative w-24 h-24 shrink-0">
      <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} stroke="#e5e7eb" strokeWidth="5" fill="none" />
        <circle cx="50" cy="50" r={r} stroke="#2563eb" strokeWidth="5" fill="none"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          className="transition-all duration-700" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold text-gray-800">{initials}</span>
        <span className="text-[10px] font-bold text-blue-600">{percent}%</span>
      </div>
    </div>
  );
};

// ─── Local toast (no context needed) ──────────────────────────────────────
const Toast = ({ onClose }) => (
  <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-white border border-green-200 shadow-xl rounded-2xl px-5 py-3">
    <div className="w-8 h-8 bg-green-500 rounded-xl flex items-center justify-center shrink-0">
      <Check className="w-4 h-4 text-white" />
    </div>
    <div>
      <p className="text-sm font-bold text-gray-800">Profile Saved</p>
      <p className="text-xs text-gray-500">Your changes have been saved locally.</p>
    </div>
    <button onClick={onClose}
      className="ml-2 text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
  </div>
);

// ─── Main Component ────────────────────────────────────────────────────────
const CandidateEditProfile = () => {
  const navigate = useNavigate();

  const [showToast, setShowToast] = useState(false);
  const [activeSection, setActiveSection] = useState('personal');

  // ── Pure local form state — zero API calls ──────────────────────────────
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    mobileNumber: '',
    whatsappNumber: '',
    alternateMobileNumber: '',
    gender: '',
    dateOfBirth: '',
    city: '',
    state: '',
    country: '',
    pincode: '',
    highestQualification: '',
    specialization: '',
    collegeName: '',
    university: '',
    graduationYear: '',
    cgpaOrPercentage: '',
    tenthPercentage: '',
    twelfthOrDiplomaPercentage: '',
    currentStatus: '',
    candidateType: '',
    yearsOfExperience: '',
    previousOrganization: '',
    currentRole: '',
    primarySkills: [],
    secondarySkills: [],
    programmingLanguages: [],
    careerObjective: '',
    preferredJobRole: '',
    targetCompanies: [],
    courseInterestedIn: '',
    preferredLearningMode: '',
    availability: '',
    dailyStudyHours: '',
    expectedStartDate: '',
  });

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  // ── Live profile completion % ───────────────────────────────────────────
  const percent = (() => {
    const tracked = [
      form.fullName, form.email, form.mobileNumber, form.gender, form.dateOfBirth,
      form.city, form.state, form.country,
      form.highestQualification, form.specialization, form.collegeName,
      form.currentStatus, form.candidateType,
      form.primarySkills.length > 0 ? 'filled' : '',
      form.careerObjective, form.preferredJobRole,
      form.courseInterestedIn, form.preferredLearningMode,
    ];
    const filled = tracked.filter(f => f && f !== '').length;
    return Math.round((filled / tracked.length) * 100);
  })();

  // ── Save to localStorage — no API ──────────────────────────────────────
  const handleSave = () => {
    localStorage.setItem('candidateProfileDraft', JSON.stringify(form));
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3500);
  };

  const navSections = [
    { id: 'personal',     label: 'Personal',     icon: User          },
    { id: 'education',    label: 'Education',    icon: GraduationCap },
    { id: 'professional', label: 'Professional', icon: Briefcase      },
    { id: 'skills',       label: 'Skills',       icon: Code           },
    { id: 'career',       label: 'Career',       icon: Target         },
    { id: 'courses',      label: 'Courses',      icon: BookOpen       },
  ];

  const scrollTo = id => {
    setActiveSection(id);
    document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <CandidateLayout title="Edit Profile">
      <div className="max-w-5xl mx-auto px-4 pb-12 pt-6">

        {/* ── Top bar ── */}
        <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard/candidate/settings')}
              className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition text-gray-500 hover:text-gray-800"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Edit Profile</h1>
              <p className="text-xs text-gray-500">Update your candidate information</p>
            </div>
          </div>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-sm font-bold rounded-xl hover:opacity-90 transition shadow-lg shadow-blue-500/20"
          >
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </div>

        {/* ── Hero banner ── */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 rounded-2xl p-5 text-white shadow-xl shadow-blue-500/20 mb-6 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: 'linear-gradient(to right,rgba(255,255,255,.1) 1px,transparent 1px),linear-gradient(to bottom,rgba(255,255,255,.1) 1px,transparent 1px)', backgroundSize: '20px 20px' }} />
          <div className="relative z-10 flex items-center gap-4">
            <Avatar name={form.fullName || 'Candidate'} percent={percent} />
            <div>
              <p className="font-bold text-lg">{form.fullName || 'Your Name'}</p>
              <p className="text-blue-100 text-sm">{form.email || 'your@email.com'}</p>
              <div className="mt-2 flex items-center gap-2">
                <div className="h-1.5 w-32 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-white rounded-full transition-all duration-700"
                    style={{ width: `${percent}%` }} />
                </div>
                <span className="text-xs font-bold text-white/90">{percent}% complete</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Two-column layout ── */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">

          {/* Sidebar */}
          <div className="md:col-span-3">
            <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-gray-100 p-3 sticky top-4">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 mb-2">Sections</p>
              {navSections.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => scrollTo(id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all mb-0.5 ${
                    activeSection === id
                      ? 'bg-blue-50 text-blue-700 font-bold'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {label}
                  {activeSection === id && (
                    <div className="ml-auto w-1.5 h-1.5 bg-blue-500 rounded-full" />
                  )}
                </button>
              ))}
              <div className="mt-3 pt-3 border-t border-gray-100">
                <button
                  onClick={handleSave}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-sm font-bold rounded-xl hover:opacity-90 transition"
                >
                  <Check className="w-3.5 h-3.5" />
                  Save
                </button>
              </div>
            </div>
          </div>

          {/* Form sections */}
          <div className="md:col-span-9 space-y-5">

            {/* ── Personal ── */}
            <div id="section-personal">
              <Section icon={User} title="Personal Details" color="blue">
                <div className={gridTwo}>
                  <div>
                    <label className={lCls}>Full Name</label>
                    <input className={iCls} value={form.fullName}
                      onChange={e => set('fullName', e.target.value)} placeholder="Your full name" />
                  </div>
                  <div>
                    <label className={lCls}>Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input className={iCls + ' pl-9'} value={form.email}
                        onChange={e => set('email', e.target.value)} placeholder="your@email.com" />
                    </div>
                  </div>
                  <div>
                    <label className={lCls}>Mobile Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input className={iCls + ' pl-9'} value={form.mobileNumber}
                        onChange={e => set('mobileNumber', e.target.value)} placeholder="+91 XXXXX XXXXX" />
                    </div>
                  </div>
                  <div>
                    <label className={lCls}>WhatsApp Number</label>
                    <input className={iCls} value={form.whatsappNumber}
                      onChange={e => set('whatsappNumber', e.target.value)} placeholder="WhatsApp number" />
                  </div>
                  <div>
                    <label className={lCls}>Alternate Mobile</label>
                    <input className={iCls} value={form.alternateMobileNumber}
                      onChange={e => set('alternateMobileNumber', e.target.value)} placeholder="Alternate number" />
                  </div>
                  <div>
                    <label className={lCls}>Gender</label>
                    <select className={iCls} value={form.gender} onChange={e => set('gender', e.target.value)}>
                      <option value="">Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  </div>
                  <div>
                    <label className={lCls}>Date of Birth</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input type="date" className={iCls + ' pl-9'} value={form.dateOfBirth}
                        onChange={e => set('dateOfBirth', e.target.value)} />
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <MapPin className="w-3 h-3" /> Address
                  </p>
                  <div className={gridTwo}>
                    <div>
                      <label className={lCls}>City</label>
                      <input className={iCls} value={form.city}
                        onChange={e => set('city', e.target.value)} placeholder="City" />
                    </div>
                    <div>
                      <label className={lCls}>State</label>
                      <input className={iCls} value={form.state}
                        onChange={e => set('state', e.target.value)} placeholder="State" />
                    </div>
                    <div>
                      <label className={lCls}>Country</label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input className={iCls + ' pl-9'} value={form.country}
                          onChange={e => set('country', e.target.value)} placeholder="Country" />
                      </div>
                    </div>
                    <div>
                      <label className={lCls}>Pincode</label>
                      <div className="relative">
                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input className={iCls + ' pl-9'} value={form.pincode}
                          onChange={e => set('pincode', e.target.value)} placeholder="Pincode" />
                      </div>
                    </div>
                  </div>
                </div>
              </Section>
            </div>

            {/* ── Education ── */}
            <div id="section-education">
              <Section icon={GraduationCap} title="Educational Details" color="purple">
                <div className={gridTwo}>
                  <div>
                    <label className={lCls}>Highest Qualification</label>
                    <select className={iCls} value={form.highestQualification}
                      onChange={e => set('highestQualification', e.target.value)}>
                      <option value="">Select qualification</option>
                      <option value="High School (10th)">High School (10th)</option>
                      <option value="Intermediate (12th)">Intermediate (12th)</option>
                      <option value="Diploma">Diploma</option>
                      <option value="Bachelor's Degree">Bachelor's Degree</option>
                      <option value="Master's Degree">Master's Degree</option>
                      <option value="PhD">PhD</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className={lCls}>Specialization</label>
                    <input className={iCls} value={form.specialization}
                      onChange={e => set('specialization', e.target.value)}
                      placeholder="e.g. Computer Science" />
                  </div>
                  <div>
                    <label className={lCls}>College / Institution</label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input className={iCls + ' pl-9'} value={form.collegeName}
                        onChange={e => set('collegeName', e.target.value)} placeholder="College name" />
                    </div>
                  </div>
                  <div>
                    <label className={lCls}>University</label>
                    <input className={iCls} value={form.university}
                      onChange={e => set('university', e.target.value)} placeholder="University name" />
                  </div>
                  <div>
                    <label className={lCls}>Graduation Year</label>
                    <input type="number" className={iCls} value={form.graduationYear}
                      onChange={e => set('graduationYear', e.target.value)}
                      placeholder="e.g. 2024" min="1990" max="2030" />
                  </div>
                  <div>
                    <label className={lCls}>CGPA / Percentage</label>
                    <input className={iCls} value={form.cgpaOrPercentage}
                      onChange={e => set('cgpaOrPercentage', e.target.value)}
                      placeholder="e.g. 8.5 or 85%" />
                  </div>
                  <div>
                    <label className={lCls}>10th Percentage</label>
                    <input className={iCls} value={form.tenthPercentage}
                      onChange={e => set('tenthPercentage', e.target.value)} placeholder="e.g. 90%" />
                  </div>
                  <div>
                    <label className={lCls}>12th / Diploma %</label>
                    <input className={iCls} value={form.twelfthOrDiplomaPercentage}
                      onChange={e => set('twelfthOrDiplomaPercentage', e.target.value)} placeholder="e.g. 88%" />
                  </div>
                </div>
              </Section>
            </div>

            {/* ── Professional ── */}
            <div id="section-professional">
              <Section icon={Briefcase} title="Professional Details" color="green">
                <div className={gridTwo}>
                  <div>
                    <label className={lCls}>Current Status</label>
                    <select className={iCls} value={form.currentStatus}
                      onChange={e => set('currentStatus', e.target.value)}>
                      <option value="">Select status</option>
                      <option value="Student">Student</option>
                      <option value="Graduate">Graduate</option>
                      <option value="Working Professional">Working Professional</option>
                    </select>
                  </div>
                  <div>
                    <label className={lCls}>Candidate Type</label>
                    <select className={iCls} value={form.candidateType}
                      onChange={e => set('candidateType', e.target.value)}>
                      <option value="">Select type</option>
                      <option value="FRESHER">Fresher</option>
                      <option value="EXPERIENCED">Experienced</option>
                    </select>
                  </div>
                  <div>
                    <label className={lCls}>Years of Experience</label>
                    <input type="number" className={iCls} value={form.yearsOfExperience}
                      onChange={e => set('yearsOfExperience', e.target.value)}
                      placeholder="0" min="0" max="40" step="0.5" />
                  </div>
                  <div>
                    <label className={lCls}>Current Role</label>
                    <input className={iCls} value={form.currentRole}
                      onChange={e => set('currentRole', e.target.value)} placeholder="e.g. Software Engineer" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={lCls}>Previous Organisation</label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input className={iCls + ' pl-9'} value={form.previousOrganization}
                        onChange={e => set('previousOrganization', e.target.value)}
                        placeholder="Previous company name" />
                    </div>
                  </div>
                </div>
              </Section>
            </div>

            {/* ── Skills ── */}
            <div id="section-skills">
              <Section icon={Code} title="Skills" color="teal">
                <SkillSelect
                  label="Primary Skills"
                  values={form.primarySkills}
                  onChange={v => set('primarySkills', v)}
                />
                <SkillSelect
                  label="Secondary Skills"
                  values={form.secondarySkills}
                  onChange={v => set('secondarySkills', v)}
                />
                <TagInput
                  label="Programming Languages"
                  tags={form.programmingLanguages}
                  onAdd={v => set('programmingLanguages', [...form.programmingLanguages, v])}
                  onRemove={i => set('programmingLanguages', form.programmingLanguages.filter((_, idx) => idx !== i))}
                  placeholder="e.g. Python, Java…"
                />
              </Section>
            </div>

            {/* ── Career Goals ── */}
            <div id="section-career">
              <Section icon={Target} title="Career Goals" color="orange">
                <div>
                  <label className={lCls}>Career Objective</label>
                  <textarea
                    className={iCls + ' resize-none'}
                    rows={3}
                    value={form.careerObjective}
                    onChange={e => set('careerObjective', e.target.value)}
                    placeholder="Brief description of your career goals..."
                  />
                </div>
                <div>
                  <label className={lCls}>Preferred Job Role</label>
                  <div className="relative">
                    <Lightbulb className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input className={iCls + ' pl-9'} value={form.preferredJobRole}
                      onChange={e => set('preferredJobRole', e.target.value)}
                      placeholder="e.g. Full Stack Developer" />
                  </div>
                </div>
                <TagInput
                  label="Target Companies"
                  tags={form.targetCompanies}
                  onAdd={v => set('targetCompanies', [...form.targetCompanies, v])}
                  onRemove={i => set('targetCompanies', form.targetCompanies.filter((_, idx) => idx !== i))}
                  placeholder="e.g. Google, Amazon…"
                />
              </Section>
            </div>

            {/* ── Course Preferences ── */}
            <div id="section-courses">
              <Section icon={BookOpen} title="Course Preferences" color="purple">
                <div className={gridTwo}>
                  <div>
                    <label className={lCls}>Course Interested In</label>
                    <div className="relative">
                      <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input className={iCls + ' pl-9'} value={form.courseInterestedIn}
                        onChange={e => set('courseInterestedIn', e.target.value)}
                        placeholder="e.g. Full Stack Development" />
                    </div>
                  </div>
                  <div>
                    <label className={lCls}>Preferred Learning Mode</label>
                    <select className={iCls} value={form.preferredLearningMode}
                      onChange={e => set('preferredLearningMode', e.target.value)}>
                      <option value="">Select mode</option>
                      <option value="Online">Online</option>
                      <option value="Offline">Offline</option>
                      <option value="Hybrid">Hybrid</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className={lCls}>Availability</label>
                    <select className={iCls} value={form.availability}
                      onChange={e => set('availability', e.target.value)}>
                      <option value="">Select availability</option>
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Weekends Only">Weekends Only</option>
                      <option value="Flexible">Flexible</option>
                    </select>
                  </div>
                  <div>
                    <label className={lCls}>Expected Start Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input type="date" className={iCls + ' pl-9'} value={form.expectedStartDate}
                        onChange={e => set('expectedStartDate', e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className={lCls}>Daily Study Hours</label>
                    <select className={iCls} value={form.dailyStudyHours}
                      onChange={e => set('dailyStudyHours', e.target.value)}>
                      <option value="">Select hours</option>
                      <option value="1-2 hours">1-2 hours</option>
                      <option value="2-4 hours">2-4 hours</option>
                      <option value="4-6 hours">4-6 hours</option>
                      <option value="6+ hours">6+ hours</option>
                    </select>
                  </div>
                </div>
              </Section>
            </div>

            {/* ── Bottom actions ── */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => navigate('/dashboard/candidate/settings')}
                className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition"
              >
                <ChevronLeft className="w-4 h-4" /> Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-sm font-bold rounded-xl hover:opacity-90 transition shadow-lg shadow-blue-500/20"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* ── Toast notification ── */}
      {showToast && <Toast onClose={() => setShowToast(false)} />}

    </CandidateLayout>
  );
};

export default CandidateEditProfile;