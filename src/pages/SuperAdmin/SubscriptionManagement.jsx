// src/pages/SuperAdmin/SubscriptionManagement.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const SubscriptionManagement = () => {
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCollege, setSelectedCollege] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [analytics, setAnalytics] = useState(null);

  const [subscriptionUpdate, setSubscriptionUpdate] = useState({
    plan: 'free',
    perGroupLimit: 100,
    totalStudentLimit: 500
  });

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/subscriptions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setColleges(response.data.data || []);
      setAnalytics(response.data.analytics);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch subscriptions:', err);
      setLoading(false);
    }
  };

  const handleUpdateSubscription = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_URL}/subscriptions/${selectedCollege._id}`,
        subscriptionUpdate,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      alert('Subscription updated successfully!');
      setShowUpdateModal(false);
      fetchSubscriptions();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update subscription');
    }
  };

  const openUpdateModal = (college) => {
    setSelectedCollege(college);
    setSubscriptionUpdate({
      plan: college.plan,
      perGroupLimit: college.limits.perGroup,
      totalStudentLimit: college.limits.total
    });
    setShowUpdateModal(true);
  };

  const getPlanColor = (plan) => {
    switch (plan) {
      case 'free': return 'bg-gray-100 text-gray-800';
      case 'pro': return 'bg-blue-100 text-blue-800';
      case 'pro_plus': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlanName = (plan) => {
    switch (plan) {
      case 'free': return 'Free';
      case 'pro': return 'Pro';
      case 'pro_plus': return 'Pro Plus';
      default: return plan;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Subscription Management</h1>
          <p className="text-gray-600 mt-1">Manage college subscription plans and quotas</p>
        </div>

        {/* Analytics Cards */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="text-sm text-gray-600 mb-1">Total Colleges</div>
              <div className="text-3xl font-bold text-gray-900">{analytics.totalColleges}</div>
            </div>
            <div className="bg-gray-100 rounded-lg shadow-sm p-6">
              <div className="text-sm text-gray-600 mb-1">Free Plan</div>
              <div className="text-3xl font-bold text-gray-700">{analytics.byPlan.free}</div>
            </div>
            <div className="bg-blue-100 rounded-lg shadow-sm p-6">
              <div className="text-sm text-blue-700 mb-1">Pro Plan</div>
              <div className="text-3xl font-bold text-blue-800">{analytics.byPlan.pro}</div>
            </div>
            <div className="bg-purple-100 rounded-lg shadow-sm p-6">
              <div className="text-sm text-purple-700 mb-1">Pro Plus</div>
              <div className="text-3xl font-bold text-purple-800">{analytics.byPlan.pro_plus}</div>
            </div>
          </div>
        )}

        {/* Colleges Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    College
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Per Group Limit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Limit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Groups
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {colleges.map((college) => (
                  <tr key={college._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{college.name}</div>
                      <div className="text-sm text-gray-500">{college.code}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPlanColor(college.plan)}`}>
                        {getPlanName(college.plan)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {college.limits.perGroup === Infinity ? '∞' : college.limits.perGroup}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {college.limits.total === Infinity ? '∞' : college.limits.total}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm text-gray-900">
                          {college.usage.students} / {college.limits.total === Infinity ? '∞' : college.limits.total}
                        </div>
                        <div className="ml-2">
                          {college.usage.percentUsed >= 90 ? (
                            <span className="text-red-600">⚠️</span>
                          ) : college.usage.percentUsed >= 70 ? (
                            <span className="text-orange-500">⚡</span>
                          ) : (
                            <span className="text-green-500">✓</span>
                          )}
                        </div>
                      </div>
                      <div className="w-32 bg-gray-200 rounded-full h-2 mt-1">
                        <div
                          className={`h-2 rounded-full ${
                            college.usage.percentUsed >= 90 ? 'bg-red-600' :
                            college.usage.percentUsed >= 70 ? 'bg-orange-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(college.usage.percentUsed, 100)}%` }}
                        ></div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {college.usage.groups}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {college.isActive ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => openUpdateModal(college)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Update Plan
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {colleges.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No colleges found</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Update Subscription Modal */}
      {showUpdateModal && selectedCollege && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-6">Update Subscription</h2>
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <div className="font-semibold text-gray-900">{selectedCollege.name}</div>
              <div className="text-sm text-gray-600">{selectedCollege.code}</div>
            </div>

            <form onSubmit={handleUpdateSubscription}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subscription Plan
                  </label>
                  <select
                    value={subscriptionUpdate.plan}
                    onChange={(e) => {
                      const plan = e.target.value;
                      let limits = { perGroupLimit: 100, totalStudentLimit: 500 };
                      
                      if (plan === 'pro') {
                        limits = { perGroupLimit: 250, totalStudentLimit: 1000 };
                      } else if (plan === 'pro_plus') {
                        limits = { perGroupLimit: 999999, totalStudentLimit: 999999 };
                      }
                      
                      setSubscriptionUpdate({ ...subscriptionUpdate, plan, ...limits });
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="free">Free (100/group, 500 total)</option>
                    <option value="pro">Pro (250/group, 1,000 total)</option>
                    <option value="pro_plus">Pro Plus (Unlimited)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Per Group Limit
                  </label>
                  <input
                    type="number"
                    value={subscriptionUpdate.perGroupLimit}
                    onChange={(e) => setSubscriptionUpdate({ ...subscriptionUpdate, perGroupLimit: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    min="1"
                  />
                  <p className="text-xs text-gray-500 mt-1">Maximum students per single group</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Student Limit
                  </label>
                  <input
                    type="number"
                    value={subscriptionUpdate.totalStudentLimit}
                    onChange={(e) => setSubscriptionUpdate({ ...subscriptionUpdate, totalStudentLimit: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    min="1"
                  />
                  <p className="text-xs text-gray-500 mt-1">Maximum students across all groups</p>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-sm text-gray-700">
                    <strong>Current Usage:</strong> {selectedCollege.usage.students} students in {selectedCollege.usage.groups} groups
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowUpdateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Update Subscription
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionManagement;