// src/pages/Student/Settings.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import DashboardLayout from '../components/layout/DashboardLayout';
import {
  Settings, Bell, Shield, Eye, Palette, Globe,
  Mail, MessageSquare, Briefcase, BookOpen,
  Moon, Sun, Monitor, Check, ChevronRight,
  LogOut, Trash2, AlertCircle, Lock, User,
  Smartphone, Volume2, VolumeX
} from 'lucide-react';

const Toggle = ({ checked, onChange }) => (
  <button
    onClick={() => onChange(!checked)}
    className={"relative w-11 h-6 rounded-full transition-all duration-200 flex-shrink-0 " + (checked ? 'bg-gradient-to-r from-blue-600 to-cyan-500' : 'bg-gray-200')}
  >
    <div className={"absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 " + (checked ? 'translate-x-5' : 'translate-x-0')} />
  </button>
);

const SettingRow = ({ icon: Icon, title, description, children, danger }) => (
  <div className={"flex items-center justify-between p-3.5 rounded-xl transition-all " + (danger ? 'hover:bg-red-50' : 'hover:bg-gray-50')}>
    <div className="flex items-center gap-3 flex-1 min-w-0">
      <div className={"w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 " + (danger ? 'bg-red-100' : 'bg-blue-50')}>
        <Icon className={"w-4 h-4 " + (danger ? 'text-red-500' : 'text-blue-600')} />
      </div>
      <div className="min-w-0">
        <p className={"text-sm font-medium " + (danger ? 'text-red-600' : 'text-gray-900')}>{title}</p>
        {description && <p className="text-xs text-gray-500 mt-0.5 truncate">{description}</p>}
      </div>
    </div>
    <div className="flex-shrink-0 ml-3">{children}</div>
  </div>
);

const SectionCard = ({ title, icon: Icon, children }) => (
  <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-md border border-white/60 overflow-hidden">
    <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
      <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center shadow-sm">
        <Icon className="w-4 h-4 text-white" />
      </div>
      <h2 className="font-bold text-gray-900 text-sm">{title}</h2>
    </div>
    <div className="p-2">{children}</div>
  </div>
);

const StudentSettings = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const toast = useToast();

  // Notification settings
  const [notifs, setNotifs] = useState({
    jobAlerts: true,
    courseUpdates: true,
    assessmentReminders: true,
    applicationStatus: true,
    emailDigest: false,
    smsAlerts: false,
    browserPush: true,
    marketingEmails: false,
  });

  // Privacy settings
  const [privacy, setPrivacy] = useState({
    profileVisible: true,
    showToRecruiters: true,
    showSkills: true,
    showEducation: true,
  });

  // Appearance
  const [theme, setTheme] = useState('system');

  // Account
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const setNotif = (key) => (val) => {
    setNotifs(prev => ({ ...prev, [key]: val }));
    toast.success('Preference Saved', `${key.replace(/([A-Z])/g, ' $1').trim()} ${val ? 'enabled' : 'disabled'}.`);
  };
  const setPriv = (key) => (val) => {
    setPrivacy(prev => ({ ...prev, [key]: val }));
    toast.success('Preference Saved', `Privacy setting updated.`);
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto pb-8 space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-11 h-11 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
            <Settings className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Settings</h1>
            <p className="text-xs text-gray-500">Manage your account preferences</p>
          </div>
        </div>

        {/* Account Info Banner */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 rounded-2xl p-5 text-white shadow-xl shadow-blue-500/20 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(to right,rgba(255,255,255,.1) 1px,transparent 1px),linear-gradient(to bottom,rgba(255,255,255,.1) 1px,transparent 1px)', backgroundSize: '20px 20px' }} />
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center font-bold text-lg">
                {user?.fullName ? user.fullName.substring(0, 2).toUpperCase() : 'U'}
              </div>
              <div>
                <p className="font-bold">{user?.fullName || user?.name || 'User'}</p>
                <p className="text-blue-100 text-sm">{user?.email}</p>
                <span className="mt-1 inline-block text-xs bg-white/20 px-2 py-0.5 rounded-full">Candidate</span>
              </div>
            </div>
            <button
              onClick={() => navigate('/profile/edit')}
              className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5"
            >
              <User className="w-3.5 h-3.5" /> Edit Profile
            </button>
          </div>
        </div>

        {/* Notifications */}
        <SectionCard title="Notification Preferences" icon={Bell}>
          <SettingRow icon={Briefcase} title="Job Alerts" description="New job matches for your profile">
            <Toggle checked={notifs.jobAlerts} onChange={setNotif('jobAlerts')} />
          </SettingRow>
          <SettingRow icon={BookOpen} title="Course Updates" description="Enrolled course announcements">
            <Toggle checked={notifs.courseUpdates} onChange={setNotif('courseUpdates')} />
          </SettingRow>
          <SettingRow icon={Bell} title="Assessment Reminders" description="Upcoming assessment nudges">
            <Toggle checked={notifs.assessmentReminders} onChange={setNotif('assessmentReminders')} />
          </SettingRow>
          <SettingRow icon={Check} title="Application Status" description="Shortlist and interview updates">
            <Toggle checked={notifs.applicationStatus} onChange={setNotif('applicationStatus')} />
          </SettingRow>

          {/* Divider */}
          <div className="my-1 mx-3 border-t border-gray-100" />

          <SettingRow icon={Mail} title="Email Digest" description="Weekly summary via email">
            <Toggle checked={notifs.emailDigest} onChange={setNotif('emailDigest')} />
          </SettingRow>
          <SettingRow icon={Smartphone} title="SMS Alerts" description="Critical updates via SMS">
            <Toggle checked={notifs.smsAlerts} onChange={setNotif('smsAlerts')} />
          </SettingRow>
          <SettingRow icon={Volume2} title="Browser Notifications" description="Push notifications in browser">
            <Toggle checked={notifs.browserPush} onChange={setNotif('browserPush')} />
          </SettingRow>
          <SettingRow icon={MessageSquare} title="Marketing Emails" description="News, offers and promotions">
            <Toggle checked={notifs.marketingEmails} onChange={setNotif('marketingEmails')} />
          </SettingRow>
        </SectionCard>

        {/* Privacy */}
        <SectionCard title="Privacy & Visibility" icon={Eye}>
          <SettingRow icon={Globe} title="Public Profile" description="Anyone with the link can view">
            <Toggle checked={privacy.profileVisible} onChange={setPriv('profileVisible')} />
          </SettingRow>
          <SettingRow icon={Briefcase} title="Visible to Recruiters" description="Appear in recruiter searches">
            <Toggle checked={privacy.showToRecruiters} onChange={setPriv('showToRecruiters')} />
          </SettingRow>
          <SettingRow icon={Shield} title="Show Skills Publicly" description="Display skills on your profile">
            <Toggle checked={privacy.showSkills} onChange={setPriv('showSkills')} />
          </SettingRow>
          <SettingRow icon={BookOpen} title="Show Education" description="Display education details publicly">
            <Toggle checked={privacy.showEducation} onChange={setPriv('showEducation')} />
          </SettingRow>
        </SectionCard>

        {/* Appearance */}
        <SectionCard title="Appearance" icon={Palette}>
          <div className="p-3">
            <p className="text-xs text-gray-500 mb-3 px-1">Choose your theme</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: 'light', icon: Sun, label: 'Light' },
                { key: 'dark', icon: Moon, label: 'Dark' },
                { key: 'system', icon: Monitor, label: 'System' },
              ].map(({ key, icon: Icon, label }) => (
                <button
                  key={key}
                  onClick={() => setTheme(key)}
                  className={"flex flex-col items-center gap-2 p-3 rounded-xl border transition-all " + (
                    theme === key
                      ? 'border-blue-400 bg-gradient-to-br from-blue-50 to-cyan-50 text-blue-700'
                      : 'border-gray-200 hover:border-blue-200 text-gray-600 hover:bg-gray-50'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-medium">{label}</span>
                  {theme === key && <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />}
                </button>
              ))}
            </div>
          </div>
        </SectionCard>

        {/* Security */}
        <SectionCard title="Security" icon={Shield}>
          <button
            onClick={() => navigate('/forgot-password')}
            className="w-full"
          >
            <SettingRow icon={Lock} title="Change Password" description="Update your account password">
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </SettingRow>
          </button>
        </SectionCard>

        {/* Account Actions */}
        <SectionCard title="Account" icon={User}>
          <SettingRow icon={LogOut} title="Sign Out" description="Sign out of your account" danger>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold rounded-lg transition-all"
            >
              Sign Out
            </button>
          </SettingRow>
          <SettingRow icon={Trash2} title="Delete Account" description="Permanently delete your data" danger>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold rounded-lg transition-all"
            >
              Delete
            </button>
          </SettingRow>
        </SectionCard>

        {/* Delete Confirm Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 text-center mb-2">Delete Account?</h3>
              <p className="text-sm text-gray-500 text-center mb-6">
                This will permanently delete your profile, applications, and all data. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    toast.info('Account Deletion', 'Please contact support to delete your account.');
                    setShowDeleteConfirm(false);
                  }}
                  className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 transition-all"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

export default StudentSettings;