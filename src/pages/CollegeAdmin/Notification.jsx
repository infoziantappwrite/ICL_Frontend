// pages/Notifications.jsx - Comprehensive Notification Center
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Trash2,
  Filter,
  Search,
  Briefcase,
  FileText,
  Users,
  Building2,
  Calendar,
  AlertCircle,
  Info,
  CheckCircle,
  XCircle,
  Clock,
  Settings,
  Archive,
  Star,
  StarOff,
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../context/AuthContext';

const Notifications = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = () => {
    // Mock notifications - Replace with actual API call
    const mockNotifications = [
      {
        id: '1',
        type: 'job',
        icon: Briefcase,
        color: 'blue',
        title: 'New Job Opportunity',
        message: 'Software Engineer position opened at Infoziant Technologies',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        read: false,
        starred: true,
        actionUrl: '/dashboard/college-admin/jobs',
      },
      {
        id: '2',
        type: 'application',
        icon: FileText,
        color: 'green',
        title: 'Application Status Updated',
        message: 'Your application for SE position has been shortlisted',
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
        read: false,
        starred: false,
        actionUrl: '/applications',
      },
      {
        id: '3',
        type: 'system',
        icon: Info,
        color: 'purple',
        title: 'System Maintenance',
        message: 'Scheduled maintenance on Friday, 11 PM - 2 AM',
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        read: true,
        starred: false,
        actionUrl: null,
      },
      {
        id: '4',
        type: 'deadline',
        icon: Clock,
        color: 'orange',
        title: 'Application Deadline Approaching',
        message: 'Only 2 days left to apply for Associate System Trainee at zohoO',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        read: true,
        starred: false,
        actionUrl: '/dashboard/college-admin/jobs',
      },
      {
        id: '5',
        type: 'company',
        icon: Building2,
        color: 'cyan',
        title: 'New Company Registered',
        message: 'TechCorp Solutions has been added to the placement portal',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        read: true,
        starred: false,
        actionUrl: '/dashboard/college-admin/companies',
      },
      {
        id: '6',
        type: 'interview',
        icon: Calendar,
        color: 'indigo',
        title: 'Interview Scheduled',
        message: 'Technical interview scheduled for tomorrow at 10:00 AM',
        timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        read: true,
        starred: true,
        actionUrl: '/applications',
      },
    ];
    setNotifications(mockNotifications);
  };

  const getColorClasses = (color) => {
    const colors = {
      blue: {
        bg: 'bg-blue-100',
        text: 'text-blue-600',
        gradient: 'from-blue-500 to-blue-600',
      },
      green: {
        bg: 'bg-green-100',
        text: 'text-green-600',
        gradient: 'from-green-500 to-green-600',
      },
      purple: {
        bg: 'bg-purple-100',
        text: 'text-purple-600',
        gradient: 'from-purple-500 to-purple-600',
      },
      orange: {
        bg: 'bg-orange-100',
        text: 'text-orange-600',
        gradient: 'from-orange-500 to-orange-600',
      },
      cyan: {
        bg: 'bg-cyan-100',
        text: 'text-cyan-600',
        gradient: 'from-cyan-500 to-cyan-600',
      },
      indigo: {
        bg: 'bg-indigo-100',
        text: 'text-indigo-600',
        gradient: 'from-indigo-500 to-indigo-600',
      },
    };
    return colors[color] || colors.blue;
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const handleMarkAsRead = (id) => {
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleMarkAsUnread = (id) => {
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, read: false } : n))
    );
  };

  const handleToggleStar = (id) => {
    setNotifications(
      notifications.map((n) =>
        n.id === id ? { ...n, starred: !n.starred } : n
      )
    );
  };

  const handleDelete = (id) => {
    if (confirm('Delete this notification?')) {
      setNotifications(notifications.filter((n) => n.id !== id));
    }
  };

  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  const handleClearAll = () => {
    if (confirm('Clear all notifications? This action cannot be undone.')) {
      setNotifications([]);
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      handleMarkAsRead(notification.id);
    }
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    const matchesSearch =
      n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.message.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType =
      filterType === 'all' || n.type === filterType;

    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'unread' && !n.read) ||
      (filterStatus === 'read' && n.read) ||
      (filterStatus === 'starred' && n.starred);

    return matchesSearch && matchesType && matchesStatus;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;
  const starredCount = notifications.filter((n) => n.starred).length;

  return (
    <DashboardLayout title="Notifications">
      {/* Header */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 rounded-3xl p-8 shadow-2xl shadow-blue-500/30">
          <div className="flex items-center justify-between">
            <div className="text-white">
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                <Bell className="w-8 h-8" />
                Notification Center
              </h1>
              <p className="text-blue-100 text-lg">
                Stay updated with all your placement activities
              </p>
            </div>
            <button
              onClick={() => navigate('/notifications/settings')}
              className="bg-white text-blue-600 px-6 py-3 rounded-xl font-semibold flex items-center gap-2 hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl hover:scale-105"
            >
              <Settings className="w-5 h-5" />
              Preferences
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">Total</p>
              <p className="text-3xl font-bold text-gray-900">
                {notifications.length}
              </p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
              <Bell className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">Unread</p>
              <p className="text-3xl font-bold text-orange-600">{unreadCount}</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
              <BellOff className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">Starred</p>
              <p className="text-3xl font-bold text-yellow-600">{starredCount}</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
              <Star className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/50 mb-6">
        <div className="flex flex-col lg:flex-row gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="job">Job Opportunities</option>
            <option value="application">Applications</option>
            <option value="interview">Interviews</option>
            <option value="company">Companies</option>
            <option value="deadline">Deadlines</option>
            <option value="system">System</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="unread">Unread Only</option>
            <option value="read">Read Only</option>
            <option value="starred">Starred Only</option>
          </select>
        </div>

        {/* Bulk Actions */}
        {notifications.length > 0 && (
          <div className="flex gap-3">
            <button
              onClick={handleMarkAllAsRead}
              className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium text-sm flex items-center gap-2"
            >
              <CheckCheck className="w-4 h-4" />
              Mark All Read
            </button>
            <button
              onClick={handleClearAll}
              className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium text-sm flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Clear All
            </button>
          </div>
        )}
      </div>

      {/* Notifications List */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 overflow-hidden">
        {filteredNotifications.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {filteredNotifications.map((notification) => {
              const colorClasses = getColorClasses(notification.color);
              const NotificationIcon = notification.icon;

              return (
                <div
                  key={notification.id}
                  className={`p-6 hover:bg-blue-50/50 transition-all cursor-pointer group ${
                    !notification.read ? 'bg-blue-50/30' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div
                      className={`w-12 h-12 ${colorClasses.bg} rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}
                    >
                      <NotificationIcon
                        className={`w-6 h-6 ${colorClasses.text}`}
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h3
                          className={`font-semibold text-gray-900 ${
                            !notification.read ? 'font-bold' : ''
                          }`}
                        >
                          {notification.title}
                        </h3>
                        <span className="text-xs text-gray-500 flex-shrink-0">
                          {getTimeAgo(notification.timestamp)}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm mb-3">
                        {notification.message}
                      </p>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleStar(notification.id);
                          }}
                          className={`p-1.5 rounded-lg transition-colors ${
                            notification.starred
                              ? 'text-yellow-500 hover:bg-yellow-50'
                              : 'text-gray-400 hover:bg-gray-100'
                          }`}
                          title={notification.starred ? 'Unstar' : 'Star'}
                        >
                          {notification.starred ? (
                            <Star className="w-4 h-4" fill="currentColor" />
                          ) : (
                            <StarOff className="w-4 h-4" />
                          )}
                        </button>

                        {!notification.read ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsRead(notification.id);
                            }}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Mark as read"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsUnread(notification.id);
                            }}
                            className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Mark as unread"
                          >
                            <BellOff className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(notification.id);
                          }}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Unread Indicator */}
                    {!notification.read && (
                      <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-2"></div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-medium mb-2">
              No notifications found
            </p>
            <p className="text-gray-400">
              {searchTerm || filterType !== 'all' || filterStatus !== 'all'
                ? 'Try adjusting your search or filters'
                : "You're all caught up!"}
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Notifications;