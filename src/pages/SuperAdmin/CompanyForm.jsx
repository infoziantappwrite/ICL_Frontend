import { useToast } from '../../context/ToastContext';
// pages/SuperAdmin/CompanyForm.jsx - FIXED VERSION
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import apiCall from '../../api/Api';
import {
  Building2,
  Save,
  X,
  MapPin,
  Globe,
  Mail,
  Phone,
  Briefcase,
  FileText,
  Users,
  GraduationCap,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Shield,
} from 'lucide-react';
import SuperAdminDashboardLayout from '../../components/layout/SuperAdminDashboardLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { companyAPI } from '../../api/Api';

/* ─── Section heading ─────────────────────── */
const SHead = ({ icon: Icon, title, sub }) => (
  <div className="flex items-center gap-2 mb-4">
    <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0">
      <Icon className="w-3 h-3 text-white" />
    </div>
    <div>
      <h3 className="text-sm font-bold text-gray-800 leading-none">{title}</h3>
      {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

/* ─── Field wrapper ───────────────────────── */
const Field = ({ label, icon: Icon, required, error, hint, children }) => (
  <div>
    <label className="flex items-center gap-1.5 text-xs font-bold text-gray-600 mb-1.5">
      {Icon && <Icon className="w-3.5 h-3.5 text-gray-400" />}
      {label}
      {required && <span className="text-blue-500">*</span>}
    </label>
    {children}
    {hint && !error && <p className="text-[10px] text-gray-400 mt-1">{hint}</p>}
    {error && (
      <p className="text-red-500 text-[11px] mt-1 flex items-center gap-1 font-medium">
        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
        {error}
      </p>
    )}
  </div>
);

const inputBase =
  'w-full px-3 py-2.5 text-sm border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white placeholder-gray-400';

const CompanyForm = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const { companyId } = useParams();
  const isEditMode = !!companyId;

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [colleges, setColleges] = useState([]);
  const [loadingColleges, setLoadingColleges] = useState(true);

  const [formData, setFormData] = useState({
    collegeId: '',
    name: '',
    email: '',
    phone: '',
    website: '',
    industry: '',
    location: '',
    description: '',
    companySize: '',
    isActive: true,
  });

  const [errors, setErrors] = useState({});

  // Industry options matching backend enum
  const industryOptions = [
    'IT/Software',
    'Consulting',
    'Manufacturing',
    'BFSI',
    'E-commerce',
    'Healthcare',
    'Education',
    'Telecommunications',
    'Automotive',
    'Other',
  ];

  useEffect(() => {
    fetchColleges();
    if (isEditMode) {
      fetchCompanyData();
    } else {
      setLoading(false);
    }
  }, [companyId]);

  const fetchColleges = async () => {
    try {
      setLoadingColleges(true);
      const data = await apiCall('/super-admin/colleges?limit=1000');
      if (data.success) {
        setColleges(data.colleges);
      }
    } catch (error) {
      console.error('Error fetching colleges:', error);
    } finally {
      setLoadingColleges(false);
    }
  };

  const fetchCompanyData = async () => {
    try {
      setLoading(true);
      const response = await companyAPI.getCompanyById(companyId);

      if (response.success) {
        setFormData({
          collegeId: response.company.collegeId || '',
          name: response.company.name || '',
          email: response.company.email || '',
          phone: response.company.phone || '',
          website: response.company.website || '',
          industry: response.company.industry || '',
          location: response.company.headquarters?.city || '',
          description: response.company.description || '',
          companySize: response.company.employeeCount || '',
          isActive: response.company.isActive ?? true,
        });
      }
    } catch (error) {
      console.error('Error fetching company:', error);
      toast.error('Error', 'Failed to fetch company details: ' + error.message);
      navigate('/dashboard/super-admin/companies');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.collegeId) {
      newErrors.collegeId = 'Please select a college';
    }
    if (!formData.name.trim()) {
      newErrors.name = 'Company name is required';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!formData.industry) {
      newErrors.industry = 'Please select an industry';
    }
    if (formData.website && !/^https?:\/\/.+/.test(formData.website)) {
      newErrors.website = 'Website must start with http:// or https://';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Error', 'Please fix the errors in the form');
      return;
    }

    try {
      setSaving(true);

      const companyData = {
        collegeId: formData.collegeId,
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        website: formData.website || undefined,
        industry: formData.industry,
        description: formData.description || undefined,
        employeeCount: formData.companySize || undefined,
        isActive: formData.isActive,
        headquarters: {
          city: formData.location || undefined,
        },
      };

      if (isEditMode) {
        await companyAPI.updateCompany(companyId, companyData);
        toast.success('Success', 'Company updated successfully!');
      } else {
        await companyAPI.createCompany(companyData);
        toast.success('Success', 'Company created successfully!');
      }

      navigate('/dashboard/super-admin/companies');
    } catch (error) {
      console.error('Error saving company:', error);
      toast.error('Error', `Failed to ${isEditMode ? 'update' : 'create'} company: ` + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading Company Data..." />;
  }

  return (
    <SuperAdminDashboardLayout>

      {/* ══ HERO BANNER ══ */}
      <div className="relative bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 rounded-2xl px-5 py-4 mb-4 shadow-xl shadow-blue-500/20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-10 -right-10 w-44 h-44 bg-white/10 rounded-full" />
          <div className="absolute -bottom-8 left-1/3 w-28 h-28 bg-white/10 rounded-full" />
          <div className="absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage: 'radial-gradient(circle,white 1px,transparent 1px)', backgroundSize: '18px 18px' }} />
        </div>
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <button onClick={() => navigate('/dashboard/super-admin/companies')}
              className="text-blue-200 hover:text-white text-[11px] font-semibold flex items-center gap-1 mb-1 transition-colors">
              <ArrowLeft className="w-3 h-3" /> Back to Companies
            </button>
            <h1 className="text-white font-black text-lg leading-tight">
              {isEditMode ? 'Edit Company' : 'Add New Company'}
            </h1>
            <p className="text-blue-200 text-[11px] mt-0.5">
              {isEditMode ? 'Update company information' : 'Fill in the details to register a new company'}
            </p>
          </div>
        </div>
      </div>

      {/* ══ FORM ══ */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* ── LEFT: Main fields (2 cols) ── */}
        <div className="lg:col-span-2 flex flex-col gap-4">

          {/* College Assignment */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-4">
            <SHead icon={GraduationCap} title="College Assignment" sub="Associate this company with a college" />
            <Field label="Select College" icon={GraduationCap} required error={errors.collegeId}
              hint={isEditMode ? 'College cannot be changed after creation' : undefined}>
              <select
                name="collegeId"
                value={formData.collegeId}
                onChange={handleInputChange}
                disabled={isEditMode || loadingColleges}
                className={`${inputBase} ${errors.collegeId ? 'border-red-400 bg-red-50/30' : 'border-gray-200 hover:border-gray-300'} ${isEditMode ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                required
              >
                <option value="">Select a college</option>
                {colleges.map((college) => (
                  <option key={college._id} value={college._id}>
                    {college.name} ({college.code})
                  </option>
                ))}
              </select>
            </Field>
            {isEditMode && (
              <div className="mt-2 flex items-start gap-2 p-2.5 bg-amber-50 rounded-xl border border-amber-100">
                <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-[10px] text-amber-700 font-medium leading-relaxed">
                  College cannot be changed after creation. To assign this company to a different college, create a new company entry.
                </p>
              </div>
            )}
          </div>

          {/* Basic Information */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-4">
            <SHead icon={Building2} title="Basic Information" sub="Core company identity details" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              <div className="sm:col-span-2">
                <Field label="Company Name" icon={Building2} required error={errors.name}>
                  <input
                    type="text" name="name" value={formData.name} onChange={handleInputChange} required
                    className={`${inputBase} ${errors.name ? 'border-red-400 bg-red-50/30' : 'border-gray-200 hover:border-gray-300'}`}
                    placeholder="Enter company name"
                  />
                </Field>
              </div>

              <Field label="Industry" icon={Briefcase} required error={errors.industry}>
                <select
                  name="industry" value={formData.industry} onChange={handleInputChange} required
                  className={`${inputBase} ${errors.industry ? 'border-red-400 bg-red-50/30' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <option value="">Select industry</option>
                  {industryOptions.map((industry) => (
                    <option key={industry} value={industry}>{industry}</option>
                  ))}
                </select>
                {formData.industry === 'Other' && (
                  <input
                    type="text" name="industryOther" placeholder="Specify industry…"
                    className={`${inputBase} mt-2 border-gray-200 hover:border-gray-300`}
                    value={formData.industryOther || ''} onChange={handleInputChange}
                  />
                )}
              </Field>

              <Field label="Company Size" icon={Users}>
                <select
                  name="companySize" value={formData.companySize} onChange={handleInputChange}
                  className={`${inputBase} border-gray-200 hover:border-gray-300`}
                >
                  <option value="">Select company size</option>
                  <option value="0-50">0–50 employees</option>
                  <option value="51-200">51–200 employees</option>
                  <option value="201-500">201–500 employees</option>
                  <option value="501-1000">501–1000 employees</option>
                  <option value="1000+">1000+ employees</option>
                </select>
              </Field>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-4">
            <SHead icon={Mail} title="Contact Information" sub="How to reach this company" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              <Field label="Email Address" icon={Mail} required error={errors.email}>
                <input
                  type="email" name="email" value={formData.email} onChange={handleInputChange} required
                  className={`${inputBase} ${errors.email ? 'border-red-400 bg-red-50/30' : 'border-gray-200 hover:border-gray-300'}`}
                  placeholder="company@example.com"
                />
              </Field>

              <Field label="Phone Number" icon={Phone}>
                <input
                  type="tel" name="phone" value={formData.phone} onChange={handleInputChange}
                  className={`${inputBase} border-gray-200 hover:border-gray-300`}
                  placeholder="+1 (555) 123-4567"
                />
              </Field>

              <Field label="Website" icon={Globe} error={errors.website}
                hint="Must start with http:// or https://">
                <input
                  type="url" name="website" value={formData.website} onChange={handleInputChange}
                  className={`${inputBase} ${errors.website ? 'border-red-400 bg-red-50/30' : 'border-gray-200 hover:border-gray-300'}`}
                  placeholder="https://www.example.com"
                />
              </Field>

              <Field label="Location" icon={MapPin}>
                <input
                  type="text" name="location" value={formData.location} onChange={handleInputChange}
                  className={`${inputBase} border-gray-200 hover:border-gray-300`}
                  placeholder="City, State, Country"
                />
              </Field>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-4">
            <SHead icon={FileText} title="Company Description" sub="Brief overview visible to students" />
            <Field label="About the Company">
              <textarea
                name="description" value={formData.description} onChange={handleInputChange}
                rows={5}
                className={`${inputBase} border-gray-200 hover:border-gray-300 resize-none`}
                placeholder="Enter a brief description of the company, its mission, and what makes it unique…"
              />
            </Field>
          </div>
        </div>

        {/* ── RIGHT: Sidebar ── */}
        <div className="flex flex-col gap-4">

          {/* Company Status */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-4">
            <SHead icon={Shield} title="Company Status" sub="Visibility in the platform" />
            <div
              className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                formData.isActive ? 'bg-blue-50 border-blue-100' : 'bg-gray-50 border-gray-200'
              }`}
              onClick={() => setFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
            >
              <div className={`relative w-9 h-5 rounded-full flex-shrink-0 transition-colors duration-200 ${
                formData.isActive ? 'bg-gradient-to-r from-blue-500 to-cyan-400' : 'bg-gray-300'
              }`}>
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                  formData.isActive ? 'translate-x-[18px]' : 'translate-x-0.5'
                }`} />
                <input
                  type="checkbox" name="isActive" checked={formData.isActive}
                  onChange={handleInputChange} className="sr-only"
                />
              </div>
              <div>
                <p className={`text-xs font-bold ${formData.isActive ? 'text-blue-700' : 'text-gray-600'}`}>
                  {formData.isActive ? 'Active' : 'Inactive'}
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {formData.isActive
                    ? 'Company is visible and accepting applications'
                    : 'Company is hidden from students'}
                </p>
              </div>
            </div>
          </div>

          {/* Save / Cancel */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-4">
            <SHead icon={CheckCircle2} title="Save Changes" />
            <div className="space-y-2">
              <button
                type="submit" disabled={saving}
                className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-xs font-bold px-4 py-3 rounded-xl shadow-sm hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {saving ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {isEditMode ? 'Updating…' : 'Creating…'}
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    {isEditMode ? 'Update Company' : 'Create Company'}
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => navigate('/dashboard/super-admin/companies')}
                className="w-full inline-flex items-center justify-center gap-2 border border-gray-200 bg-white text-gray-600 text-xs font-semibold px-4 py-3 rounded-xl hover:bg-gray-50 transition-all"
              >
                <X className="w-3.5 h-3.5" /> Cancel
              </button>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-gradient-to-br from-blue-600 via-blue-600 to-cyan-500 rounded-2xl p-4 text-white shadow-lg shadow-blue-500/20 relative overflow-hidden">
            <div className="absolute -top-6 -right-6 w-20 h-20 bg-white/10 rounded-full" />
            <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-white/10 rounded-full" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-3.5 h-3.5 text-white" />
                </div>
                <p className="text-xs font-bold text-white">
                  {isEditMode ? 'Editing Tips' : 'Creation Tips'}
                </p>
              </div>
              <ul className="space-y-1.5">
                {(isEditMode
                  ? [
                      'College assignment cannot be changed',
                      'Email should stay consistent for tracking',
                      'Toggle status to hide from students',
                    ]
                  : [
                      'Use official company email address',
                      'Website must include http:// or https://',
                      'A detailed description helps students',
                      'Industry and size aid in filtering',
                    ]
                ).map((tip, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="w-1 h-1 bg-cyan-300 rounded-full mt-1.5 flex-shrink-0" />
                    <p className="text-[10px] text-blue-100 leading-relaxed">{tip}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>

        </div>
      </form>

    </SuperAdminDashboardLayout>
  );
};

export default CompanyForm;