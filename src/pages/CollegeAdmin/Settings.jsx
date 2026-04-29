// src/pages/CollegeAdmin/Settings.jsx
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

/* ── Components ── */
const Toggle = ({ checked, onChange }) => (
  <button type="button" onClick={() => onChange(!checked)}
    className={`relative inline-flex items-center w-9 h-5 rounded-full flex-shrink-0 transition-colors duration-200 focus:outline-none ${
      checked ? 'bg-[#003399]' : 'bg-gray-300 hover:bg-gray-400'}`}>
    <span className={`inline-block w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-200 ${checked ? 'translate-x-[18px]' : 'translate-x-[2px]'}`} />
  </button>
);

const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-lg shadow-sm border border-slate-100 ${className}`}>
    {children}
  </div>
);

const SHead = ({ icon: Icon, title, sub }) => (
  <div className="flex items-center gap-3 mb-5 border-b border-slate-100 pb-3">
    <div className="w-8 h-8 rounded-lg bg-[#003399]/5 flex items-center justify-center flex-shrink-0">
      <Icon className="w-4 h-4 text-[#003399]" />
    </div>
    <div>
      <h3 className="text-[16px] font-bold text-gray-900 leading-none">{title}</h3>
      {sub && <p className="text-[12px] text-gray-500 mt-1">{sub}</p>}
    </div>
  </div>
);

const Field = ({ label, required, children }) => (
  <div>
    <label className="block text-[13px] font-bold text-gray-700 mb-1.5">
      {label}{required && <span className="text-red-500 ml-1">*</span>}
    </label>
    {children}
  </div>
);

const inputCls = "w-full px-3 py-2.5 text-xs font-bold border border-slate-100 rounded-xl focus:outline-none focus:border-[#003399]/30 bg-white";

const ToggleRow = ({ label, checked, onChange }) => (
  <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0 hover:bg-slate-50/50 px-2 rounded-lg transition-colors">
    <span className="text-[13px] font-bold text-gray-700">{label}</span>
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
    { id:'profile',      label:'Profile',        icon:User          },
    { id:'security',     label:'Security',       icon:Lock          },
    { id:'notifications',label:'Notifications',  icon:Bell          },
    { id:'privacy',      label:'Privacy',        icon:Shield        },
    { id:'appearance',   label:'Appearance',     icon:Laptop        },
    { id:'account',      label:'Account',        icon:SettingsIcon  },
  ];

  return (
    <CollegeAdminLayout>
      <div className="px-6 py-4 md:px-8 md:py-6 space-y-5 font-sans">
        <div className="max-w-[1240px] mx-auto space-y-3 sm:space-y-4">

          {/* ═════════ HEADER ═════════ */}
          <div className="mb-4">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span className="w-2 h-8 bg-gradient-to-b from-[#003399] to-[#00A9CE] rounded-full inline-block flex-shrink-0" />
              Settings & <span className="text-[#003399]">Preferences</span>
            </h1>
            <p className="text-sm text-slate-400 mt-1 font-medium">
              Manage your account settings, privacy, and preferences.
            </p>
          </div>

          {/* Alert messages */}
          {success && (
            <div className="mb-4 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 flex items-center gap-2.5 shadow-sm">
              <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <p className="text-[13px] font-bold text-emerald-800">{success}</p>
            </div>
          )}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-100 rounded-xl px-4 py-3 flex items-center gap-2.5 shadow-sm">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-[13px] font-bold text-red-800">{error}</p>
            </div>
          )}

          <div className="flex flex-col md:flex-row gap-4">

            {/* Sidebar Navigation */}
            <div className="md:w-64 flex-shrink-0">
              <Card className="p-2 space-y-1">
                {tabs.map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                      className={`w-full px-4 py-3 rounded-lg flex items-center gap-3 transition-colors text-[13px] font-bold ${
                        activeTab === tab.id
                          ? 'bg-[#003399]/5 text-[#003399]'
                          : 'text-gray-600 hover:bg-slate-50 hover:text-gray-900'}`}>
                      <Icon className={`w-4 h-4 flex-shrink-0 ${activeTab === tab.id ? 'text-[#003399]' : 'text-slate-400'}`} />
                      {tab.label}
                    </button>
                  );
                })}
              </Card>
            </div>

            {/* Content Area */}
            <div className="flex-1">
              <Card className="p-5 md:p-6 min-h-[500px]">

                {/* ── Profile ── */}
                {activeTab === 'profile' && (
                  <div className="animate-in fade-in duration-300">
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
                      <div className="pt-4 border-t border-slate-100 flex justify-end">
                        <button type="submit" disabled={loading}
                          className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#003399] text-white text-[13px] font-bold rounded-lg hover:bg-[#003399] disabled:opacity-50 transition-colors shadow-sm">
                          <Save className="w-4 h-4" /> {loading ? 'Saving…' : 'Save Changes'}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* ── Security ── */}
                {activeTab === 'security' && (
                  <div className="animate-in fade-in duration-300">
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
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-gray-600 bg-white p-1 rounded-full">
                              {showPwd[key.replace('Password','').toLowerCase()||'current'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                          {hint && <p className="text-[11px] font-semibold text-slate-400 mt-1.5">{hint}</p>}
                        </Field>
                      ))}
                      <div className="pt-4 border-t border-slate-100">
                        <button type="submit" disabled={loading}
                          className="flex items-center gap-2 px-6 py-2.5 bg-[#003399] text-white text-[13px] font-bold rounded-lg hover:bg-[#003399] disabled:opacity-50 transition-colors shadow-sm w-full justify-center">
                          <Lock className="w-4 h-4" /> {loading ? 'Changing…' : 'Change Password'}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* ── Notifications ── */}
                {activeTab === 'notifications' && (
                  <div className="animate-in fade-in duration-300">
                    <SHead icon={Bell} title="Notification Preferences" sub="Control how you receive alerts" />
                    <div className="space-y-6">
                      
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Mail className="w-4 h-4 text-slate-400" />
                          <p className="text-[14px] font-bold text-gray-900">Email Notifications</p>
                        </div>
                        <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
                          {Object.entries(notifSettings.emailNotifications).map(([key, val]) => (
                            <ToggleRow key={key} label={key.replace(/([A-Z])/g,' $1').trim().replace(/^./, str => str.toUpperCase())}
                              checked={val} onChange={v => setNotifSettings(p => ({ ...p, emailNotifications:{ ...p.emailNotifications, [key]:v } }))} />
                          ))}
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Smartphone className="w-4 h-4 text-slate-400" />
                          <p className="text-[14px] font-bold text-gray-900">Push Notifications</p>
                        </div>
                        <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
                          {Object.entries(notifSettings.pushNotifications).map(([key, val]) => (
                            <ToggleRow key={key} label={key.replace(/([A-Z])/g,' $1').trim().replace(/^./, str => str.toUpperCase())}
                              checked={val} onChange={v => setNotifSettings(p => ({ ...p, pushNotifications:{ ...p.pushNotifications, [key]:v } }))} />
                          ))}
                        </div>
                      </div>

                      <div className="max-w-xs">
                        <Field label="Notification Frequency">
                          <select value={notifSettings.frequency}
                            onChange={e => setNotifSettings(p => ({ ...p, frequency:e.target.value }))}
                            className={inputCls}>
                            <option value="instant">Instant notifications</option>
                            <option value="daily">Daily summary</option>
                            <option value="weekly">Weekly digest</option>
                          </select>
                        </Field>
                      </div>

                      <div className="pt-4 border-t border-slate-100 flex justify-end">
                        <button onClick={() => handleSavePrefs('Notification preferences updated!')} disabled={loading}
                          className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#003399] text-white text-[13px] font-bold rounded-lg hover:bg-[#003399] disabled:opacity-50 transition-colors shadow-sm">
                          <Save className="w-4 h-4" /> {loading ? 'Saving…' : 'Save Preferences'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Privacy ── */}
                {activeTab === 'privacy' && (
                  <div className="animate-in fade-in duration-300">
                    <SHead icon={Shield} title="Privacy & Data" sub="Control who can see your information" />
                    <div className="space-y-6">
                      <div className="max-w-xs">
                        <Field label="Profile Visibility">
                          <select value={privacySettings.profileVisibility}
                            onChange={e => setPrivacySettings(p => ({ ...p, profileVisibility:e.target.value }))}
                            className={inputCls}>
                            <option value="public">Public - visible to everyone</option>
                            <option value="connections">Private - visible to connections</option>
                            <option value="private">Hidden</option>
                          </select>
                        </Field>
                      </div>

                      <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
                        {[
                          { key:'showEmail',       label:'Show Email Address publicly' },
                          { key:'showPhone',       label:'Show Phone Number publicly' },
                          { key:'allowSearch',     label:'Allow Search Engines to index profile' },
                          { key:'shareActivity',   label:'Share Activity with network' },
                          { key:'dataCollection',  label:'Allow Analytics Data Collection' },
                        ].map(({ key, label }) => (
                          <ToggleRow key={key} label={label}
                            checked={privacySettings[key]}
                            onChange={v => setPrivacySettings(p => ({ ...p, [key]:v }))} />
                        ))}
                      </div>

                      <div className="pt-4 border-t border-slate-100 flex justify-end">
                        <button onClick={() => handleSavePrefs('Privacy settings updated!')} disabled={loading}
                          className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#003399] text-white text-[13px] font-bold rounded-lg hover:bg-[#003399] disabled:opacity-50 transition-colors shadow-sm">
                          <Save className="w-4 h-4" /> {loading ? 'Saving…' : 'Save Privacy Options'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Appearance ── */}
                {activeTab === 'appearance' && (
                  <div className="animate-in fade-in duration-300">
                    <SHead icon={Laptop} title="Appearance" sub="Customize how the portal looks" />
                    <div className="space-y-6">
                      
                      <div>
                        <p className="text-[13px] font-bold text-gray-700 mb-3">Theme Mode</p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {[{ value:'light', icon:Sun, label:'Light Mode' }, { value:'dark', icon:Moon, label:'Dark Mode' }, { value:'auto', icon:Laptop, label:'System Auto' }].map(({ value, icon:Icon, label }) => (
                            <button key={value} onClick={() => setThemeSettings(p => ({ ...p, mode:value }))}
                              className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                                themeSettings.mode === value
                                  ? 'border-[#003399] bg-[#003399]/5'
                                  : 'border-gray-100 hover:border-gray-200'}`}>
                              <Icon className={`w-6 h-6 ${themeSettings.mode === value ? 'text-[#003399]' : 'text-slate-400'}`} />
                              <p className={`text-[13px] font-bold ${themeSettings.mode === value ? 'text-[#003399]' : 'text-gray-700'}`}>{label}</p>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="max-w-xs">
                        <Field label="Font Size">
                          <select value={themeSettings.fontSize}
                            onChange={e => setThemeSettings(p => ({ ...p, fontSize:e.target.value }))}
                            className={inputCls}>
                            <option value="small">Small (Compact)</option>
                            <option value="medium">Medium (Recommended)</option>
                            <option value="large">Large (Accessible)</option>
                          </select>
                        </Field>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <span className="text-[13px] font-bold text-gray-900 block">Compact Mode</span>
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Reduce spacing and margins</span>
                        </div>
                        <Toggle checked={themeSettings.compactMode} onChange={v => setThemeSettings(p => ({ ...p, compactMode:v }))} />
                      </div>

                      <div className="pt-4 border-t border-slate-100 flex justify-end">
                        <button onClick={() => handleSavePrefs('Appearance settings saved!')}
                          className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#003399] text-white text-[13px] font-bold rounded-lg hover:bg-[#003399] transition-colors shadow-sm">
                          <Save className="w-4 h-4" /> Save Appearance
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Account ── */}
                {activeTab === 'account' && (
                  <div className="animate-in fade-in duration-300">
                    <SHead icon={SettingsIcon} title="Account Management" sub="Manage your account data and access" />
                    <div className="space-y-4 pt-2">
                      <div className="flex items-start md:items-center justify-between gap-4 p-4 border border-slate-100 rounded-xl hover:bg-slate-50/30 transition-colors flex-col md:flex-row">
                        <div>
                          <p className="text-[14px] font-bold text-gray-900 mb-1">Export Your Data</p>
                          <p className="text-[12px] text-gray-500 max-w-md">Download a copy of your account data including profile, settings, and activity history.</p>
                        </div>
                        <button onClick={handleExportData} disabled={loading}
                          className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-[12px] font-bold rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 shadow-sm w-full md:w-auto">
                          <Download className="w-4 h-4" /> {loading ? 'Exporting…' : 'Export Data'}
                        </button>
                      </div>

                      <div className="flex items-start md:items-center justify-between gap-4 p-4 border border-amber-100 bg-amber-50 rounded-xl flex-col md:flex-row">
                        <div>
                          <p className="text-[14px] font-bold text-amber-900 mb-1">Logout All Devices</p>
                          <p className="text-[12px] text-amber-700 max-w-md">Sign out from all other active sessions and devices except this one.</p>
                        </div>
                        <button onClick={() => { if (confirm('Log out from all other devices?')) toast_('Logged out from all other devices!'); }}
                          className="px-4 py-2 bg-amber-500 text-white text-[12px] font-bold rounded-lg hover:bg-amber-600 transition-colors shadow-sm w-full md:w-auto">
                          Logout All Devices
                        </button>
                      </div>

                      <div className="flex items-start md:items-center justify-between gap-4 p-4 border border-red-100 bg-red-50 rounded-xl flex-col md:flex-row mt-4">
                        <div>
                          <p className="text-[14px] font-bold text-red-900 mb-1">Delete Account</p>
                          <p className="text-[12px] text-red-700 max-w-md">Permanently delete your account and all associated data. This action cannot be undone.</p>
                        </div>
                        <button onClick={handleDeleteAccount} disabled={loading}
                          className="px-4 py-2 bg-red-600 text-white text-[12px] font-bold rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors shadow-sm w-full md:w-auto flex items-center justify-center gap-2">
                          <UserX className="w-4 h-4" /> {loading ? 'Deleting…' : 'Delete Account'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

              </Card>
            </div>

          </div>
        </div>
      </div>
    </CollegeAdminLayout>
  );
};

export default Settings;