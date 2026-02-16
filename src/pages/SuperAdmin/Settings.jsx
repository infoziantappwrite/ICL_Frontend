// pages/Settings.jsx - Comprehensive Settings & Preferences
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Settings as SettingsIcon,
  User,
  Lock,
  Bell,
  Shield,
  Eye,
  EyeOff,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Save,
  Check,
  X,
  AlertCircle,
  CheckCircle,
  Building2,
  Briefcase,
  Globe,
  Moon,
  Sun,
  Laptop,
  Smartphone,
  Download,
  Trash2,
  LogOut,
  UserX,
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../context/AuthContext';

const Settings = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Profile Settings
  const [profileData, setProfileData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    organization: user?.organization || '',
    designation: user?.designation || '',
    location: user?.location || '',
    bio: user?.bio || '',
  });

  // Password Settings
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: {
      jobAlerts: true,
      applicationUpdates: true,
      interviewReminders: true,
      deadlineAlerts: true,
      systemUpdates: false,
      newsletter: false,
    },
    pushNotifications: {
      jobAlerts: true,
      applicationUpdates: true,
      interviewReminders: true,
      messages: true,
    },
    frequency: 'instant', // instant, daily, weekly
  });

  // Privacy Settings
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'public', // public, connections, private
    showEmail: false,
    showPhone: false,
    allowSearch: true,
    shareActivity: true,
    dataCollection: true,
  });

  // Theme Settings
  const [themeSettings, setThemeSettings] = useState({
    mode: 'light', // light, dark, auto
    fontSize: 'medium', // small, medium, large
    compactMode: false,
  });

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      // TODO: Replace with actual API call
      // await userAPI.updateProfile(profileData);
      
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match!');
      setLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setError('Password must be at least 8 characters long!');
      setLoading(false);
      return;
    }

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      // TODO: Replace with actual API call
      // await userAPI.changePassword(passwordData);
      
      setSuccess('Password changed successfully!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to change password. Please check your current password.');
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationUpdate = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 800));
      // TODO: Replace with actual API call
      // await userAPI.updateNotificationSettings(notificationSettings);
      
      setSuccess('Notification preferences updated!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to update notification settings.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrivacyUpdate = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 800));
      // TODO: Replace with actual API call
      // await userAPI.updatePrivacySettings(privacySettings);
      
      setSuccess('Privacy settings updated!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to update privacy settings.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async () => {
    try {
      setLoading(true);
      // Simulate data export
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      // Create mock data export
      const exportData = {
        user: profileData,
        notifications: notificationSettings,
        privacy: privacySettings,
        exportDate: new Date().toISOString(),
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `user-data-${Date.now()}.json`;
      a.click();
      
      setSuccess('Data exported successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to export data.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmation = prompt(
      'This action is irreversible. Type "DELETE" to confirm account deletion:'
    );
    
    if (confirmation !== 'DELETE') {
      return;
    }

    try {
      setLoading(true);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      // TODO: Replace with actual API call
      // await userAPI.deleteAccount();
      
      alert('Account deleted successfully. You will be logged out.');
      logout();
      navigate('/login');
    } catch (err) {
      setError('Failed to delete account. Please contact support.');
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Laptop },
    { id: 'account', label: 'Account', icon: SettingsIcon },
  ];

  return (
    <DashboardLayout title="Settings">
      {/* Header */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-indigo-600 via-purple-500 to-pink-500 rounded-3xl p-8 shadow-2xl shadow-purple-500/30">
          <div className="text-white">
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <SettingsIcon className="w-8 h-8" />
              Settings & Preferences
            </h1>
            <p className="text-purple-100 text-lg">
              Manage your account settings and preferences
            </p>
          </div>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <p className="text-green-700 font-medium">{success}</p>
        </div>
      )}

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Tabs */}
        <div className="lg:col-span-1">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 p-4 space-y-2">
            {tabs.map((tab) => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full px-4 py-3 rounded-xl flex items-center gap-3 transition-all ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <TabIcon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 p-8">
            {/* Profile Settings */}
            {activeTab === 'profile' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Profile Information
                </h2>
                <form onSubmit={handleProfileUpdate} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        value={profileData.fullName}
                        onChange={(e) =>
                          setProfileData({ ...profileData, fullName: e.target.value })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        value={profileData.email}
                        onChange={(e) =>
                          setProfileData({ ...profileData, email: e.target.value })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) =>
                          setProfileData({ ...profileData, phone: e.target.value })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Organization
                      </label>
                      <input
                        type="text"
                        value={profileData.organization}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            organization: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Designation
                      </label>
                      <input
                        type="text"
                        value={profileData.designation}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            designation: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Location
                      </label>
                      <input
                        type="text"
                        value={profileData.location}
                        onChange={(e) =>
                          setProfileData({ ...profileData, location: e.target.value })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bio
                    </label>
                    <textarea
                      value={profileData.bio}
                      onChange={(e) =>
                        setProfileData({ ...profileData, bio: e.target.value })
                      }
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Tell us about yourself..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg disabled:opacity-50"
                  >
                    <Save className="w-5 h-5" />
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </form>
              </div>
            )}

            {/* Security Settings */}
            {activeTab === 'security' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Security Settings
                </h2>
                <form onSubmit={handlePasswordChange} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword.current ? 'text' : 'password'}
                        value={passwordData.currentPassword}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            currentPassword: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent pr-12"
                        required
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowPassword({
                            ...showPassword,
                            current: !showPassword.current,
                          })
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                      >
                        {showPassword.current ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword.new ? 'text' : 'password'}
                        value={passwordData.newPassword}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            newPassword: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent pr-12"
                        required
                        minLength={8}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowPassword({ ...showPassword, new: !showPassword.new })
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                      >
                        {showPassword.new ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Password must be at least 8 characters long
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm New Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword.confirm ? 'text' : 'password'}
                        value={passwordData.confirmPassword}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            confirmPassword: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent pr-12"
                        required
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowPassword({
                            ...showPassword,
                            confirm: !showPassword.confirm,
                          })
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                      >
                        {showPassword.confirm ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg disabled:opacity-50"
                  >
                    <Lock className="w-5 h-5" />
                    {loading ? 'Changing...' : 'Change Password'}
                  </button>
                </form>
              </div>
            )}

            {/* Notification Settings */}
            {activeTab === 'notifications' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Notification Preferences
                </h2>

                <div className="space-y-8">
                  {/* Email Notifications */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Mail className="w-5 h-5 text-indigo-600" />
                      Email Notifications
                    </h3>
                    <div className="space-y-3">
                      {Object.entries(notificationSettings.emailNotifications).map(
                        ([key, value]) => (
                          <label
                            key={key}
                            className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                          >
                            <span className="text-gray-700 font-medium capitalize">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                            <input
                              type="checkbox"
                              checked={value}
                              onChange={(e) =>
                                setNotificationSettings({
                                  ...notificationSettings,
                                  emailNotifications: {
                                    ...notificationSettings.emailNotifications,
                                    [key]: e.target.checked,
                                  },
                                })
                              }
                              className="w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                            />
                          </label>
                        )
                      )}
                    </div>
                  </div>

                  {/* Push Notifications */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Bell className="w-5 h-5 text-indigo-600" />
                      Push Notifications
                    </h3>
                    <div className="space-y-3">
                      {Object.entries(notificationSettings.pushNotifications).map(
                        ([key, value]) => (
                          <label
                            key={key}
                            className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                          >
                            <span className="text-gray-700 font-medium capitalize">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                            <input
                              type="checkbox"
                              checked={value}
                              onChange={(e) =>
                                setNotificationSettings({
                                  ...notificationSettings,
                                  pushNotifications: {
                                    ...notificationSettings.pushNotifications,
                                    [key]: e.target.checked,
                                  },
                                })
                              }
                              className="w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                            />
                          </label>
                        )
                      )}
                    </div>
                  </div>

                  {/* Notification Frequency */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Notification Frequency
                    </h3>
                    <select
                      value={notificationSettings.frequency}
                      onChange={(e) =>
                        setNotificationSettings({
                          ...notificationSettings,
                          frequency: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="instant">Instant</option>
                      <option value="daily">Daily Digest</option>
                      <option value="weekly">Weekly Summary</option>
                    </select>
                  </div>

                  <button
                    onClick={handleNotificationUpdate}
                    disabled={loading}
                    className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg disabled:opacity-50"
                  >
                    <Save className="w-5 h-5" />
                    {loading ? 'Saving...' : 'Save Preferences'}
                  </button>
                </div>
              </div>
            )}

            {/* Privacy Settings */}
            {activeTab === 'privacy' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Privacy & Data Settings
                </h2>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Profile Visibility
                    </label>
                    <select
                      value={privacySettings.profileVisibility}
                      onChange={(e) =>
                        setPrivacySettings({
                          ...privacySettings,
                          profileVisibility: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="public">Public</option>
                      <option value="connections">Connections Only</option>
                      <option value="private">Private</option>
                    </select>
                  </div>

                  <div className="space-y-3">
                    {[
                      { key: 'showEmail', label: 'Show Email Address' },
                      { key: 'showPhone', label: 'Show Phone Number' },
                      { key: 'allowSearch', label: 'Allow Search Engines' },
                      { key: 'shareActivity', label: 'Share Activity' },
                      { key: 'dataCollection', label: 'Allow Data Collection for Analytics' },
                    ].map(({ key, label }) => (
                      <label
                        key={key}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                      >
                        <span className="text-gray-700 font-medium">{label}</span>
                        <input
                          type="checkbox"
                          checked={privacySettings[key]}
                          onChange={(e) =>
                            setPrivacySettings({
                              ...privacySettings,
                              [key]: e.target.checked,
                            })
                          }
                          className="w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                        />
                      </label>
                    ))}
                  </div>

                  <button
                    onClick={handlePrivacyUpdate}
                    disabled={loading}
                    className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg disabled:opacity-50"
                  >
                    <Save className="w-5 h-5" />
                    {loading ? 'Saving...' : 'Save Privacy Settings'}
                  </button>
                </div>
              </div>
            )}

            {/* Appearance Settings */}
            {activeTab === 'appearance' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Appearance Settings
                </h2>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-4">
                      Theme Mode
                    </label>
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { value: 'light', icon: Sun, label: 'Light' },
                        { value: 'dark', icon: Moon, label: 'Dark' },
                        { value: 'auto', icon: Laptop, label: 'Auto' },
                      ].map(({ value, icon: Icon, label }) => (
                        <button
                          key={value}
                          onClick={() =>
                            setThemeSettings({ ...themeSettings, mode: value })
                          }
                          className={`p-4 rounded-xl border-2 transition-all ${
                            themeSettings.mode === value
                              ? 'border-indigo-600 bg-indigo-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <Icon
                            className={`w-8 h-8 mx-auto mb-2 ${
                              themeSettings.mode === value
                                ? 'text-indigo-600'
                                : 'text-gray-400'
                            }`}
                          />
                          <p
                            className={`text-sm font-medium ${
                              themeSettings.mode === value
                                ? 'text-indigo-600'
                                : 'text-gray-700'
                            }`}
                          >
                            {label}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Font Size
                    </label>
                    <select
                      value={themeSettings.fontSize}
                      onChange={(e) =>
                        setThemeSettings({ ...themeSettings, fontSize: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="small">Small</option>
                      <option value="medium">Medium</option>
                      <option value="large">Large</option>
                    </select>
                  </div>

                  <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer">
                    <span className="text-gray-700 font-medium">Compact Mode</span>
                    <input
                      type="checkbox"
                      checked={themeSettings.compactMode}
                      onChange={(e) =>
                        setThemeSettings({
                          ...themeSettings,
                          compactMode: e.target.checked,
                        })
                      }
                      className="w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                    />
                  </label>

                  <button
                    onClick={() => {
                      setSuccess('Appearance settings saved!');
                      setTimeout(() => setSuccess(''), 3000);
                    }}
                    className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg"
                  >
                    <Save className="w-5 h-5" />
                    Save Appearance
                  </button>
                </div>
              </div>
            )}

            {/* Account Management */}
            {activeTab === 'account' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Account Management
                </h2>

                <div className="space-y-6">
                  {/* Export Data */}
                  <div className="p-6 bg-blue-50 rounded-xl border border-blue-200">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Download className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          Export Your Data
                        </h3>
                        <p className="text-gray-600 mb-4">
                          Download a copy of your account data including profile,
                          settings, and activity.
                        </p>
                        <button
                          onClick={handleExportData}
                          disabled={loading}
                          className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                        >
                          {loading ? 'Exporting...' : 'Export Data'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Logout All Devices */}
                  <div className="p-6 bg-yellow-50 rounded-xl border border-yellow-200">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Smartphone className="w-6 h-6 text-yellow-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          Logout All Devices
                        </h3>
                        <p className="text-gray-600 mb-4">
                          Sign out from all devices except this one for security.
                        </p>
                        <button
                          onClick={() => {
                            if (
                              confirm(
                                'This will log you out from all other devices. Continue?'
                              )
                            ) {
                              setSuccess('Logged out from all other devices!');
                              setTimeout(() => setSuccess(''), 3000);
                            }
                          }}
                          className="px-6 py-2.5 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-medium"
                        >
                          Logout All Devices
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Delete Account */}
                  <div className="p-6 bg-red-50 rounded-xl border border-red-200">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <UserX className="w-6 h-6 text-red-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          Delete Account
                        </h3>
                        <p className="text-gray-600 mb-4">
                          Permanently delete your account and all associated data. This
                          action cannot be undone.
                        </p>
                        <button
                          onClick={handleDeleteAccount}
                          disabled={loading}
                          className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
                        >
                          {loading ? 'Deleting...' : 'Delete Account'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Settings;