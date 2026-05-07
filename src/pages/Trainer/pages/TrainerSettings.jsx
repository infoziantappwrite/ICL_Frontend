import { useState } from 'react';
import { Settings, Bell, Lock, Eye, EyeOff, Save, Shield } from 'lucide-react';
import TrainerDashboardLayout from '../../../components/layout/Trainerdashboardlayout';
import { authAPI } from '../../../api/Api';
import { useToast } from '../../../context/ToastContext';

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

const Toggle = ({ label, sub, value, onChange }) => (
  <div className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
    <div>
      <p className="text-sm font-semibold text-slate-700">{label}</p>
      {sub && <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
    <button
      onClick={() => onChange(!value)}
      className={`w-10 h-5 rounded-full transition-all duration-200 relative ${value ? 'bg-[#003399]' : 'bg-slate-200'}`}
    >
      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${value ? 'left-5' : 'left-0.5'}`} />
    </button>
  </div>
);

const TrainerSettings = () => {
  const toast = useToast();

  const [notifs, setNotifs] = useState({
    newStudentEnroll: true,
    assessmentSubmit: true,
    courseUpdate: false,
    weeklyReport: true,
  });

  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [showPw, setShowPw] = useState({ current: false, next: false, confirm: false });
  const [savingPw, setSavingPw] = useState(false);

  const handlePasswordSave = async () => {
    if (!pw.current || !pw.next || !pw.confirm) {
      toast.error('Validation', 'All password fields are required.');
      return;
    }
    if (pw.next !== pw.confirm) {
      toast.error('Mismatch', 'New passwords do not match.');
      return;
    }
    if (pw.next.length < 8) {
      toast.error('Too Short', 'Password must be at least 8 characters.');
      return;
    }
    setSavingPw(true);
    try {
      await authAPI.updatePassword(pw.current, pw.next);
      toast.success('Password Changed', 'Your password has been updated.');
      setPw({ current: '', next: '', confirm: '' });
    } catch (e) {
      toast.error('Error', e.message || 'Failed to change password.');
    } finally {
      setSavingPw(false);
    }
  };

  const PwField = ({ label, field }) => (
    <div>
      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{label}</label>
      <div className="relative">
        <input
          type={showPw[field] ? 'text' : 'password'}
          value={pw[field]}
          onChange={e => setPw(p => ({ ...p, [field]: e.target.value }))}
          className="w-full px-3 py-2 pr-9 rounded-xl border border-slate-200 text-sm text-slate-700 outline-none focus:border-[#003399]/40 focus:ring-2 focus:ring-[#003399]/10 transition-all"
        />
        <button
          onClick={() => setShowPw(s => ({ ...s, [field]: !s[field] }))}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
        >
          {showPw[field] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );

  return (
    <TrainerDashboardLayout>
      <div className="max-w-2xl mx-auto space-y-5 py-2">

        <div>
          <h1 className="text-xl font-black text-slate-800">Settings</h1>
          <p className="text-xs text-slate-400 mt-0.5">Manage your account preferences</p>
        </div>

        {/* Notifications */}
        <Section title="Notification Preferences" icon={Bell} color="#00A9CE">
          <Toggle label="New Student Enrollment" sub="When a student joins your course" value={notifs.newStudentEnroll} onChange={v => setNotifs(n => ({ ...n, newStudentEnroll: v }))} />
          <Toggle label="Assessment Submissions" sub="When a student submits an assessment" value={notifs.assessmentSubmit} onChange={v => setNotifs(n => ({ ...n, assessmentSubmit: v }))} />
          <Toggle label="Course Updates" sub="When your assigned courses are modified" value={notifs.courseUpdate} onChange={v => setNotifs(n => ({ ...n, courseUpdate: v }))} />
          <Toggle label="Weekly Report" sub="Receive a weekly performance digest" value={notifs.weeklyReport} onChange={v => setNotifs(n => ({ ...n, weeklyReport: v }))} />
          <button
            onClick={() => toast.success('Saved', 'Notification preferences saved.')}
            className="mt-3 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black text-white"
            style={{ background: 'linear-gradient(135deg, #003399, #00A9CE)' }}
          >
            <Save className="w-3.5 h-3.5" /> Save Preferences
          </button>
        </Section>

        {/* Password */}
        <Section title="Change Password" icon={Lock} color="#E11D48">
          <div className="space-y-3">
            <PwField label="Current Password" field="current" />
            <PwField label="New Password" field="next" />
            <PwField label="Confirm New Password" field="confirm" />
            <button
              onClick={handlePasswordSave}
              disabled={savingPw}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black text-white disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #E11D48, #F43F5E)' }}
            >
              {savingPw ? 'Saving...' : <><Shield className="w-3.5 h-3.5" /> Update Password</>}
            </button>
          </div>
        </Section>

        {/* Account info */}
        <Section title="Account" icon={Settings}>
          <div className="space-y-2">
            {[
              { label: 'Role', value: 'Trainer' },
              { label: 'Account Type', value: 'Professional Educator' },
              { label: 'Profile Visibility', value: 'Public' },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                <span className="text-sm text-slate-600 font-semibold">{label}</span>
                <span className="text-xs font-black px-2 py-1 rounded-lg bg-[#003399]/5 text-[#003399]">{value}</span>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </TrainerDashboardLayout>
  );
};

export default TrainerSettings;