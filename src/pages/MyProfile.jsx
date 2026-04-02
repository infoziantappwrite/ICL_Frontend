// src/pages/MyProfile.jsx — Full Naukri-style profile with all fields + inline editing
import { useState, useEffect, useRef } from 'react';
import Select from 'react-select';
import { useProfile } from '../context/Profilecontext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import StudentLayout from '../components/layout/StudentLayout';
import { skillAPI, tokenStore } from '../api/Api';
import {
  Pencil, X, Check, MapPin, Phone, Mail,
  Briefcase, GraduationCap, Target,
  Upload, Download, Plus, Loader2,
  CheckCircle, Clock, Code, BookOpen, FileText,
  ChevronDown, Trash2
} from 'lucide-react';

// ─── Card ──────────────────────────────────────────────────────────────────
const Card = ({ children, id, className = '' }) => (
  <div id={id} className={`bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-gray-100 p-3 md:p-6 ${className}`}>
    {children}
  </div>
);

// ─── Skill tag ─────────────────────────────────────────────────────────────
const SkillTag = ({ label, color = 'blue', onRemove }) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    purple: 'bg-purple-50 text-purple-700 border-purple-100',
    green: 'bg-green-50 text-green-700 border-green-100',
    orange: 'bg-orange-50 text-orange-700 border-orange-100',
    gray: 'bg-gray-50 text-gray-700 border-gray-200',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold border ${colors[color] || colors.blue}`}>
      {label}
      {onRemove && (
        <button type="button" onClick={onRemove} className="ml-0.5 hover:text-red-500 transition">
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  );
};

// ─── Pencil button ─────────────────────────────────────────────────────────
const EditBtn = ({ onClick }) => (
  <button type="button" onClick={onClick}
    className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all" title="Edit">
    <Pencil className="w-4 h-4" />
  </button>
);

// ─── Save/Cancel row ───────────────────────────────────────────────────────
const ActionRow = ({ onSave, onCancel, saving }) => (
  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
    <button type="button" onClick={onSave} disabled={saving}
      className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-[13px] font-bold rounded-lg hover:bg-blue-700 transition disabled:opacity-60">
      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
      {saving ? 'Uploading…' : 'Save'}
    </button>
    <button type="button" onClick={onCancel} disabled={saving}
      className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 text-gray-600 text-[13px] font-bold rounded-lg hover:bg-gray-50 transition">
      <X className="w-4 h-4" /> Cancel
    </button>
  </div>
);

// ─── Shared styles ─────────────────────────────────────────────────────────
const iCls = 'w-full px-3 py-2 border border-gray-200 rounded-xl text-[13px] focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none transition bg-white';
const lCls = 'block text-[12px] font-bold text-gray-500 mb-1 uppercase tracking-wide';
const gridTwo = 'grid grid-cols-1 sm:grid-cols-2 gap-4';
const spanTwo = 'sm:col-span-2';

// ─── Circular progress avatar ──────────────────────────────────────────────
const AvatarProgress = ({ initials, percent }) => {
  const r = 54, circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  return (
    <div className="relative w-32 h-32 flex-shrink-0">
      <svg className="w-32 h-32 -rotate-90" viewBox="0 0 128 128">
        <circle cx="64" cy="64" r={r} stroke="#e5e7eb" strokeWidth="6" fill="none" />
        <circle cx="64" cy="64" r={r} stroke="#2563eb" strokeWidth="6" fill="none"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          className="transition-all duration-700" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[22px] font-bold text-gray-800">{initials}</span>
        <span className="text-[11px] font-bold text-blue-600">{percent}%</span>
      </div>
    </div>
  );
};

// ─── InfoPair ──────────────────────────────────────────────────────────────
const InfoPair = ({ label, value }) => (
  <div>
    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">{label}</p>
    <p className="text-[14px] text-gray-800 font-medium mt-0.5">{value || <span className="text-gray-400">—</span>}</p>
  </div>
);

// ─── Tag input helper ──────────────────────────────────────────────────────
const TagInput = ({ label, field, tags, color = 'blue', onAdd, onRemove }) => {
  const [val, setVal] = useState('');
  const add = () => { if (val.trim()) { onAdd(field, val.trim()); setVal(''); } };
  return (
    <div>
      <label className={lCls}>{label}</label>
      <div className="flex gap-2 mb-2">
        <input className={iCls + ' flex-1'} value={val}
          onChange={e => setVal(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          placeholder="Type and press Enter or +" />
        <button type="button" onClick={add} className="px-3 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition">
          <Plus className="w-4 h-4" />
        </button>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((s, i) => <SkillTag key={i} label={s} color={color} onRemove={() => onRemove(field, i)} />)}
        </div>
      )}
    </div>
  );
};

const getSkillName = (skill) => {
  if (typeof skill === 'string') return skill.trim();
  if (skill && typeof skill === 'object') return (skill.name || skill.label || skill.value || '').trim();
  return '';
};

const getSkillCategory = (skill) => {
  if (skill && typeof skill === 'object') return (skill.category || '').trim().toLowerCase();
  return '';
};

const SkillMultiSelect = ({ label, values, options, onChange, allowedCategories, excludedCategories = [], blockedValues = [] }) => {
  const normalizedValues = values.map(getSkillName).filter(Boolean);
  const normalizedAllowedCategories = (allowedCategories || []).map((category) => category.trim().toLowerCase());
  const normalizedExcludedCategories = excludedCategories.map((category) => category.trim().toLowerCase());
  const normalizedBlockedValues = blockedValues.map((value) => value.trim().toLowerCase());

  const filteredOptions = options.filter((option) => {
    const category = getSkillCategory(option);
    const skillName = getSkillName(option).toLowerCase();

    if (normalizedBlockedValues.includes(skillName)) return false;

    if (normalizedAllowedCategories.length > 0) {
      return normalizedAllowedCategories.includes(category);
    }

    return !normalizedExcludedCategories.includes(category);
  });

  const mergedOptions = [...new Set([
    ...filteredOptions.map(getSkillName),
    ...normalizedValues,
  ])]
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b))
    .map((skillName) => ({ value: skillName, label: skillName }));

  return (
    <div>
      <label className={lCls}>{label}</label>
      <Select
        isMulti
        isSearchable
        closeMenuOnSelect
        options={mergedOptions}
        placeholder="Search and select skills..."
        value={normalizedValues.map((skillName) => ({ value: skillName, label: skillName }))}
        menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
        menuPosition="fixed"
        styles={{
          menuPortal: (base) => ({ ...base, zIndex: 9999 }),
          menu: (base) => ({ ...base, zIndex: 9999 }),
          control: (base, state) => ({
            ...base,
            minHeight: 44,
            borderRadius: 12,
            borderColor: state.isFocused ? '#3b82f6' : '#e5e7eb',
            boxShadow: state.isFocused ? '0 0 0 2px rgba(191, 219, 254, 1)' : 'none',
            '&:hover': { borderColor: state.isFocused ? '#3b82f6' : '#d1d5db' },
          }),
        }}
        onChange={(selected) => onChange(selected ? selected.map((item) => item.value) : [])}
      />
    </div>
  );
};

// ─── Skeleton shimmer block ────────────────────────────────────────────────
const Sk = ({ className = '' }) => (
  <div className={`bg-gray-200 rounded-xl animate-pulse ${className}`} />
);

// ─── Full-page skeleton mirroring the profile layout ─────────────────────────
const ProfileSkeleton = () => (
  <div className="min-h-screen bg-[#f8f9fa] px-4 md:px-6 lg:px-8 py-6">
    <div className="max-w-[1240px] mx-auto space-y-5">
      {/* Hero card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.06)] p-6">
        <div className="flex flex-col sm:flex-row gap-5">
          <Sk className="w-32 h-32 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-3 pt-1">
            <Sk className="h-6 w-40" />
            <Sk className="h-4 w-56" />
            <div className="grid grid-cols-2 gap-3 mt-4">
              <Sk className="h-4 w-32" />
              <Sk className="h-4 w-40" />
              <Sk className="h-4 w-28" />
              <Sk className="h-4 w-36" />
            </div>
          </div>
        </div>
      </div>

      {/* Two-column */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Sidebar */}
        <div className="md:col-span-3">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.06)] p-5 space-y-3">
            <Sk className="h-5 w-28 mb-2" />
            {[...Array(7)].map((_, i) => <Sk key={i} className="h-9 w-full rounded-lg" />)}
          </div>
        </div>

        {/* Sections */}
        <div className="md:col-span-9 space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.06)] p-6 space-y-3">
              <Sk className="h-5 w-36" />
              <Sk className="h-4 w-full" />
              <Sk className="h-4 w-3/4" />
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// ─── CDN Chunked Upload Helper ─────────────────────────────────────────────
// Splits file into chunks, uploads each to /api/upload/upload-file,
// then calls /api/upload/merge. Returns the Cloudinary URL.
const CHUNK_SIZE = 2 * 1024 * 1024; // 2 MB per chunk
const BASE_URL = import.meta.env.VITE_API_URL || '';

const uploadFileInChunks = async (file, fileType, onProgress) => {
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
  const fileId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  // Upload each chunk
  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, file.size);
    const chunk = file.slice(start, end);

    const fd = new FormData();
    fd.append('chunk', chunk, file.name);
    fd.append('fileId', fileId);
    fd.append('chunkIndex', String(i));
    fd.append('totalChunks', String(totalChunks));

    const token = tokenStore.get();
    const res = await fetch(`${BASE_URL}/upload/upload-file`, {
      method: 'POST',
      credentials: 'include',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: fd,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Chunk ${i} upload failed`);
    }

    if (onProgress) onProgress(Math.round(((i + 1) / totalChunks) * 80));
  }

  // Merge chunks on the backend → Cloudinary upload
  const mergeToken = tokenStore.get();
  const mergeRes = await fetch(`${BASE_URL}/upload/merge`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(mergeToken ? { 'Authorization': `Bearer ${mergeToken}` } : {}),
    },
    body: JSON.stringify({ fileId, totalChunks, fileType, fileName: file.name }),
  });

  if (!mergeRes.ok) {
    const err = await mergeRes.json().catch(() => ({}));
    throw new Error(err.message || 'Merge failed');
  }

  const data = await mergeRes.json();
  if (onProgress) onProgress(100);

  // Return the Cloudinary URL + filename from merge response
  return {
    url: data.url || data.fileUrl || data.data?.url,
    filename: file.name,
    fileId: data.fileId || data.data?.fileId,
  };
};

// ─── Upload progress bar ───────────────────────────────────────────────────
const UploadProgress = ({ progress, label }) => (
  <div className="mt-2">
    <div className="flex justify-between text-[11px] text-gray-500 mb-1">
      <span>{label}</span>
      <span>{progress}%</span>
    </div>
    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
      <div
        className="h-full bg-blue-500 rounded-full transition-all duration-300"
        style={{ width: `${progress}%` }}
      />
    </div>
  </div>
);

// ─── Download URL Formatter ────────────────────────────────────────────────
const getDownloadUrl = (url, originalFileName) => {
  if (!url || !url.includes('/upload/')) return url;
  let safeName = 'download';
  if (originalFileName) {
    safeName = originalFileName.substring(0, originalFileName.lastIndexOf('.')) || originalFileName;
    safeName = encodeURIComponent(safeName.replace(/[^a-zA-Z0-9_-]/g, '_'));
  }
  return url.replace('/upload/', `/upload/fl_attachment:${safeName}/`);
};

// ─── Document Viewer Helper ────────────────────────────────────────────────
const viewPdf = (url) => {
  if (!url) return;
  if (url.toLowerCase().endsWith('.pdf')) {
    const streamUrl = `${BASE_URL}/upload/stream-pdf?fileUrl=${encodeURIComponent(url)}`;
    window.open(streamUrl, '_blank');
  } else {
    window.open(url, '_blank');
  }
};

// ─── Main Component ────────────────────────────────────────────────────────
const MyProfile = () => {
  const { user } = useAuth();
  const { profile, updateProfile, fetchProfile, isLoading } = useProfile();
  const toast = useToast();
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [resumeFile, setResumeFile] = useState(null);
  const [idProofFile, setIdProofFile] = useState(null);

  // Upload progress states
  const [resumeProgress, setResumeProgress] = useState(0);
  const [idProofProgress, setIdProofProgress] = useState(0);
  const [resumeUploading, setResumeUploading] = useState(false);
  const [idProofUploading, setIdProofUploading] = useState(false);

  // ── Draft states per section ──
  const [draftHeader, setDraftHeader] = useState({});
  const [draftPersonal, setDraftPersonal] = useState({});
  const [draftEducation, setDraftEducation] = useState({});
  const [draftProfessional, setDraftProfessional] = useState({});
  const [draftSkills, setDraftSkills] = useState({ primary: [], secondary: [], langs: [] });
  const [draftCourses, setDraftCourses] = useState({});
  const [draftCareer, setDraftCareer] = useState({ careerObjective: '', preferredJobRole: '', targetCompanies: [] });
  const [newCompany, setNewCompany] = useState('');
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [skillsCatalog, setSkillsCatalog] = useState([]);

  // Sync all drafts when profile loads
  useEffect(() => {
    if (!profile) return;
    setDraftHeader({
      fullName: profile.fullName || user?.fullName || '',
      currentRole: profile.currentRole || '',
      city: profile.address?.city || '',
      state: profile.address?.state || '',
    });
    setDraftPersonal({
      fullName: profile.fullName || user?.fullName || '',
      email: profile.email || user?.email || '',
      mobileNumber: profile.mobileNumber || '',
      whatsappNumber: profile.whatsappNumber || '',
      alternateMobileNumber: profile.alternateMobileNumber || '',
      gender: profile.gender || '',
      dateOfBirth: profile.dateOfBirth ? new Date(profile.dateOfBirth).toISOString().split('T')[0] : '',
      city: profile.address?.city || '',
      state: profile.address?.state || '',
      country: profile.address?.country || '',
      pincode: profile.address?.pincode || '',
    });
    setDraftEducation({
      highestQualification: profile.highestQualification || '',
      specialization: profile.specialization || '',
      collegeName: profile.collegeName || '',
      university: profile.university || '',
      graduationYear: profile.graduationYear || '',
      cgpaOrPercentage: profile.cgpaOrPercentage || '',
      tenthPercentage: profile.tenthPercentage || '',
      twelfthOrDiplomaPercentage: profile.twelfthOrDiplomaPercentage || '',
    });
    setDraftProfessional({
      currentStatus: profile.currentStatus || '',
      candidateType: profile.candidateType || '',
      yearsOfExperience: profile.yearsOfExperience || 0,
      previousOrganization: profile.previousOrganization || '',
      currentRole: profile.currentRole || '',
    });
    setDraftSkills({
      primary: [...(profile.primarySkills || [])],
      secondary: [...(profile.secondarySkills || [])],
      langs: [...(profile.programmingLanguages || [])],
    });
    setDraftCourses({
      courseInterestedIn: profile.courseInterestedIn || '',
      preferredLearningMode: profile.preferredLearningMode || '',
      availability: profile.availability || '',
      expectedStartDate: profile.expectedStartDate ? new Date(profile.expectedStartDate).toISOString().split('T')[0] : '',
      dailyStudyHours: profile.dailyStudyHours || '',
    });
    setDraftCareer({
      careerObjective: profile.careerObjective || '',
      preferredJobRole: profile.preferredJobRole || '',
      targetCompanies: Array.isArray(profile.targetCompanies) ? [...profile.targetCompanies] : [],
    });
  }, [profile, user]);

  useEffect(() => {
    const fetchSkillsCatalog = async () => {
      try {
        const response = await skillAPI.getAllSkills();
        if (response?.success) setSkillsCatalog(response.skills || []);
      } catch (error) {
        console.error('Error fetching skills catalog:', error);
      }
    };

    fetchSkillsCatalog();
  }, []);

  const getName = () => profile?.fullName || user?.fullName || user?.name || 'User';
  const getInitials = () => {
    const n = getName().split(' ');
    return n.length >= 2 ? `${n[0][0]}${n[n.length - 1][0]}`.toUpperCase() : getName().substring(0, 2).toUpperCase();
  };
  const percent = profile?.profileCompletionPercentage || 0;

  const openEdit = s => setEditing(s);
  const closeEdit = () => {
    setEditing(null);
    setResumeFile(null);
    setIdProofFile(null);
    setResumeProgress(0);
    setIdProofProgress(0);
  };

  // ── Generic save for non-file sections ──
  const saveSection = async (data) => {
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('profileData', JSON.stringify(data));
      const res = await updateProfile(fd);
      if (res?.success) {
        toast.success('Saved!', 'Section updated.');
        await fetchProfile();
        closeEdit();
      } else toast.error('Error', res?.message || 'Failed to save.');
    } catch (e) { toast.error('Error', e.message || 'Failed to save.'); }
    finally { setSaving(false); }
  };

  // ── Remote CDN Document Deletion ──
  const deleteDocument = async (fileType, fileId) => {
    if (!fileId) return;
    if (!window.confirm("Are you sure you want to delete this document?")) return;
    setSaving(true);
    try {
      const token = tokenStore.get();
      const res = await fetch(`${BASE_URL}/upload/file`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ fileType, fileId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to delete Document.');
      toast.success('Deleted', 'Document deleted successfully.');
      await fetchProfile();
    } catch (e) {
      toast.error('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  // ── CDN chunked upload for documents ──
  // mergeChunksController already saves the Cloudinary URL to MongoDB via
  // updateCanditateDocumentData — so we just refresh the profile after upload.
  // No second updateProfile call needed.
  const saveDocuments = async () => {
    if (!resumeFile && !idProofFile) {
      toast.error('No file selected', 'Please choose a file to upload.');
      return;
    }

    setSaving(true);

    try {
      // Upload resume via chunked CDN flow
      if (resumeFile) {
        setResumeUploading(true);
        try {
          await uploadFileInChunks(resumeFile, 'resume', setResumeProgress);
        } finally {
          setResumeUploading(false);
        }
      }

      // Upload ID proof via chunked CDN flow
      if (idProofFile) {
        setIdProofUploading(true);
        try {
          await uploadFileInChunks(idProofFile, 'id_proof', setIdProofProgress);
        } finally {
          setIdProofUploading(false);
        }
      }

      // Backend already saved URL to DB — just refresh the profile
      toast.success('Uploaded!', 'Documents saved successfully.');
      await fetchProfile();
      closeEdit();
    } catch (e) {
      toast.error('Upload failed', e.message || 'Something went wrong during upload.');
    } finally {
      setSaving(false);
    }
  };

  const saveHeader = () => saveSection({
    fullName: draftHeader.fullName, currentRole: draftHeader.currentRole,
    address: { city: draftHeader.city, state: draftHeader.state, country: profile?.address?.country || '' }
  });
  const savePersonal = () => saveSection({
    fullName: draftPersonal.fullName,
    mobileNumber: draftPersonal.mobileNumber,
    whatsappNumber: draftPersonal.whatsappNumber,
    alternateMobileNumber: draftPersonal.alternateMobileNumber,
    gender: draftPersonal.gender,
    dateOfBirth: draftPersonal.dateOfBirth || undefined,
    address: { city: draftPersonal.city, state: draftPersonal.state, country: draftPersonal.country, pincode: draftPersonal.pincode }
  });
  const saveEducation = () => saveSection({
    highestQualification: draftEducation.highestQualification,
    specialization: draftEducation.specialization,
    collegeName: draftEducation.collegeName,
    university: draftEducation.university,
    graduationYear: draftEducation.graduationYear ? parseInt(draftEducation.graduationYear) : undefined,
    cgpaOrPercentage: draftEducation.cgpaOrPercentage,
    tenthPercentage: draftEducation.tenthPercentage,
    twelfthOrDiplomaPercentage: draftEducation.twelfthOrDiplomaPercentage,
  });
  const saveProfessional = () => saveSection({
    currentStatus: draftProfessional.currentStatus,
    candidateType: draftProfessional.candidateType,
    yearsOfExperience: parseInt(draftProfessional.yearsOfExperience) || 0,
    previousOrganization: draftProfessional.previousOrganization,
    currentRole: draftProfessional.currentRole,
  });
  const saveSkills = () => saveSection({
    primarySkills: draftSkills.primary,
    secondarySkills: draftSkills.secondary,
    programmingLanguages: draftSkills.langs,
  });
  const saveCourses = () => saveSection({
    courseInterestedIn: draftCourses.courseInterestedIn,
    preferredLearningMode: draftCourses.preferredLearningMode,
    availability: draftCourses.availability,
    expectedStartDate: draftCourses.expectedStartDate || undefined,
    dailyStudyHours: draftCourses.dailyStudyHours,
  });
  const saveCareer = () => saveSection({
    careerObjective: draftCareer.careerObjective,
    preferredJobRole: draftCareer.preferredJobRole,
    targetCompanies: draftCareer.targetCompanies,
  });

  // ── Tag helpers ──
  const addTag = (field, val) => setDraftSkills(p => ({ ...p, [field]: [...p[field], val] }));
  const removeTag = (field, i) => setDraftSkills(p => ({ ...p, [field]: p[field].filter((_, idx) => idx !== i) }));
  const addCompany = () => {
    if (newCompany.trim()) { setDraftCareer(p => ({ ...p, targetCompanies: [...p.targetCompanies, newCompany.trim()] })); setNewCompany(''); }
  };
  const removeCompany = i => setDraftCareer(p => ({ ...p, targetCompanies: p.targetCompanies.filter((_, idx) => idx !== i) }));

  const resumeUrl = profile?.documents?.resume?.url || profile?.resumeUrl;
  const resumeFilename = profile?.documents?.resume?.filename || 'Resume.pdf';
  const resumeUploadedAt = profile?.documents?.resume?.uploadedAt;
  const idProofUrl = profile?.documents?.idProof?.url || profile?.idProofUrl;
  const resumeFileId = profile?.documents?.resume?.fileId || profile?.documents?.resume?.filename;
  const idProofFileId = profile?.documents?.idProof?.fileId || profile?.documents?.idProof?.filename;

  // Quick links
  const quickLinks = [
    { id: 'sec-resume', label: 'Resume', badge: !resumeUrl ? 'Update' : null, bc: 'text-blue-600' },
    { id: 'sec-headline', label: 'Resume headline', badge: !profile?.currentRole ? 'Add' : null, bc: 'text-green-600' },
    { id: 'sec-skills', label: 'Key skills', badge: !profile?.primarySkills?.length ? 'Add' : null, bc: 'text-green-600' },
    { id: 'sec-education', label: 'Education', badge: !profile?.collegeName ? 'Add' : null, bc: 'text-green-600' },
    { id: 'sec-professional', label: 'Professional details', badge: !profile?.currentStatus ? 'Add' : null, bc: 'text-green-600' },
    { id: 'sec-courses', label: 'Course preferences', badge: !profile?.preferredLearningMode ? 'Add' : null, bc: 'text-green-600' },
    { id: 'sec-career', label: 'Career goals', badge: !profile?.careerObjective ? 'Add' : null, bc: 'text-green-600' },
    { id: 'sec-personal', label: 'Personal details', badge: null, bc: '' },
    { id: 'sec-documents', label: 'Documents', badge: null, bc: '' },
  ];
  const scrollTo = id => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  if (isLoading && !profile) {
    return (
      <StudentLayout title="My Profile">
        <ProfileSkeleton />
      </StudentLayout>
    );
  }

  return (
    <StudentLayout title="My Profile">
      <div className="min-h-screen bg-[#f8f9fa] px-4 md:px-6 lg:px-8 py-6">
        <div className="max-w-[1240px] mx-auto space-y-5">

          {/* ══ HERO CARD — full width ══ */}
          <Card className="p-3 md:p-6 overflow-hidden">
            {/* 📱 MOBILE HERO LAYOUT (Screenshot Style) */}
            <div className="block sm:hidden">
              <div className="flex items-start gap-4">
                <div className="relative flex-shrink-0">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 border-2 border-white shadow-md flex items-center justify-center">
                    {profile?.avatarUrl ? (
                      <img src={profile.avatarUrl} alt={getName()} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span className="text-[22px] font-bold text-blue-700">{getInitials()}</span>
                    )}
                  </div>
                  <button type="button" onClick={() => openEdit('header')}
                    className="absolute bottom-0 right-0 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm">
                    <Pencil className="w-3 h-3 text-gray-500" />
                  </button>
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <h1 className="text-[16px] md:text-[20px] font-bold text-gray-900 leading-tight">{getName()}</h1>
                  {(profile?.highestQualification || profile?.specialization) && (
                    <p className="text-[12px] md:text-[14px] text-gray-600 mt-0.5">
                      {[profile.highestQualification, profile.specialization].filter(Boolean).join(' — ')}
                    </p>
                  )}
                  {profile?.collegeName && (
                    <p className="text-[11px] md:text-[13px] text-gray-500 mt-0.5">{profile.collegeName}</p>
                  )}
                </div>
              </div>

              {/* Progress bar (Mobile) */}
              <div className="mt-4">
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${percent}%`, background: percent === 100 ? '#16a34a' : '#3b82f6' }}
                    />
                  </div>
                  <span className={`text-[13px] font-bold flex-shrink-0 ${percent === 100 ? 'text-green-600' : 'text-blue-600'}`}>{percent}%</span>
                </div>
                {profile?.updatedAt && (
                  <p className="text-[11px] text-gray-400 mt-1">Last updated {new Date(profile.updatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                )}
              </div>
            </div>

            {/* 💻 TABLET/DESKTOP HERO LAYOUT (Original Style) */}
            <div className="hidden sm:block">
              <div className="flex flex-col sm:flex-row gap-5">
                <AvatarProgress initials={getInitials()} percent={percent} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h1 className="text-[22px] font-bold text-gray-900 leading-tight">{getName()}</h1>
                        <EditBtn onClick={() => openEdit('header')} />
                      </div>
                      {profile?.currentRole && <p className="text-[14px] font-semibold text-gray-700 mt-0.5">{profile.currentRole}</p>}
                    </div>
                    {profile?.updatedAt && (
                      <div className="text-right shrink-0">
                        <p className="text-[12px] text-gray-400">Profile last updated · {new Date(profile.updatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-2 gap-x-6">
                    {profile?.address?.city && (
                      <div className="flex items-center gap-2 text-[13px] text-gray-600">
                        <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                        <span>{[profile.address.city, profile.address.state, profile.address.country].filter(Boolean).join(', ')}</span>
                      </div>
                    )}
                    {profile?.currentStatus && (
                      <div className="flex items-center gap-2 text-[13px] text-gray-600">
                        <Briefcase className="w-4 h-4 text-gray-400 shrink-0" />
                        <span>{profile.currentStatus}</span>
                      </div>
                    )}
                    {profile?.availability && (
                      <div className="flex items-center gap-2 text-[13px] text-gray-600">
                        <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                        <span>{profile.availability.replace(/_/g, ' ')}</span>
                      </div>
                    )}
                    {profile?.mobileNumber && (
                      <div className="flex items-center gap-2 text-[13px] text-gray-600">
                        <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                        <span>{profile.mobileNumber}</span>
                        <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                      </div>
                    )}
                    {(profile?.email || user?.email) && (
                      <div className="flex items-center gap-2 text-[13px] text-gray-600 min-w-0">
                        <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                        <span className="truncate">{profile?.email || user?.email}</span>
                        <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Common Info Row for Mobile (below the progress bar) */}
            <div className="sm:hidden mt-4 flex flex-wrap gap-x-5 gap-y-1.5 pt-3 border-t border-gray-50">
              {profile?.address?.city && (
                <div className="flex items-center gap-1.5 text-[12px] text-gray-600">
                  <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span>{profile.address.city}</span>
                </div>
              )}
              {profile?.currentStatus && (
                <div className="flex items-center gap-1.5 text-[12px] text-gray-600">
                  <Briefcase className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span>{profile.currentStatus}</span>
                </div>
              )}
              {profile?.mobileNumber && (
                <div className="flex items-center gap-1.5 text-[12px] text-gray-600">
                  <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span>{profile.mobileNumber}</span>
                  <CheckCircle className="w-3 h-3 text-green-500" />
                </div>
              )}
            </div>

            {/* Inline header edit form */}
            {editing === 'header' && (
              <div className="mt-5 pt-5 border-t border-gray-100">
                <div className={gridTwo}>
                  <div className={spanTwo}>
                    <label className={lCls}>Full Name</label>
                    <input className={iCls} value={draftHeader.fullName} onChange={e => setDraftHeader(p => ({ ...p, fullName: e.target.value }))} placeholder="Your full name" />
                  </div>
                  <div className={spanTwo}>
                    <label className={lCls}>Current Role / Designation</label>
                    <input className={iCls} value={draftHeader.currentRole} onChange={e => setDraftHeader(p => ({ ...p, currentRole: e.target.value }))} placeholder="e.g. Full Stack Developer" />
                  </div>
                  <div>
                    <label className={lCls}>City</label>
                    <input className={iCls} value={draftHeader.city} onChange={e => setDraftHeader(p => ({ ...p, city: e.target.value }))} placeholder="Coimbatore" />
                  </div>
                  <div>
                    <label className={lCls}>State</label>
                    <input className={iCls} value={draftHeader.state} onChange={e => setDraftHeader(p => ({ ...p, state: e.target.value }))} placeholder="Tamil Nadu" />
                  </div>
                </div>
                <ActionRow onSave={saveHeader} onCancel={closeEdit} saving={saving} />
              </div>
            )}
          </Card>

          {/* ══ TWO-COLUMN: Quick Links + Sections ══ */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">

            {/* ── LEFT: Quick Links (tablet/desktop only) ── */}
            <div className="hidden sm:block md:col-span-3 md:sticky md:top-[15px] self-start">
              <Card className="p-0 md:p-5 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setSidebarExpanded(!sidebarExpanded)}
                  className="w-full flex items-center justify-between p-3 md:p-0 text-left md:pointer-events-none md:mb-4"
                >
                  <h3 className="font-bold text-gray-900 text-[14px] md:text-[16px]">Quick links</h3>
                  <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform md:hidden ${sidebarExpanded ? 'rotate-180' : ''}`} />
                </button>

                <div className={`px-5 pb-5 md:p-0 space-y-0.5 md:block ${sidebarExpanded ? 'block' : 'hidden'}`}>
                  {quickLinks.map(link => (
                    <button key={link.id} type="button"
                      onClick={() => {
                        scrollTo(link.id);
                        if (window.innerWidth < 768) setSidebarExpanded(false);
                      }}
                      className="w-full flex items-center justify-between py-2.5 px-2 text-[14px] text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all text-left font-medium">
                      <span>{link.label}</span>
                      {link.badge && <span className={`text-[11px] font-bold ${link.bc}`}>{link.badge}</span>}
                    </button>
                  ))}
                </div>
              </Card>
            </div>

            {/* ── RIGHT: All Sections ── */}
            <div className="md:col-span-9 space-y-4">

              {/* ── RESUME ── */}
              <Card id="sec-resume">
                <h2 className="font-bold text-[14px] md:text-[18px] text-gray-900 mb-3">Resume</h2>
                {resumeUrl ? (
                  <div className="flex items-center justify-between p-4 border border-gray-100 rounded-xl mb-4">
                    <div>
                      <button type="button" onClick={() => viewPdf(resumeUrl)} className="text-[14px] font-bold text-gray-800 hover:text-blue-600 hover:underline transition-colors text-left">{resumeFilename}</button>
                      {resumeUploadedAt && <p className="text-[12px] text-gray-400 mt-0.5">Uploaded on {new Date(resumeUploadedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>}
                    </div>
                    <div className="flex items-center">
                      <a href={getDownloadUrl(resumeUrl, resumeFilename)} target="_blank" rel="noopener noreferrer" className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" download title="Download">
                        <Download className="w-4 h-4" />
                      </a>
                      <button type="button" onClick={() => deleteDocument('resume', resumeFileId)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : <p className="text-[13px] text-gray-400 mb-4">No resume uploaded yet.</p>}

                {editing === 'resume' ? (
                  <div>
                    <label className="block mb-1 text-[12px] font-bold text-gray-500 uppercase">Resume file</label>
                    <div className={`border-2 border-dashed rounded-xl p-6 text-center transition mb-1 ${resumeFile ? 'border-blue-300 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}>
                      <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                      <label className="cursor-pointer">
                        <span className="text-[13px] font-bold text-blue-600 hover:underline">
                          {resumeFile ? resumeFile.name : 'Choose file'}
                        </span>
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx,.rtf"
                          className="hidden"
                          onChange={e => { setResumeFile(e.target.files[0] || null); setResumeProgress(0); }}
                        />
                      </label>
                      <p className="text-[11px] text-gray-400 mt-1">Supported: doc, docx, rtf, pdf · Max 10 MB</p>
                      {resumeFile && <p className="text-[11px] text-blue-500 mt-1 font-medium">{(resumeFile.size / 1024 / 1024).toFixed(2)} MB selected</p>}
                    </div>
                    {resumeUploading && <UploadProgress progress={resumeProgress} label="Uploading resume…" />}
                    <ActionRow onSave={saveDocuments} onCancel={closeEdit} saving={saving} />
                  </div>
                ) : (
                  <button type="button" onClick={() => openEdit('resume')}
                    className="flex items-center gap-2 px-4 py-2 border border-blue-500 text-blue-600 text-[13px] font-bold rounded-full hover:bg-blue-50 transition">
                    <Upload className="w-4 h-4" />
                    {resumeUrl ? 'Update resume' : 'Upload resume'}
                  </button>
                )}
              </Card>

              {/* ── RESUME HEADLINE ── */}
              <Card id="sec-headline">
                <div className="flex items-center gap-2 mb-2">
                  <h2 className="font-bold text-[14px] md:text-[18px] text-gray-900">Resume headline</h2>
                  <EditBtn onClick={() => openEdit('headline')} />
                </div>
                {editing === 'headline' ? (
                  <div>
                    <label className={lCls}>Headline</label>
                    <textarea rows={2} className={iCls + ' resize-none'}
                      value={draftProfessional.currentRole}
                      onChange={e => setDraftProfessional(p => ({ ...p, currentRole: e.target.value }))}
                      placeholder="e.g. Entry level Full Stack Developer" />
                    <ActionRow onSave={saveProfessional} onCancel={closeEdit} saving={saving} />
                  </div>
                ) : (
                  <p className="text-[14px] text-gray-700 font-medium">
                    {profile?.currentRole || <span className="text-gray-400">Add a headline to describe your role</span>}
                  </p>
                )}
              </Card>

              {/* ── KEY SKILLS (primary + secondary + langs + tools merged) ── */}
              <Card id="sec-skills">
                <div className="flex items-center gap-2 mb-3">
                  <h2 className="font-bold text-[14px] md:text-[18px] text-gray-900">Key skills</h2>
                  <EditBtn onClick={() => openEdit('skills')} />
                </div>
                {editing === 'skills' ? (
                  <div className="space-y-5">
                    <SkillMultiSelect
                      label="Primary Skills"
                      values={draftSkills.primary}
                      options={skillsCatalog}
                      excludedCategories={['Programming Language']}
                      blockedValues={draftSkills.secondary}
                      onChange={(values) => setDraftSkills((p) => ({ ...p, primary: values }))}
                    />
                    <SkillMultiSelect
                      label="Secondary Skills"
                      values={draftSkills.secondary}
                      options={skillsCatalog}
                      excludedCategories={['Programming Language']}
                      blockedValues={draftSkills.primary}
                      onChange={(values) => setDraftSkills((p) => ({ ...p, secondary: values }))}
                    />
                    <SkillMultiSelect
                      label="Programming Languages"
                      values={draftSkills.langs}
                      options={skillsCatalog}
                      allowedCategories={['Programming Language']}
                      onChange={(values) => setDraftSkills((p) => ({ ...p, langs: values }))}
                    />
                    <ActionRow onSave={saveSkills} onCancel={closeEdit} saving={saving} />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(profile?.primarySkills?.length > 0 || profile?.secondarySkills?.length > 0 || profile?.programmingLanguages?.length > 0) ? (
                      <div className="space-y-3">
                        {profile?.primarySkills?.length > 0 && (
                          <div>
                            <p className="text-[11px] font-bold text-gray-400 uppercase mb-2">Primary Skills</p>
                            <div className="flex flex-wrap gap-1.5">{profile.primarySkills.map((s, i) => <SkillTag key={i} label={s} color="blue" />)}</div>
                          </div>
                        )}
                        {profile?.secondarySkills?.length > 0 && (
                          <div>
                            <p className="text-[11px] font-bold text-gray-400 uppercase mb-2">Secondary Skills</p>
                            <div className="flex flex-wrap gap-1.5">{profile.secondarySkills.map((s, i) => <SkillTag key={i} label={s} color="green" />)}</div>
                          </div>
                        )}
                        {profile?.programmingLanguages?.length > 0 && (
                          <div>
                            <p className="text-[11px] font-bold text-gray-400 uppercase mb-2">Programming Languages</p>
                            <div className="flex flex-wrap gap-1.5">{profile.programmingLanguages.map((s, i) => <SkillTag key={i} label={s} color="purple" />)}</div>
                          </div>
                        )}
                      </div>
                    ) : <p className="text-[13px] text-gray-400">No skills added yet. Click ✏️ to add.</p>}
                  </div>
                )}
              </Card>

              {/* ── EDUCATION ── */}
              <Card id="sec-education">
                <div className="flex items-center gap-2 mb-3">
                  <h2 className="font-bold text-[14px] md:text-[18px] text-gray-900">Education</h2>
                  <EditBtn onClick={() => openEdit('education')} />
                </div>
                {editing === 'education' ? (
                  <div className={gridTwo}>
                    <div className={spanTwo}>
                      <label className={lCls}>College / Institution</label>
                      <input className={iCls} value={draftEducation.collegeName} onChange={e => setDraftEducation(p => ({ ...p, collegeName: e.target.value }))} placeholder="e.g. Anna University" />
                    </div>
                    <div>
                      <label className={lCls}>University</label>
                      <input className={iCls} value={draftEducation.university} onChange={e => setDraftEducation(p => ({ ...p, university: e.target.value }))} placeholder="e.g. Anna University" />
                    </div>
                    <div>
                      <label className={lCls}>Highest Qualification</label>
                      <select className={iCls} value={draftEducation.highestQualification} onChange={e => setDraftEducation(p => ({ ...p, highestQualification: e.target.value }))}>
                        <option value="">Select…</option>
                        {["High School (10th)", "Intermediate (12th)", "Diploma", "Bachelor's Degree", "Master's Degree", "PhD", "Other"].map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={lCls}>Branch / Specialization</label>
                      <input className={iCls} value={draftEducation.specialization} onChange={e => setDraftEducation(p => ({ ...p, specialization: e.target.value }))} placeholder="e.g. Computer Science" />
                    </div>
                    <div>
                      <label className={lCls}>Graduation Year</label>
                      <input type="number" className={iCls} value={draftEducation.graduationYear} onChange={e => setDraftEducation(p => ({ ...p, graduationYear: e.target.value }))} placeholder="2025" />
                    </div>
                    <div>
                      <label className={lCls}>CGPA / Percentage</label>
                      <input className={iCls} value={draftEducation.cgpaOrPercentage} onChange={e => setDraftEducation(p => ({ ...p, cgpaOrPercentage: e.target.value }))} placeholder="8.5" />
                    </div>
                    <div>
                      <label className={lCls}>10th Percentage</label>
                      <input className={iCls} value={draftEducation.tenthPercentage} onChange={e => setDraftEducation(p => ({ ...p, tenthPercentage: e.target.value }))} placeholder="90%" />
                    </div>
                    <div>
                      <label className={lCls}>12th / Diploma Percentage</label>
                      <input className={iCls} value={draftEducation.twelfthOrDiplomaPercentage} onChange={e => setDraftEducation(p => ({ ...p, twelfthOrDiplomaPercentage: e.target.value }))} placeholder="88%" />
                    </div>
                    <div className={spanTwo}><ActionRow onSave={saveEducation} onCancel={closeEdit} saving={saving} /></div>
                  </div>
                ) : (
                  profile?.collegeName ? (
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                        <GraduationCap className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-[15px] font-bold text-gray-900">{profile.highestQualification || 'Degree'}{profile.specialization ? ` — ${profile.specialization}` : ''}</p>
                        <p className="text-[13px] text-gray-600 mt-0.5">{profile.collegeName}</p>
                        {profile.university && <p className="text-[12px] text-gray-400">{profile.university}</p>}
                        <div className="flex flex-wrap items-center gap-3 mt-1">
                          {profile.graduationYear && <span className="text-[12px] text-gray-500">{profile.graduationYear}</span>}
                          {profile.cgpaOrPercentage && <span className="text-[12px] text-gray-500">CGPA: {profile.cgpaOrPercentage}</span>}
                          {profile.tenthPercentage && <span className="text-[12px] text-gray-500">10th: {profile.tenthPercentage}%</span>}
                          {profile.twelfthOrDiplomaPercentage && <span className="text-[12px] text-gray-500">12th: {profile.twelfthOrDiplomaPercentage}%</span>}
                        </div>
                      </div>
                    </div>
                  ) : <p className="text-[13px] text-gray-400">No education details added. Click ✏️ to add.</p>
                )}
              </Card>

              {/* ── PROFESSIONAL DETAILS ── */}
              <Card id="sec-professional">
                <div className="flex items-center gap-2 mb-3">
                  <h2 className="font-bold text-[14px] md:text-[18px] text-gray-900">Professional details</h2>
                  <EditBtn onClick={() => openEdit('professional')} />
                </div>
                {editing === 'professional' ? (
                  <div className={gridTwo}>
                    <div>
                      <label className={lCls}>Current Status</label>
                      <select className={iCls} value={draftProfessional.currentStatus} onChange={e => setDraftProfessional(p => ({ ...p, currentStatus: e.target.value }))}>
                        <option value="">Select…</option>
                        {['Student', 'Graduate', 'Working Professional'].map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={lCls}>Candidate Type</label>
                      <select className={iCls} value={draftProfessional.candidateType} onChange={e => setDraftProfessional(p => ({ ...p, candidateType: e.target.value }))}>
                        <option value="">Select…</option>
                        <option value="FRESHER">Fresher</option>
                        <option value="EXPERIENCED">Experienced</option>
                      </select>
                    </div>
                    {draftProfessional.candidateType === 'EXPERIENCED' && (
                      <>
                        <div>
                          <label className={lCls}>Years of Experience</label>
                          <input type="number" min="0" className={iCls} value={draftProfessional.yearsOfExperience} onChange={e => setDraftProfessional(p => ({ ...p, yearsOfExperience: e.target.value }))} placeholder="2" />
                        </div>
                        <div>
                          <label className={lCls}>Current / Previous Role</label>
                          <input className={iCls} value={draftProfessional.currentRole} onChange={e => setDraftProfessional(p => ({ ...p, currentRole: e.target.value }))} placeholder="e.g. Software Engineer" />
                        </div>
                        <div className={spanTwo}>
                          <label className={lCls}>Previous Organization</label>
                          <input className={iCls} value={draftProfessional.previousOrganization} onChange={e => setDraftProfessional(p => ({ ...p, previousOrganization: e.target.value }))} placeholder="e.g. Infosys" />
                        </div>
                      </>
                    )}
                    <div className={spanTwo}><ActionRow onSave={saveProfessional} onCancel={closeEdit} saving={saving} /></div>
                  </div>
                ) : (
                  <div className={gridTwo}>
                    <InfoPair label="Current Status" value={profile?.currentStatus} />
                    <InfoPair label="Candidate Type" value={profile?.candidateType === 'EXPERIENCED' ? 'Experienced' : profile?.candidateType === 'FRESHER' ? 'Fresher' : undefined} />
                    {profile?.candidateType === 'EXPERIENCED' && (
                      <>
                        <InfoPair label="Years of Experience" value={profile?.yearsOfExperience ? `${profile.yearsOfExperience} yr${profile.yearsOfExperience !== 1 ? 's' : ''}` : undefined} />
                        <InfoPair label="Current Role" value={profile?.currentRole} />
                        <InfoPair label="Previous Organization" value={profile?.previousOrganization} />
                      </>
                    )}
                    {!profile?.currentStatus && <p className="text-[13px] text-gray-400 col-span-2">No professional details added. Click ✏️ to add.</p>}
                  </div>
                )}
              </Card>

              {/* ── COURSE PREFERENCES ── */}
              <Card id="sec-courses">
                <div className="flex items-center gap-2 mb-3">
                  <h2 className="font-bold text-[14px] md:text-[18px] text-gray-900">Course preferences</h2>
                  <EditBtn onClick={() => openEdit('courses')} />
                </div>
                {editing === 'courses' ? (
                  <div className={gridTwo}>
                    <div>
                      <label className={lCls}>Course Interested In</label>
                      <input className={iCls} value={draftCourses.courseInterestedIn} onChange={e => setDraftCourses(p => ({ ...p, courseInterestedIn: e.target.value }))} placeholder="e.g. Full Stack Development" />
                    </div>
                    <div>
                      <label className={lCls}>Preferred Learning Mode</label>
                      <select className={iCls} value={draftCourses.preferredLearningMode} onChange={e => setDraftCourses(p => ({ ...p, preferredLearningMode: e.target.value }))}>
                        <option value="">Select…</option>
                        {['online', 'offline', 'hybrid', 'self_paced'].map(o => <option key={o} value={o}>{o.replace('_', ' ')}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={lCls}>Availability</label>
                      <select className={iCls} value={draftCourses.availability} onChange={e => setDraftCourses(p => ({ ...p, availability: e.target.value }))}>
                        <option value="">Select…</option>
                        {['immediate', 'within_1_month', 'within_3_months', 'within_6_months', 'not_available'].map(o => <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={lCls}>Daily Study Hours</label>
                      <input type="number" min="1" max="24" className={iCls} value={draftCourses.dailyStudyHours} onChange={e => setDraftCourses(p => ({ ...p, dailyStudyHours: e.target.value }))} placeholder="e.g. 4" />
                    </div>
                    <div>
                      <label className={lCls}>Expected Start Date</label>
                      <input type="date" className={iCls} value={draftCourses.expectedStartDate} onChange={e => setDraftCourses(p => ({ ...p, expectedStartDate: e.target.value }))} />
                    </div>
                    <div className={spanTwo}><ActionRow onSave={saveCourses} onCancel={closeEdit} saving={saving} /></div>
                  </div>
                ) : (
                  <div className={gridTwo}>
                    <InfoPair label="Course Interest" value={profile?.courseInterestedIn} />
                    <InfoPair label="Learning Mode" value={profile?.preferredLearningMode?.replace('_', ' ')} />
                    <InfoPair label="Availability" value={profile?.availability?.replace(/_/g, ' ')} />
                    <InfoPair label="Daily Study Hours" value={profile?.dailyStudyHours ? `${profile.dailyStudyHours} hrs/day` : undefined} />
                    {!profile?.preferredLearningMode && !profile?.courseInterestedIn && (
                      <p className="text-[13px] text-gray-400 col-span-2">No preferences added. Click ✏️ to add.</p>
                    )}
                  </div>
                )}
              </Card>

              {/* ── CAREER GOALS ── */}
              <Card id="sec-career">
                <div className="flex items-center gap-2 mb-3">
                  <h2 className="font-bold text-[14px] md:text-[18px] text-gray-900">Career goals</h2>
                  <EditBtn onClick={() => openEdit('career')} />
                </div>
                {editing === 'career' ? (
                  <div className="space-y-4">
                    <div>
                      <label className={lCls}>Career Objective / Profile Summary</label>
                      <textarea rows={4} className={iCls + ' resize-none'} value={draftCareer.careerObjective} onChange={e => setDraftCareer(p => ({ ...p, careerObjective: e.target.value }))} placeholder="Briefly describe your career goals…" />
                    </div>
                    <div>
                      <label className={lCls}>Preferred Job Role</label>
                      <input className={iCls} value={draftCareer.preferredJobRole} onChange={e => setDraftCareer(p => ({ ...p, preferredJobRole: e.target.value }))} placeholder="e.g. Full Stack Developer" />
                    </div>
                    <div>
                      <label className={lCls}>Target Companies</label>
                      <div className="flex gap-2 mb-2">
                        <input className={iCls + ' flex-1'} value={newCompany} onChange={e => setNewCompany(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCompany(); } }} placeholder="e.g. Google, Infosys" />
                        <button type="button" onClick={addCompany} className="px-3 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"><Plus className="w-4 h-4" /></button>
                      </div>
                      {draftCareer.targetCompanies.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {draftCareer.targetCompanies.map((c, i) => <SkillTag key={i} label={c} color="gray" onRemove={() => removeCompany(i)} />)}
                        </div>
                      )}
                    </div>
                    <ActionRow onSave={saveCareer} onCancel={closeEdit} saving={saving} />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {profile?.careerObjective
                      ? <p className="text-[14px] text-gray-700 leading-relaxed">{profile.careerObjective}</p>
                      : <p className="text-[13px] text-gray-400">No career objective added. Click ✏️ to add.</p>}
                    {profile?.preferredJobRole && (
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-gray-400" />
                        <span className="text-[13px] text-gray-600 font-medium">Preferred Role: {profile.preferredJobRole}</span>
                      </div>
                    )}
                    {profile?.targetCompanies?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {profile.targetCompanies.map((c, i) => <SkillTag key={i} label={c} color="gray" />)}
                      </div>
                    )}
                  </div>
                )}
              </Card>

              {/* ── PERSONAL DETAILS ── */}
              <Card id="sec-personal" className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="font-bold text-[18px] text-gray-900">Personal details</h2>
                  <EditBtn onClick={() => openEdit('personal')} />
                </div>
                {editing === 'personal' ? (
                  <div className={gridTwo}>
                    <div className={spanTwo}>
                      <label className={lCls}>Full Name</label>
                      <input className={iCls} value={draftPersonal.fullName} onChange={e => setDraftPersonal(p => ({ ...p, fullName: e.target.value }))} placeholder="Your full name" />
                    </div>
                    <div className={spanTwo}>
                      <label className={lCls}>Email Address</label>
                      <input className={iCls + ' bg-gray-50 cursor-not-allowed'} value={draftPersonal.email} disabled placeholder="Email" />
                      <p className="text-[11px] text-gray-400 mt-1">Email cannot be changed</p>
                    </div>
                    <div>
                      <label className={lCls}>Mobile Number</label>
                      <input type="tel" className={iCls} value={draftPersonal.mobileNumber} onChange={e => setDraftPersonal(p => ({ ...p, mobileNumber: e.target.value }))} placeholder="10-digit number" />
                    </div>
                    <div>
                      <label className={lCls}>WhatsApp Number</label>
                      <input type="tel" className={iCls} value={draftPersonal.whatsappNumber} onChange={e => setDraftPersonal(p => ({ ...p, whatsappNumber: e.target.value }))} placeholder="10-digit number" />
                    </div>
                    <div>
                      <label className={lCls}>Alternate Mobile</label>
                      <input type="tel" className={iCls} value={draftPersonal.alternateMobileNumber} onChange={e => setDraftPersonal(p => ({ ...p, alternateMobileNumber: e.target.value }))} placeholder="10-digit number" />
                    </div>
                    <div>
                      <label className={lCls}>Gender</label>
                      <select className={iCls} value={draftPersonal.gender} onChange={e => setDraftPersonal(p => ({ ...p, gender: e.target.value }))}>
                        <option value="">Select…</option>
                        {['Male', 'Female', 'Other', 'Prefer not to say'].map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={lCls}>Date of Birth</label>
                      <input type="date" className={iCls} value={draftPersonal.dateOfBirth} onChange={e => setDraftPersonal(p => ({ ...p, dateOfBirth: e.target.value }))} />
                    </div>
                    <div>
                      <label className={lCls}>City</label>
                      <input className={iCls} value={draftPersonal.city} onChange={e => setDraftPersonal(p => ({ ...p, city: e.target.value }))} placeholder="Chennai" />
                    </div>
                    <div>
                      <label className={lCls}>State</label>
                      <input className={iCls} value={draftPersonal.state} onChange={e => setDraftPersonal(p => ({ ...p, state: e.target.value }))} placeholder="Tamil Nadu" />
                    </div>
                    <div>
                      <label className={lCls}>Country</label>
                      <input className={iCls} value={draftPersonal.country} onChange={e => setDraftPersonal(p => ({ ...p, country: e.target.value }))} placeholder="India" />
                    </div>
                    <div>
                      <label className={lCls}>Pincode</label>
                      <input className={iCls} value={draftPersonal.pincode} onChange={e => setDraftPersonal(p => ({ ...p, pincode: e.target.value }))} placeholder="600001" maxLength={6} />
                    </div>
                    <div className={spanTwo}><ActionRow onSave={savePersonal} onCancel={closeEdit} saving={saving} /></div>
                  </div>
                ) : (
                  <div className={gridTwo}>
                    <InfoPair label="Full Name" value={getName()} />
                    <InfoPair label="Email" value={profile?.email || user?.email} />
                    <InfoPair label="Mobile" value={profile?.mobileNumber} />
                    <InfoPair label="WhatsApp" value={profile?.whatsappNumber} />
                    <InfoPair label="Alternate Mobile" value={profile?.alternateMobileNumber} />
                    <InfoPair label="Gender" value={profile?.gender} />
                    <InfoPair label="Date of Birth" value={profile?.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : null} />
                    <InfoPair label="City" value={profile?.address?.city} />
                    <InfoPair label="State" value={profile?.address?.state} />
                    <InfoPair label="Country" value={profile?.address?.country} />
                    <InfoPair label="Pincode" value={profile?.address?.pincode} />
                  </div>
                )}
              </Card>

              {/* ── DOCUMENTS ── */}
              <Card id="sec-documents" className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="font-bold text-[18px] text-gray-900">Documents</h2>
                  <EditBtn onClick={() => openEdit('documents')} />
                </div>
                {editing === 'documents' ? (
                  <div className="space-y-5">
                    {/* Resume upload */}
                    <div>
                      <label className={lCls}>Resume / CV</label>
                      <div className={`border-2 border-dashed rounded-xl p-5 text-center transition ${resumeFile ? 'border-blue-300 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}>
                        <Upload className="w-5 h-5 text-gray-400 mx-auto mb-1.5" />
                        <label className="cursor-pointer">
                          <span className="text-[13px] font-bold text-blue-600 hover:underline">
                            {resumeFile ? resumeFile.name : 'Choose resume file'}
                          </span>
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx,.rtf"
                            className="hidden"
                            onChange={e => { setResumeFile(e.target.files[0] || null); setResumeProgress(0); }}
                          />
                        </label>
                        <p className="text-[11px] text-gray-400 mt-1">doc, docx, rtf, pdf · Max 10 MB</p>
                        {resumeFile && <p className="text-[11px] text-blue-500 mt-1 font-medium">{(resumeFile.size / 1024 / 1024).toFixed(2)} MB selected</p>}
                      </div>
                      {resumeUploading && <UploadProgress progress={resumeProgress} label="Uploading resume…" />}
                    </div>

                    {/* ID Proof upload */}
                    <div>
                      <label className={lCls}>ID Proof</label>
                      <div className={`border-2 border-dashed rounded-xl p-5 text-center transition ${idProofFile ? 'border-blue-300 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}>
                        <Upload className="w-5 h-5 text-gray-400 mx-auto mb-1.5" />
                        <label className="cursor-pointer">
                          <span className="text-[13px] font-bold text-blue-600 hover:underline">
                            {idProofFile ? idProofFile.name : 'Choose ID proof'}
                          </span>
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="hidden"
                            onChange={e => { setIdProofFile(e.target.files[0] || null); setIdProofProgress(0); }}
                          />
                        </label>
                        <p className="text-[11px] text-gray-400 mt-1">pdf, jpg, png · Max 10 MB</p>
                        {idProofFile && <p className="text-[11px] text-blue-500 mt-1 font-medium">{(idProofFile.size / 1024 / 1024).toFixed(2)} MB selected</p>}
                      </div>
                      {idProofUploading && <UploadProgress progress={idProofProgress} label="Uploading ID proof…" />}
                    </div>

                    <ActionRow onSave={saveDocuments} onCancel={closeEdit} saving={saving} />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {resumeUrl ? (
                      <div className="flex items-center justify-between p-3 border border-gray-100 rounded-xl">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-blue-500" />
                          <div>
                            <button type="button" onClick={() => viewPdf(resumeUrl)} className="text-[13px] font-bold text-gray-800 hover:text-blue-600 hover:underline transition-colors text-left">{resumeFilename}</button>
                            {resumeUploadedAt && <p className="text-[11px] text-gray-400">Uploaded {new Date(resumeUploadedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>}
                          </div>
                        </div>
                        <div className="flex items-center">
                          <a href={getDownloadUrl(resumeUrl, resumeFilename)} target="_blank" rel="noopener noreferrer" className="p-2 text-gray-400 hover:text-blue-600 rounded-lg transition" download title="Download"><Download className="w-4 h-4" /></a>
                          <button type="button" onClick={() => deleteDocument('resume', resumeFileId)} className="p-2 text-gray-400 hover:text-red-600 rounded-lg transition" title="Delete"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                    ) : <p className="text-[13px] text-gray-400">No resume uploaded.</p>}
                    {idProofUrl ? (
                      <div className="flex items-center justify-between p-3 border border-gray-100 rounded-xl">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-green-500" />
                          <button type="button" onClick={() => viewPdf(idProofUrl)} className="text-[13px] font-bold text-gray-800 hover:text-blue-600 hover:underline transition-colors text-left">ID Proof</button>
                        </div>
                        <div className="flex items-center">
                          <a href={getDownloadUrl(idProofUrl, 'ID_Proof')} target="_blank" rel="noopener noreferrer" className="p-2 text-gray-400 hover:text-blue-600 rounded-lg transition" download title="Download"><Download className="w-4 h-4" /></a>
                          <button type="button" onClick={() => deleteDocument('id_proof', idProofFileId)} className="p-2 text-gray-400 hover:text-red-600 rounded-lg transition" title="Delete"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                    ) : <p className="text-[13px] text-gray-400">No ID proof uploaded.</p>}
                  </div>
                )}
              </Card>

            </div>{/* end right col */}
          </div>{/* end two-col grid */}
        </div>{/* end max-w */}
      </div>
    </StudentLayout>
  );
};

export default MyProfile;