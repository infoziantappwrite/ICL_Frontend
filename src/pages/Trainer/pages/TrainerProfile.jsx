import { useState, useEffect } from 'react';
import {
  UserCircle, Edit2, Save, X, Plus, Trash2,
  Linkedin, Github, Globe, Link2,
  GraduationCap, Award, Star, Languages,
  AlertCircle, CheckCircle2,
} from 'lucide-react';
import TrainerDashboardLayout from '../../../components/layout/Trainerdashboardlayout';
import { trainerAPI, skillAPI } from '../../../api/Api';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';

/* ─── Section card ─── */
const Section = ({ title, icon: Icon, children, color = '#003399' }) => (
  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}10`, color }}>
        <Icon className="w-3.5 h-3.5" />
      </div>
      <h3 className="text-sm font-black text-slate-800">{title}</h3>
    </div>
    {children}
  </div>
);

/* ─── Field ─── */
const Field = ({ label, children }) => (
  <div>
    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{label}</label>
    {children}
  </div>
);

/* ─── Input ─── */
const Input = ({ value, onChange, placeholder, type = 'text', disabled }) => (
  <input
    type={type}
    value={value || ''}
    onChange={onChange}
    placeholder={placeholder}
    disabled={disabled}
    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-700 outline-none focus:border-[#003399]/40 focus:ring-2 focus:ring-[#003399]/10 transition-all disabled:bg-slate-50 disabled:text-slate-400"
  />
);

/* ─── Textarea ─── */
const Textarea = ({ value, onChange, placeholder, rows = 3 }) => (
  <textarea
    value={value || ''}
    onChange={onChange}
    placeholder={placeholder}
    rows={rows}
    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-700 outline-none focus:border-[#003399]/40 focus:ring-2 focus:ring-[#003399]/10 transition-all resize-none"
  />
);

/* ════════ MAIN ════════ */
const TrainerProfile = () => {
  const { user } = useAuth();
  const toast = useToast();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    headline: '',
    bio: '',
    experience_years: '',
    linkedin: '',
    github: '',
    portfolio: '',
    website: '',
    languages_known: [],
    achievements: [],
    education: [],
    certifications: [],
    availability: [],
  });

  const [langInput, setLangInput] = useState('');
  const [achieveInput, setAchieveInput] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await trainerAPI.getProfile();
        const p = res.data;
        setProfile(p);
        setForm({
          headline: p?.headline || '',
          bio: p?.bio || '',
          experience_years: p?.experience_years ?? '',
          linkedin: p?.linkedin || '',
          github: p?.github || '',
          portfolio: p?.portfolio || '',
          website: p?.website || '',
          languages_known: p?.languages_known || [],
          achievements: p?.achievements || [],
          education: p?.education || [],
          certifications: p?.certifications || [],
          availability: p?.availability || [],
        });
      } catch (e) {
        setError('Failed to load profile.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        experience_years: form.experience_years !== '' ? Number(form.experience_years) : undefined,
      };
      // Remove empty URL strings to avoid Zod URL validation errors
      ['linkedin','github','portfolio','website'].forEach(k => {
        if (!payload[k]) delete payload[k];
      });
      const res = await trainerAPI.updateProfile(payload);
      setProfile(res.data);
      setEditMode(false);
      toast.success('Profile Updated', 'Your profile has been saved.');
    } catch (e) {
      toast.error('Error', e.message || 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setForm({
        headline: profile.headline || '',
        bio: profile.bio || '',
        experience_years: profile.experience_years ?? '',
        linkedin: profile.linkedin || '',
        github: profile.github || '',
        portfolio: profile.portfolio || '',
        website: profile.website || '',
        languages_known: profile.languages_known || [],
        achievements: profile.achievements || [],
        education: profile.education || [],
        certifications: profile.certifications || [],
        availability: profile.availability || [],
      });
    }
    setEditMode(false);
  };

  /* ── Education helpers ── */
  const addEdu = () => setForm(f => ({ ...f, education: [...f.education, { degree: '', institution: '', from_year: '', to_year: '' }] }));
  const updateEdu = (i, field, val) => setForm(f => {
    const edu = [...f.education];
    edu[i] = { ...edu[i], [field]: val };
    return { ...f, education: edu };
  });
  const removeEdu = (i) => setForm(f => ({ ...f, education: f.education.filter((_, idx) => idx !== i) }));

  /* ── Certification helpers ── */
  const addCert = () => setForm(f => ({ ...f, certifications: [...f.certifications, { title: '', issuer: '', year: '', description: '' }] }));
  const updateCert = (i, field, val) => setForm(f => {
    const certs = [...f.certifications];
    certs[i] = { ...certs[i], [field]: val };
    return { ...f, certifications: certs };
  });
  const removeCert = (i) => setForm(f => ({ ...f, certifications: f.certifications.filter((_, idx) => idx !== i) }));

  if (loading) {
    return (
      <TrainerDashboardLayout>
        <div className="max-w-3xl mx-auto space-y-4 py-2 animate-pulse">
          <div className="h-32 bg-white rounded-2xl border border-slate-100" />
          <div className="h-48 bg-white rounded-2xl border border-slate-100" />
          <div className="h-48 bg-white rounded-2xl border border-slate-100" />
        </div>
      </TrainerDashboardLayout>
    );
  }

  return (
    <TrainerDashboardLayout>
      <div className="max-w-3xl mx-auto space-y-5 py-2">

        {/* Header */}
        <div
          className="rounded-2xl p-5 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #003399 0%, #00A9CE 100%)' }}
        >
          <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/5" />
          <div className="absolute -bottom-8 right-16 w-24 h-24 rounded-full bg-white/5" />
          <div className="relative flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-white text-xl font-black"
              >
                {(user?.fullName || 'T').split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
              </div>
              <div>
                <h1 className="text-lg font-black text-white">{user?.fullName || 'Trainer'}</h1>
                <p className="text-blue-100 text-xs">{user?.email}</p>
                {profile?.headline && <p className="text-blue-100 text-xs mt-1">{profile.headline}</p>}
              </div>
            </div>
            <button
              onClick={() => setEditMode(!editMode)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-white/20 text-white border border-white/20 hover:bg-white/30 transition-all"
            >
              {editMode ? <><X className="w-3.5 h-3.5" /> Cancel</> : <><Edit2 className="w-3.5 h-3.5" /> Edit Profile</>}
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        {/* Basic Info */}
        <Section title="Basic Information" icon={UserCircle}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Headline">
              <Input value={form.headline} onChange={e => setForm(f => ({ ...f, headline: e.target.value }))} placeholder="e.g. Full Stack Developer | 5+ Years" disabled={!editMode} />
            </Field>
            <Field label="Years of Experience">
              <Input type="number" value={form.experience_years} onChange={e => setForm(f => ({ ...f, experience_years: e.target.value }))} placeholder="e.g. 5" disabled={!editMode} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Bio">
                <Textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} placeholder="Tell students about yourself..." rows={4} />
              </Field>
            </div>
          </div>
        </Section>

        {/* Social Links */}
        <Section title="Social & Links" icon={Link2} color="#00A9CE">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { key: 'linkedin', label: 'LinkedIn URL', placeholder: 'https://linkedin.com/in/...' },
              { key: 'github',   label: 'GitHub URL',   placeholder: 'https://github.com/...' },
              { key: 'portfolio',label: 'Portfolio URL', placeholder: 'https://portfolio.com' },
              { key: 'website',  label: 'Website URL',  placeholder: 'https://yoursite.com' },
            ].map(({ key, label, placeholder }) => (
              <Field key={key} label={label}>
                <Input value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder} disabled={!editMode} />
              </Field>
            ))}
          </div>
        </Section>

        {/* Education */}
        <Section title="Education" icon={GraduationCap} color="#059669">
          <div className="space-y-3">
            {form.education.map((edu, i) => (
              <div key={i} className="bg-slate-50 rounded-xl p-3">
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <Input value={edu.degree} onChange={e => updateEdu(i, 'degree', e.target.value)} placeholder="Degree" disabled={!editMode} />
                  <Input value={edu.institution} onChange={e => updateEdu(i, 'institution', e.target.value)} placeholder="Institution" disabled={!editMode} />
                  <Input type="number" value={edu.from_year} onChange={e => updateEdu(i, 'from_year', e.target.value)} placeholder="From Year" disabled={!editMode} />
                  <Input type="number" value={edu.to_year} onChange={e => updateEdu(i, 'to_year', e.target.value)} placeholder="To Year" disabled={!editMode} />
                </div>
                {editMode && (
                  <button onClick={() => removeEdu(i)} className="text-xs text-red-500 font-bold flex items-center gap-1">
                    <Trash2 className="w-3 h-3" /> Remove
                  </button>
                )}
              </div>
            ))}
            {editMode && (
              <button
                onClick={addEdu}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-dashed border-[#003399]/30 text-xs font-black text-[#003399] hover:bg-[#003399]/5 transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> Add Education
              </button>
            )}
            {form.education.length === 0 && !editMode && (
              <p className="text-sm text-slate-400 text-center py-4">No education added yet.</p>
            )}
          </div>
        </Section>

        {/* Certifications */}
        <Section title="Certifications" icon={Award} color="#D97706">
          <div className="space-y-3">
            {form.certifications.map((cert, i) => (
              <div key={i} className="bg-slate-50 rounded-xl p-3">
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <Input value={cert.title} onChange={e => updateCert(i, 'title', e.target.value)} placeholder="Certification Title" disabled={!editMode} />
                  <Input value={cert.issuer} onChange={e => updateCert(i, 'issuer', e.target.value)} placeholder="Issuer" disabled={!editMode} />
                  <Input type="number" value={cert.year} onChange={e => updateCert(i, 'year', e.target.value)} placeholder="Year" disabled={!editMode} />
                  <Input value={cert.description} onChange={e => updateCert(i, 'description', e.target.value)} placeholder="Description" disabled={!editMode} />
                </div>
                {editMode && (
                  <button onClick={() => removeCert(i)} className="text-xs text-red-500 font-bold flex items-center gap-1">
                    <Trash2 className="w-3 h-3" /> Remove
                  </button>
                )}
              </div>
            ))}
            {editMode && (
              <button
                onClick={addCert}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-dashed border-[#D97706]/40 text-xs font-black text-[#D97706] hover:bg-[#D97706]/5 transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> Add Certification
              </button>
            )}
            {form.certifications.length === 0 && !editMode && (
              <p className="text-sm text-slate-400 text-center py-4">No certifications added yet.</p>
            )}
          </div>
        </Section>

        {/* Languages */}
        <Section title="Languages Known" icon={Languages} color="#6366F1">
          <div className="flex flex-wrap gap-2 mb-3">
            {form.languages_known.map((l, i) => (
              <span key={i} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#6366F1]/10 text-[#6366F1] text-xs font-bold">
                {l}
                {editMode && (
                  <button onClick={() => setForm(f => ({ ...f, languages_known: f.languages_known.filter((_, idx) => idx !== i) }))}>
                    <X className="w-3 h-3" />
                  </button>
                )}
              </span>
            ))}
          </div>
          {editMode && (
            <div className="flex gap-2">
              <Input value={langInput} onChange={e => setLangInput(e.target.value)} placeholder="e.g. Tamil, English" />
              <button
                onClick={() => {
                  if (langInput.trim()) {
                    setForm(f => ({ ...f, languages_known: [...f.languages_known, langInput.trim()] }));
                    setLangInput('');
                  }
                }}
                className="px-3 py-2 rounded-xl bg-[#6366F1] text-white text-xs font-black"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          )}
        </Section>

        {/* Achievements */}
        <Section title="Achievements" icon={Star} color="#F59E0B">
          <div className="space-y-2 mb-3">
            {form.achievements.map((a, i) => (
              <div key={i} className="flex items-center gap-2 bg-amber-50 rounded-xl px-3 py-2">
                <Star className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                <span className="text-xs font-semibold text-slate-700 flex-1">{a}</span>
                {editMode && (
                  <button onClick={() => setForm(f => ({ ...f, achievements: f.achievements.filter((_, idx) => idx !== i) }))}>
                    <X className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                )}
              </div>
            ))}
          </div>
          {editMode && (
            <div className="flex gap-2">
              <Input value={achieveInput} onChange={e => setAchieveInput(e.target.value)} placeholder="Add an achievement..." />
              <button
                onClick={() => {
                  if (achieveInput.trim()) {
                    setForm(f => ({ ...f, achievements: [...f.achievements, achieveInput.trim()] }));
                    setAchieveInput('');
                  }
                }}
                className="px-3 py-2 rounded-xl bg-amber-500 text-white text-xs font-black"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          )}
          {form.achievements.length === 0 && !editMode && (
            <p className="text-sm text-slate-400 text-center py-4">No achievements added yet.</p>
          )}
        </Section>

        {/* Save button */}
        {editMode && (
          <div className="flex justify-end gap-2 pb-4">
            <button
              onClick={handleCancel}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black text-white transition-all hover:opacity-90 disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #003399, #00A9CE)' }}
            >
              {saving ? 'Saving...' : <><Save className="w-4 h-4" /> Save Profile</>}
            </button>
          </div>
        )}
      </div>
    </TrainerDashboardLayout>
  );
};

export default TrainerProfile;