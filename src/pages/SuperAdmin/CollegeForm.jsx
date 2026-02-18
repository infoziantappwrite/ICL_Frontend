import { useToast } from '../../context/ToastContext';
// pages/SuperAdmin/CollegeForm.jsx - Add/Edit College Form
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Building2,
  Save,
  X,
  Mail,
  Phone,
  MapPin,
  Globe,
  Calendar,
  Award,
  Users,
  GraduationCap,
  ArrowLeft,
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const CollegeForm = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const { collegeId } = useParams();
  const isEditMode = Boolean(collegeId);

  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    // Basic Information
    name: '',
    code: '',
    email: '',
    phone: '',
    
    // Location
    address: {
      street: '',
      city: '',
      state: '',
      country: 'India',
      pincode: '',
    },
    
    // College Details
    university: '',
    type: 'Private',
    establishedYear: new Date().getFullYear(),
    accreditation: [],
    website: '',
    
    // Departments
    departments: [],
    
    // Placement Configuration
    placementConfig: {
      academicYear: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
      minimumCGPA: 6.0,
      allowBacklogs: true,
      maxBacklogsAllowed: 3,
    },
  });

  const [newDepartment, setNewDepartment] = useState({
    name: '',
    code: '',
    hodName: '',
    hodEmail: '',
  });

  const [newAccreditation, setNewAccreditation] = useState('');

  useEffect(() => {
    if (isEditMode) {
      fetchCollegeData();
    }
  }, [collegeId]);

  const fetchCollegeData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:5000/api/super-admin/colleges/${collegeId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        }
      );
      const data = await response.json();

      if (data.success) {
        setFormData(data.college);
      }
    } catch (error) {
      console.error('Error fetching college:', error);
      toast.error('Error', 'Error loading college data');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Convert value based on input type
    let finalValue;
    if (type === 'checkbox') {
      finalValue = checked;
    } else if (type === 'number') {
      // Convert to number, handle empty string
      finalValue = value === '' ? '' : parseFloat(value);
    } else {
      finalValue = value;
    }
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: finalValue,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: finalValue,
      }));
    }
  };

  const addDepartment = () => {
    if (newDepartment.name && newDepartment.code) {
      setFormData((prev) => ({
        ...prev,
        departments: [...prev.departments, newDepartment],
      }));
      setNewDepartment({ name: '', code: '', hodName: '', hodEmail: '' });
    }
  };

  const removeDepartment = (index) => {
    setFormData((prev) => ({
      ...prev,
      departments: prev.departments.filter((_, i) => i !== index),
    }));
  };

  const addAccreditation = () => {
    if (newAccreditation.trim()) {
      setFormData((prev) => ({
        ...prev,
        accreditation: [...(prev.accreditation || []), newAccreditation.trim()],
      }));
      setNewAccreditation('');
    }
  };

  const removeAccreditation = (index) => {
    setFormData((prev) => ({
      ...prev,
      accreditation: prev.accreditation.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      console.log('📤 Submitting college data:', formData);
      console.log('📋 Placement Config:', formData.placementConfig);
      
      const url = isEditMode
        ? `http://localhost:5000/api/super-admin/colleges/${collegeId}`
        : 'http://localhost:5000/api/super-admin/colleges';
      
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      console.log('📥 Backend response:', data);

      if (data.success) {
        toast.success('Success', isEditMode ? 'College updated successfully!' : 'College created successfully!');
        navigate('/dashboard/super-admin/colleges');
      } else {
        toast.error('Error', data.message || 'Failed to save college');
      }
    } catch (error) {
      console.error('❌ Error saving college:', error);
      toast.error('Error', 'Error saving college');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <LoadingSpinner
        message={isEditMode ? 'Loading College Data...' : 'Preparing Form...'}
        submessage="Please wait"
      />
    );
  }

  return (
    <DashboardLayout title={isEditMode ? 'Edit College' : 'Add New College'}>
      <div className="mb-8 animate-fade-in">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 rounded-3xl p-8 shadow-2xl shadow-blue-500/30 overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white rounded-full -ml-32 -mb-32"></div>
          </div>
          
          <div className="relative">
            <button
              onClick={() => navigate('/dashboard/super-admin/colleges')}
              className="flex items-center gap-2 text-white/90 hover:text-white mb-4 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Colleges
            </button>
            <div className="text-white">
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                <Building2 className="w-8 h-8" />
                {isEditMode ? 'Edit College' : 'Add New College'}
              </h1>
              <p className="text-blue-100 text-lg">
                {isEditMode
                  ? 'Update college information and settings'
                  : 'Register a new college to the platform'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-blue-50 via-cyan-50 to-blue-50 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              Basic Information
            </h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                College Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter college name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                College Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                required
                pattern="[A-Z0-9]{3,10}"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                placeholder="e.g., MIT123"
                maxLength="10"
              />
              <p className="text-xs text-gray-500 mt-1">3-10 alphanumeric characters</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="college@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Phone <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                pattern="[0-9]{10}"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="1234567890"
                maxLength="10"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Website
              </label>
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://www.example.com"
              />
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-blue-50 via-cyan-50 to-blue-50 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              Location Details
            </h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Street Address</label>
              <input
                type="text"
                name="address.street"
                value={formData.address?.street || ''}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Street address"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="address.city"
                value={formData.address?.city || ''}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="City"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                State <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="address.state"
                value={formData.address?.state || ''}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="State"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Pincode</label>
              <input
                type="text"
                name="address.pincode"
                value={formData.address?.pincode || ''}
                onChange={handleChange}
                pattern="[0-9]{6}"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="123456"
                maxLength="6"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
              <input
                type="text"
                name="address.country"
                value={formData.address?.country || 'India'}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="India"
              />
            </div>
          </div>
        </div>

        {/* College Details */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-blue-50 via-cyan-50 to-blue-50 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-blue-600" />
              College Details
            </h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                University <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="university"
                value={formData.university}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="University name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                College Type
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Government">Government</option>
                <option value="Private">Private</option>
                <option value="Autonomous">Autonomous</option>
                <option value="Deemed">Deemed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Established Year
              </label>
              <input
                type="number"
                name="establishedYear"
                value={formData.establishedYear}
                onChange={handleChange}
                min="1800"
                max={new Date().getFullYear()}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="2000"
              />
            </div>

            {/* Accreditations */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Award className="w-4 h-4" />
                Accreditations
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newAccreditation}
                  onChange={(e) => setNewAccreditation(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., NAAC A++"
                />
                <button
                  type="button"
                  onClick={addAccreditation}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.accreditation?.map((acc, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center gap-2"
                  >
                    {acc}
                    <button
                      type="button"
                      onClick={() => removeAccreditation(index)}
                      className="text-blue-700 hover:text-blue-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Departments */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-blue-50 via-cyan-50 to-blue-50 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Departments
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
              <input
                type="text"
                value={newDepartment.name}
                onChange={(e) =>
                  setNewDepartment({ ...newDepartment, name: e.target.value })
                }
                className="px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Department Name"
              />
              <input
                type="text"
                value={newDepartment.code}
                onChange={(e) =>
                  setNewDepartment({
                    ...newDepartment,
                    code: e.target.value.toUpperCase(),
                  })
                }
                className="px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                placeholder="Code (e.g., CSE)"
              />
              <input
                type="text"
                value={newDepartment.hodName}
                onChange={(e) =>
                  setNewDepartment({ ...newDepartment, hodName: e.target.value })
                }
                className="px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="HOD Name (Optional)"
              />
              <input
                type="email"
                value={newDepartment.hodEmail}
                onChange={(e) =>
                  setNewDepartment({ ...newDepartment, hodEmail: e.target.value })
                }
                className="px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="HOD Email (Optional)"
              />
              <button
                type="button"
                onClick={addDepartment}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
              >
                Add
              </button>
            </div>

            {formData.departments?.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                        Name
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                        Code
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                        HOD Name
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                        HOD Email
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {formData.departments.map((dept, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 text-gray-900">{dept.name}</td>
                        <td className="px-4 py-2">
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm font-semibold">
                            {dept.code}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-gray-600">{dept.hodName || '-'}</td>
                        <td className="px-4 py-2 text-gray-600">{dept.hodEmail || '-'}</td>
                        <td className="px-4 py-2">
                          <button
                            type="button"
                            onClick={() => removeDepartment(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Placement Configuration */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-blue-50 via-cyan-50 to-blue-50 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-blue-600" />
              Placement Configuration
            </h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Academic Year
              </label>
              <input
                type="text"
                name="placementConfig.academicYear"
                value={formData.placementConfig?.academicYear || ''}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="2024-2025"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum CGPA
              </label>
              <input
                type="number"
                name="placementConfig.minimumCGPA"
                value={formData.placementConfig?.minimumCGPA ?? 6.0}
                onChange={handleChange}
                min="0"
                max="10"
                step="0.1"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="placementConfig.allowBacklogs"
                  checked={formData.placementConfig?.allowBacklogs ?? true}
                  onChange={handleChange}
                  className="w-5 h-5 text-blue-600 focus:ring-2 focus:ring-blue-500 rounded"
                />
                <span className="text-sm font-medium text-gray-700">Allow Backlogs</span>
              </label>
            </div>

            {formData.placementConfig?.allowBacklogs && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Backlogs Allowed
                </label>
                <input
                  type="number"
                  name="placementConfig.maxBacklogsAllowed"
                  value={formData.placementConfig?.maxBacklogsAllowed ?? 3}
                  onChange={handleChange}
                  min="0"
                  max="10"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-4 justify-end">
          <button
            type="button"
            onClick={() => navigate('/dashboard/super-admin/colleges')}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all shadow-lg hover:shadow-xl font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {isEditMode ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                {isEditMode ? 'Update College' : 'Create College'}
              </>
            )}
          </button>
        </div>
      </form>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </DashboardLayout>
  );
};

export default CollegeForm;