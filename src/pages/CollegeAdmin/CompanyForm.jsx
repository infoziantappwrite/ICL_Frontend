// pages/CollegeAdmin/CompanyForm.jsx — redesigned to match SuperAdmin/CollegeAdmin theme
import { useToast } from '../../context/ToastContext';
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Building2, Save, X, MapPin, Globe, Mail, Phone, Briefcase, FileText, ArrowLeft,
} from 'lucide-react';
import CollegeAdminLayout from '../../components/layout/CollegeAdminLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { companyAPI, collegeAdminAPI } from '../../api/Api';

/* ─── Form field helpers ─────────────────────── */
const FieldLabel = ({ children, required }) => (
  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
    {children}{required && <span className="text-red-400 ml-0.5">*</span>}
  </label>
);

const TextInput = ({ error, ...props }) => (
  <input {...props}
    className={`w-full px-3 py-2.5 text-sm border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-colors ${
      error ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300'
    }`}
  />
);

const SelectInput = ({ error, children, ...props }) => (
  <select {...props}
    className={`w-full px-3 py-2.5 text-sm border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-colors ${
      error ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300'
    }`}>
    {children}
  </select>
);

const FieldError = ({ msg }) => msg ? <p className="text-red-500 text-[10px] mt-1 font-medium">{msg}</p> : null;

/* ─── Section card ─────────────────────────── */
const Section = ({ icon: Icon, title, children }) => (
  <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-4">
    <div className="flex items-center gap-2 mb-4">
      <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0">
        <Icon className="w-3 h-3 text-white" />
      </div>
      <h3 className="text-sm font-bold text-gray-800">{title}</h3>
    </div>
    {children}
  </div>
);

/* ══════════════════════════════════════════ */
const CompanyForm = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const { companyId } = useParams();
  const isEditMode = !!companyId;

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving]   = useState(false);

  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', website: '', industry: '',
    location: '', description: '', companySize: '', isActive: true,
  });

  const [errors, setErrors] = useState({});

  const industryOptions = [
    'IT/Software', 'Consulting', 'Manufacturing', 'BFSI', 'E-commerce',
    'Healthcare', 'Education', 'Telecommunications', 'Automotive', 'Other',
  ];

  const companySizeOptions = ['1-50', '51-200', '201-500', '501-1000', '1000+'];

  useEffect(() => {
    if (isEditMode) fetchCompanyData();
    else setLoading(false);
  }, [companyId]);

  const fetchCompanyData = async () => {
    try {
      setLoading(true);
      const response = await companyAPI.getCompanyById(companyId);
      if (response.success) {
        setFormData({
          name:        response.company.name || '',
          email:       response.company.email || '',
          phone:       response.company.phone || '',
          website:     response.company.website || '',
          industry:    response.company.industry || '',
          location:    response.company.location || response.company.headquarters?.city || '',
          description: response.company.description || '',
          companySize: response.company.companySize || response.company.employeeCount || '',
          isActive:    response.company.isActive ?? true,
        });
      }
    } catch (error) {
      toast.error('Error', 'Failed to fetch company details: ' + error.message);
      navigate('/dashboard/college-admin/companies');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim())   newErrors.name  = 'Company name is required';
    if (!formData.email.trim())  newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format';
    if (!formData.industry)      newErrors.industry = 'Please select an industry';
    if (formData.website && !/^https?:\/\/.+/.test(formData.website)) newErrors.website = 'Must start with http:// or https://';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) { toast.error('Error', 'Please fix the errors in the form'); return; }
    try {
      setSaving(true);
      const companyData = {
        name: formData.name, email: formData.email,
        phone: formData.phone || undefined, website: formData.website || undefined,
        industry: formData.industry, description: formData.description || undefined,
        companySize: formData.companySize || undefined, isActive: formData.isActive,
        headquarters: { city: formData.location || undefined },
      };
      if (isEditMode) {
        await collegeAdminAPI.updateCompany(companyId, companyData);
        toast.success('Success', 'Company updated successfully!');
      } else {
        await collegeAdminAPI.createCompany(companyData);
        toast.success('Success', 'Company created successfully!');
      }
      navigate('/dashboard/college-admin/companies');
    } catch (error) {
      toast.error('Error', `Failed to ${isEditMode ? 'update' : 'create'} company: ` + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner message={`Loading ${isEditMode ? 'Company Details' : 'Form'}...`} />;

  return (
    <CollegeAdminLayout>

      {/* Back button */}
      <button onClick={() => navigate('/dashboard/college-admin/companies')}
        className="flex items-center gap-2 text-gray-500 hover:text-blue-600 mb-4 transition-colors group text-sm font-medium">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to Companies
      </button>

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
            <p className="text-blue-200 text-[11px] font-semibold">
              {isEditMode ? 'Update company information' : 'Register a new recruiting partner'}
            </p>
            <h1 className="text-white font-black text-lg leading-tight">
              {isEditMode ? 'Edit Company' : 'Add New Company'}
            </h1>
          </div>
        </div>
      </div>

      {/* ══ FORM ══ */}
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* ── MAIN FORM (2 cols) ── */}
          <div className="lg:col-span-2 flex flex-col gap-4">

            {/* Basic Information */}
            <Section icon={Building2} title="Basic Information">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <FieldLabel required>Company Name</FieldLabel>
                  <TextInput type="text" name="name" value={formData.name}
                    onChange={handleInputChange} placeholder="Enter company name" error={errors.name} />
                  <FieldError msg={errors.name} />
                </div>

                <div>
                  <FieldLabel required>
                    <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> Email</span>
                  </FieldLabel>
                  <TextInput type="email" name="email" value={formData.email}
                    onChange={handleInputChange} placeholder="company@example.com" error={errors.email} />
                  <FieldError msg={errors.email} />
                </div>

                <div>
                  <FieldLabel>
                    <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> Phone</span>
                  </FieldLabel>
                  <TextInput type="tel" name="phone" value={formData.phone}
                    onChange={handleInputChange} placeholder="+91 1234567890" />
                </div>

                <div>
                  <FieldLabel>
                    <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> Website</span>
                  </FieldLabel>
                  <TextInput type="url" name="website" value={formData.website}
                    onChange={handleInputChange} placeholder="https://company.com" error={errors.website} />
                  <FieldError msg={errors.website} />
                </div>

                <div>
                  <FieldLabel required>
                    <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" /> Industry</span>
                  </FieldLabel>
                  <SelectInput name="industry" value={formData.industry}
                    onChange={handleInputChange} error={errors.industry}>
                    <option value="">Select Industry</option>
                    {industryOptions.map(ind => <option key={ind} value={ind}>{ind}</option>)}
                  </SelectInput>
                  {formData.industry === 'Other' && (
                    <TextInput type="text" name="industryOther" placeholder="Specify industry..."
                      className="w-full mt-2 px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formData.industryOther || ''} onChange={handleInputChange} />
                  )}
                  <FieldError msg={errors.industry} />
                </div>

                <div>
                  <FieldLabel>
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> Location</span>
                  </FieldLabel>
                  <TextInput type="text" name="location" value={formData.location}
                    onChange={handleInputChange} placeholder="City, State" />
                </div>

                <div>
                  <FieldLabel>Company Size</FieldLabel>
                  <SelectInput name="companySize" value={formData.companySize} onChange={handleInputChange}>
                    <option value="">Select Size</option>
                    {companySizeOptions.map(size => <option key={size} value={size}>{size} employees</option>)}
                  </SelectInput>
                </div>
              </div>
            </Section>

            {/* Additional Information */}
            <Section icon={FileText} title="Additional Information">
              <FieldLabel>Description</FieldLabel>
              <textarea name="description" value={formData.description} onChange={handleInputChange} rows="5"
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-300 transition-colors resize-none"
                placeholder="Enter company description..." />
            </Section>

          </div>{/* end MAIN FORM */}

          {/* ── SIDEBAR (1 col) ── */}
          <div className="flex flex-col gap-4">

            {/* Status */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-3 h-3 text-white" />
                </div>
                <h3 className="text-sm font-bold text-gray-800">Status</h3>
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="relative">
                  <input type="checkbox" name="isActive" checked={formData.isActive}
                    onChange={handleInputChange} className="sr-only" />
                  <div onClick={() => setFormData(p => ({ ...p, isActive: !p.isActive }))}
                    className={`w-9 h-5 rounded-full cursor-pointer transition-colors duration-200 ${
                      formData.isActive ? 'bg-gradient-to-r from-blue-500 to-cyan-400' : 'bg-gray-300'
                    }`}>
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                      formData.isActive ? 'translate-x-[18px]' : 'translate-x-[2px]'
                    }`} />
                  </div>
                </div>
                <span className="text-sm font-semibold text-gray-700">Company is Active</span>
              </label>
              <p className="text-[10px] text-gray-400 mt-2 ml-12">Active companies are visible to students</p>
            </div>

            {/* Actions */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Save className="w-3 h-3 text-white" />
                </div>
                <h3 className="text-sm font-bold text-gray-800">Actions</h3>
              </div>
              <div className="space-y-2">
                <button type="submit" disabled={saving}
                  className="w-full inline-flex items-center justify-center gap-1.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : isEditMode ? 'Update Company' : 'Create Company'}
                </button>
                <button type="button" onClick={() => navigate('/dashboard/college-admin/companies')}
                  className="w-full inline-flex items-center justify-center gap-1.5 bg-gray-100 text-gray-700 text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-gray-200 transition-all">
                  <X className="w-4 h-4" /> Cancel
                </button>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-gradient-to-br from-blue-600 via-blue-600 to-cyan-500 rounded-2xl p-4 text-white shadow-lg shadow-blue-500/20 relative overflow-hidden">
              <div className="absolute -top-6 -right-6 w-20 h-20 bg-white/10 rounded-full" />
              <div className="relative">
                <p className="text-xs font-bold text-white mb-2">💡 Tips</p>
                <ul className="text-[10px] text-blue-100 space-y-1.5">
                  <li>• Industry helps students filter by sector</li>
                  <li>• Add a website for credibility</li>
                  <li>• Description improves student interest</li>
                  <li>• Deactivate if company is not currently hiring</li>
                </ul>
              </div>
            </div>

          </div>{/* end SIDEBAR */}

        </div>
      </form>

    </CollegeAdminLayout>
  );
};

export default CompanyForm;