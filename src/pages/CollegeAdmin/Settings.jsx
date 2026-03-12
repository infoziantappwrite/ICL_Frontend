// pages/CollegeAdmin/Settings.jsx
import { useToast } from '../../context/ToastContext';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Settings as SettingsIcon, User, Lock, Bell, Shield, Eye, EyeOff,
  Mail, Phone, MapPin, Save, AlertCircle, CheckCircle, Building2,
  Globe, Moon, Sun, Laptop, Smartphone, Download, Trash2, LogOut, UserX,
} from 'lucide-react';
import CollegeAdminLayout from '../../components/layout/CollegeAdminLayout';
import { useAuth } from '../../context/AuthContext';

/* ── Reusable toggle switch ── */
const Toggle = ({ checked, onChange }) => (
  <button type="button" onClick={() => onChange(!checked)}
    className={`relative inline-flex items-center w-9 h-5 rounded-full flex-shrink-0 transition-colors duration-200 focus:outline-none ${
      checked ? 'bg-gradient-to-r from-blue-500 to-cyan-400' : 'bg-gray-300 hover:bg-gray-400'}`}>
    <span className={`inline-block w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-200 ${checked ? 'translate-x-[18px]' : 'translate-x-[2px]'}`} />
  </button>
);

/* ── Section heading inside card ── */
const SHead = ({ icon: Icon, title, sub }) => (
  <div className="flex items-center gap-2 mb-5">
    <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0">
      <Icon className="w-3 h-3 text-white" />
    </div>
    <div>
      <h3 className="text-sm font-bold text-gray-800 leading-none">{title}</h3>
      {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

/* ── Input field ── */
const Field = ({ label, required, children }) => (
  <div>
    <label className="block text-xs font-bold text-gray-700 mb-1.5">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
  </div>
);

const inputCls = "w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white";

/* ── Toggle row ── */
const ToggleRow = ({ label, checked, onChange }) => (
  <div className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
    <span className="text-sm text-gray-700">{label}</span>
    <Toggle checked={checked} onChange={onChange} />
  </div>
);

const Settings = () => {
  const toast    = useToast();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading,   setLoading]   = useState(false);
  const [success,   setSuccess]   = useState('');
  const [error,     setError]     = useState('');

  const [profileData, setProfileData] = useState({
    fullName: user?.fullName || '', email: user?.email || '', phone: user?.phone || '',
    organization: user?.organization || '', designation: user?.designation || '',
    location: user?.location || '', bio: user?.bio || '',
  });

  const [passwordData, setPasswordData] = useState({ currentPassword:'', newPassword:'', confirmPassword:'' });
  const [showPwd, setShowPwd] = useState({ current:false, new:false, confirm:false });

  const [notifSettings, setNotifSettings] = useState({
    emailNotifications:{ jobAlerts:true, applicationUpdates:true, interviewReminders:true, deadlineAlerts:true, systemUpdates:false, newsletter:false },
    pushNotifications:{ jobAlerts:true, applicationUpdates:true, interviewReminders:true, messages:true },
    frequency:'instant',
  });

  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility:'public', showEmail:false, showPhone:false,
    allowSearch:true, shareActivity:true, dataCollection:true,
  });

  const [themeSettings, setThemeSettings] = useState({ mode:'light', fontSize:'medium', compactMode:false });

  const toast_ = (msg) => { setSuccess(msg); toast.success('Success', msg); setTimeout(() => setSuccess(''), 3000); };
  const errMsg  = (msg) => { setError(msg);   toast.error('Error', msg); };

  const handleProfileUpdate = async (e) => {
    e.preventDefault(); setLoading(true); setError(''); setSuccess('');
    try { await new Promise(r => setTimeout(r,1000)); toast_('Profile updated successfully!'); }
    catch { errMsg('Failed to update profile.'); } finally { setLoading(false); }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault(); setLoading(true); setError(''); setSuccess('');
    if (passwordData.newPassword !== passwordData.confirmPassword) { errMsg('Passwords do not match!'); setLoading(false); return; }
    if (passwordData.newPassword.length < 8) { errMsg('Password must be at least 8 characters!'); setLoading(false); return; }
    try {
      await new Promise(r => setTimeout(r,1000));
      toast_('Password changed successfully!');
      setPasswordData({ currentPassword:'', newPassword:'', confirmPassword:'' });
    } catch { errMsg('Failed to change password.'); } finally { setLoading(false); }
  };

  const handleSavePrefs = async (msg) => {
    setLoading(true); setError(''); setSuccess('');
    try { await new Promise(r => setTimeout(r,800)); toast_(msg); }
    catch { errMsg('Failed to save settings.'); } finally { setLoading(false); }
  };

  const handleExportData = async () => {
    setLoading(true);
    try {
      await new Promise(r => setTimeout(r,1500));
      const blob = new Blob([JSON.stringify({ user:profileData, exportDate:new Date().toISOString() }, null, 2)], { type:'application/json' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
      a.download = `user-data-${Date.now()}.json`; a.click();
      toast_('Data exported successfully!');
    } catch { errMsg('Failed to export data.'); } finally { setLoading(false); }
  };

  const handleDeleteAccount = async () => {
    const c = prompt('Type "DELETE" to confirm account deletion:');
    if (c !== 'DELETE') return;
    try { setLoading(true); await new Promise(r => setTimeout(r,1500)); toast.success('Deleted','Account deleted.'); logout(); navigate('/login'); }
    catch { errMsg('Failed to delete account. Contact support.'); setLoading(false); }
  };

  const tabs = [
    { id:'profile',      label:'Profile',       icon:User          },
    { id:'security',     label:'Security',       icon:Lock          },
    { id:'notifications',label:'Notifications',  icon:Bell          },
    { id:'privacy',      label:'Privacy',        icon:Shield        },
    { id:'appearance',   label:'Appearance',     icon:Laptop        },
    { id:'account',      label:'Account',        icon:SettingsIcon  },
  ];

  return (
    <CollegeAdminLayout>

      {/* Hero */}
      <div className="relative bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 rounded-2xl px-5 py-4 mb-4 shadow-xl shadow-blue-500/20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-10 -right-10 w-44 h-44 bg-white/10 rounded-full" />
          <div className="absolute -bottom-8 left-1/3 w-28 h-28 bg-white/10 rounded-full" />
          <div className="absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage:'radial-gradient(circle,white 1px,transparent 1px)', backgroundSize:'18px 18px' }} />
        </div>
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <SettingsIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-white font-black text-lg leading-tight">Settings & Preferences</h1>
            <p className="text-blue-200 text-[11px] mt-0.5">Manage your account settings and preferences</p>
          </div>
        </div>
      </div>

      {/* Alert messages */}
      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center gap-2.5">
          <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
          <p className="text-sm font-semibold text-green-700">{success}</p>
        </div>
      )}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <p className="text-sm font-semibold text-red-700">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-2 space-y-1">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`w-full px-3 py-2.5 rounded-xl flex items-center gap-3 transition-all text-sm font-semibold ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-50'}`}>
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-5">

            {/* ── Profile ── */}
            {activeTab === 'profile' && (
              <div>
                <SHead icon={User} title="Profile Information" sub="Update your personal details" />
                <form onSubmit={handleProfileUpdate} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { label:'Full Name',    key:'fullName',     type:'text',  required:true  },
                      { label:'Email Address',key:'email',        type:'email', required:true  },
                      { label:'Phone Number', key:'phone',        type:'tel'                   },
                      { label:'Organization', key:'organization', type:'text'                   },
                      { label:'Designation',  key:'designation',  type:'text'                   },
                      { label:'Location',     key:'location',     type:'text'                   },
                    ].map(({ label, key, type, required }) => (
                      <Field key={key} label={label} required={required}>
                        <input type={type} value={profileData[key]} required={required}
                          onChange={e => setProfileData({ ...profileData, [key]: e.target.value })}
                          className={inputCls} />
                      </Field>
                    ))}
                  </div>
                  <Field label="Bio">
                    <textarea value={profileData.bio} rows={3} placeholder="Tell us about yourself…"
                      onChange={e => setProfileData({ ...profileData, bio: e.target.value })}
                      className={inputCls} />
                  </Field>
                  <div className="pt-2">
                    <button type="submit" disabled={loading}
                      className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-sm font-bold rounded-xl hover:opacity-90 disabled:opacity-50 transition-all shadow-sm">
                      <Save className="w-4 h-4" /> {loading ? 'Saving…' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ── Security ── */}
            {activeTab === 'security' && (
              <div>
                <SHead icon={Lock} title="Security Settings" sub="Change your password" />
                <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                  {[
                    { label:'Current Password', key:'currentPassword' },
                    { label:'New Password',      key:'newPassword',     hint:'At least 8 characters' },
                    { label:'Confirm Password',  key:'confirmPassword' },
                  ].map(({ label, key, hint }) => (
                    <Field key={key} label={label} required>
                      <div className="relative">
                        <input type={showPwd[key.replace('Password','').toLowerCase()||'current'] ? 'text' : 'password'}
                          value={passwordData[key]} required
                          onChange={e => setPasswordData({ ...passwordData, [key]: e.target.value })}
                          className={`${inputCls} pr-10`} />
                        <button type="button"
                          onClick={() => setShowPwd(p => ({ ...p, [key.replace('Password','').toLowerCase()||'current']: !p[key.replace('Password','').toLowerCase()||'current'] }))}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                          {showPwd[key.replace('Password','').toLowerCase()||'current'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
                    </Field>
                  ))}
                  <button type="submit" disabled={loading}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-sm font-bold rounded-xl hover:opacity-90 disabled:opacity-50 transition-all shadow-sm">
                    <Lock className="w-4 h-4" /> {loading ? 'Changing…' : 'Change Password'}
                  </button>
                </form>
              </div>
            )}

            {/* ── Notifications ── */}
            {activeTab === 'notifications' && (
              <div>
                <SHead icon={Bell} title="Notification Preferences" sub="Control how you receive alerts" />
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Mail className="w-4 h-4 text-blue-600" />
                      <p className="text-sm font-bold text-gray-800">Email Notifications</p>
                    </div>
                    {Object.entries(notifSettings.emailNotifications).map(([key, val]) => (
                      <ToggleRow key={key} label={key.replace(/([A-Z])/g,' $1').trim()}
                        checked={val}
                        onChange={v => setNotifSettings(p => ({ ...p, emailNotifications:{ ...p.emailNotifications, [key]:v } }))} />
                    ))}
                  </div>
                  <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Bell className="w-4 h-4 text-blue-600" />
                      <p className="text-sm font-bold text-gray-800">Push Notifications</p>
                    </div>
                    {Object.entries(notifSettings.pushNotifications).map(([key, val]) => (
                      <ToggleRow key={key} label={key.replace(/([A-Z])/g,' $1').trim()}
                        checked={val}
                        onChange={v => setNotifSettings(p => ({ ...p, pushNotifications:{ ...p.pushNotifications, [key]:v } }))} />
                    ))}
                  </div>
                  <Field label="Notification Frequency">
                    <select value={notifSettings.frequency}
                      onChange={e => setNotifSettings(p => ({ ...p, frequency:e.target.value }))}
                      className={inputCls}>
                      <option value="instant">Instant</option>
                      <option value="daily">Daily Digest</option>
                      <option value="weekly">Weekly Summary</option>
                    </select>
                  </Field>
                  <button onClick={() => handleSavePrefs('Notification preferences updated!')} disabled={loading}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-sm font-bold rounded-xl hover:opacity-90 disabled:opacity-50 transition-all shadow-sm">
                    <Save className="w-4 h-4" /> {loading ? 'Saving…' : 'Save Preferences'}
                  </button>
                </div>
              </div>
            )}

            {/* ── Privacy ── */}
            {activeTab === 'privacy' && (
              <div>
                <SHead icon={Shield} title="Privacy & Data" sub="Control who can see your information" />
                <div className="space-y-4">
                  <Field label="Profile Visibility">
                    <select value={privacySettings.profileVisibility}
                      onChange={e => setPrivacySettings(p => ({ ...p, profileVisibility:e.target.value }))}
                      className={inputCls}>
                      <option value="public">Public</option>
                      <option value="connections">Connections Only</option>
                      <option value="private">Private</option>
                    </select>
                  </Field>
                  <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
                    {[
                      { key:'showEmail',       label:'Show Email Address' },
                      { key:'showPhone',       label:'Show Phone Number' },
                      { key:'allowSearch',     label:'Allow Search Engines' },
                      { key:'shareActivity',   label:'Share Activity' },
                      { key:'dataCollection',  label:'Allow Analytics Data Collection' },
                    ].map(({ key, label }) => (
                      <ToggleRow key={key} label={label}
                        checked={privacySettings[key]}
                        onChange={v => setPrivacySettings(p => ({ ...p, [key]:v }))} />
                    ))}
                  </div>
                  <button onClick={() => handleSavePrefs('Privacy settings updated!')} disabled={loading}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-sm font-bold rounded-xl hover:opacity-90 disabled:opacity-50 transition-all shadow-sm">
                    <Save className="w-4 h-4" /> {loading ? 'Saving…' : 'Save Privacy Settings'}
                  </button>
                </div>
              </div>
            )}

            {/* ── Appearance ── */}
            {activeTab === 'appearance' && (
              <div>
                <SHead icon={Laptop} title="Appearance" sub="Customize how the portal looks" />
                <div className="space-y-5">
                  <div>
                    <p className="text-xs font-bold text-gray-700 mb-3">Theme Mode</p>
                    <div className="grid grid-cols-3 gap-3">
                      {[{ value:'light', icon:Sun, label:'Light' }, { value:'dark', icon:Moon, label:'Dark' }, { value:'auto', icon:Laptop, label:'Auto' }].map(({ value, icon:Icon, label }) => (
                        <button key={value} onClick={() => setThemeSettings(p => ({ ...p, mode:value }))}
                          className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                            themeSettings.mode === value
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'}`}>
                          <Icon className={`w-6 h-6 ${themeSettings.mode === value ? 'text-blue-600' : 'text-gray-400'}`} />
                          <p className={`text-xs font-semibold ${themeSettings.mode === value ? 'text-blue-600' : 'text-gray-600'}`}>{label}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                  <Field label="Font Size">
                    <select value={themeSettings.fontSize}
                      onChange={e => setThemeSettings(p => ({ ...p, fontSize:e.target.value }))}
                      className={inputCls}>
                      <option value="small">Small</option>
                      <option value="medium">Medium</option>
                      <option value="large">Large</option>
                    </select>
                  </Field>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-sm font-medium text-gray-700">Compact Mode</span>
                    <Toggle checked={themeSettings.compactMode} onChange={v => setThemeSettings(p => ({ ...p, compactMode:v }))} />
                  </div>
                  <button onClick={() => handleSavePrefs('Appearance settings saved!')}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-sm font-bold rounded-xl hover:opacity-90 transition-all shadow-sm">
                    <Save className="w-4 h-4" /> Save Appearance
                  </button>
                </div>
              </div>
            )}

            {/* ── Account ── */}
            {activeTab === 'account' && (
              <div>
                <SHead icon={SettingsIcon} title="Account Management" sub="Manage your account data and access" />
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Download className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-gray-900 mb-1">Export Your Data</p>
                      <p className="text-xs text-gray-500 mb-3">Download a copy of your account data including profile and settings.</p>
                      <button onClick={handleExportData} disabled={loading}
                        className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                        {loading ? 'Exporting…' : 'Export Data'}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 bg-amber-50 rounded-xl border border-amber-100">
                    <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Smartphone className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-gray-900 mb-1">Logout All Devices</p>
                      <p className="text-xs text-gray-500 mb-3">Sign out from all devices except this one for security.</p>
                      <button onClick={() => { if (confirm('Log out from all other devices?')) toast_('Logged out from all other devices!'); }}
                        className="px-4 py-2 bg-amber-500 text-white text-xs font-bold rounded-lg hover:bg-amber-600 transition-colors">
                        Logout All Devices
                      </button>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 bg-red-50 rounded-xl border border-red-100">
                    <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <UserX className="w-5 h-5 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-gray-900 mb-1">Delete Account</p>
                      <p className="text-xs text-gray-500 mb-3">Permanently delete your account and all associated data. This cannot be undone.</p>
                      <button onClick={handleDeleteAccount} disabled={loading}
                        className="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors">
                        {loading ? 'Deleting…' : 'Delete Account'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

    </CollegeAdminLayout>
  );
};

export default Settings;