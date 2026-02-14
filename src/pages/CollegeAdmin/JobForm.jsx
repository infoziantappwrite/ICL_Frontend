// src/pages/CollegeAdmin/JobForm.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  X,
  Plus,
  Trash2,
  Building2,
  Briefcase,
  DollarSign,
  MapPin,
  Calendar,
  Users,
  GraduationCap,
  FileText,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { jobAPI, companyAPI } from '../../api/Api';

const JobForm = () => {
  const navigate = useNavigate();
  const { jobId } = useParams();
  const isEditMode = !!jobId;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [companies, setCompanies] = useState([]);

  const [formData, setFormData] = useState({
    // Basic Info
    jobCode: '',
    jobTitle: '',
    jobType: 'Full-Time',
    jobRole: '',
    companyId: '',
    
    // Description
    description: '',
    responsibilities: [''],
    requirements: [''],
    
    // Package
    package: {
      ctc: { min: '', max: '' },
      stipend: { amount: '', duration: '' },
      incentives: '',
      bondDetails: ''
    },
    
    // Locations
    locations: [{
      city: '',
      state: '',
      country: 'India',
      workMode: 'On-site'
    }],
    
    // Eligibility
    eligibilityCriteria: {
      minCGPA: '',
      maxBacklogs: '',
      branches: [],
      batchYear: new Date().getFullYear(),
      degreeTypes: []
    },
    
    // Dates
    dates: {
      applicationDeadline: '',
      interviewDate: '',
      joiningDate: ''
    },
    
    // Additional
    documentsRequired: [],
    selectionProcess: [''],
    status: 'Draft'
  });

  useEffect(() => {
    fetchCompanies();
    if (isEditMode) {
      fetchJobDetails();
    }
  }, [jobId]);

  const fetchCompanies = async () => {
    try {
      const response = await companyAPI.getAllCompanies({ isActive: true });
      if (response.success) {
        setCompanies(response.companies);
      }
    } catch (err) {
      console.error('Error fetching companies:', err);
    }
  };

  const fetchJobDetails = async () => {
    try {
      setLoading(true);
      const response = await jobAPI.getJobById(jobId);
      if (response.success) {
        setFormData(response.job);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e, saveAs) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const submitData = {
        ...formData,
        status: saveAs || formData.status
      };

      let response;
      if (isEditMode) {
        response = await jobAPI.updateJob(jobId, submitData);
      } else {
        response = await jobAPI.createJob(submitData);
      }

      if (response.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/dashboard/college-admin/jobs');
        }, 1500);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const updateNestedField = (parent, field, value) => {
    setFormData({
      ...formData,
      [parent]: { ...formData[parent], [field]: value }
    });
  };

  const addArrayItem = (field, template) => {
    setFormData({
      ...formData,
      [field]: [...formData[field], template]
    });
  };

  const updateArrayItem = (field, index, value) => {
    const newArray = [...formData[field]];
    newArray[index] = value;
    setFormData({ ...formData, [field]: newArray });
  };

  const removeArrayItem = (field, index) => {
    setFormData({
      ...formData,
      [field]: formData[field].filter((_, i) => i !== index)
    });
  };

  const addLocation = () => {
    addArrayItem('locations', {
      city: '',
      state: '',
      country: 'India',
      workMode: 'On-site'
    });
  };

  const updateLocation = (index, field, value) => {
    const newLocations = [...formData.locations];
    newLocations[index] = { ...newLocations[index], [field]: value };
    setFormData({ ...formData, locations: newLocations });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard/college-admin/jobs')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {isEditMode ? 'Edit Job Description' : 'Create New Job Description'}
                </h1>
                <p className="text-gray-600">
                  {isEditMode ? 'Update job details' : 'Fill in the details to create a new job posting'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 mb-6 flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <p className="text-green-800 font-medium">
              Job description {isEditMode ? 'updated' : 'created'} successfully! Redirecting...
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <form onSubmit={(e) => handleSubmit(e, null)} className="space-y-6">
          {/* Basic Information */}
          <Section title="Basic Information" icon={<Briefcase className="w-6 h-6" />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                label="Job Code"
                placeholder="JD-2024-001"
                value={formData.jobCode}
                onChange={(e) => updateField('jobCode', e.target.value)}
                required
              />
              <FormInput
                label="Job Title"
                placeholder="Software Engineer"
                value={formData.jobTitle}
                onChange={(e) => updateField('jobTitle', e.target.value)}
                required
              />
              <FormSelect
                label="Company"
                value={formData.companyId}
                onChange={(e) => updateField('companyId', e.target.value)}
                options={[
                  { value: '', label: 'Select Company' },
                  ...companies.map(company => ({
                    value: company._id,
                    label: company.displayName || company.name
                  }))
                ]}
                required
              />
              <FormSelect
                label="Job Type"
                value={formData.jobType}
                onChange={(e) => updateField('jobType', e.target.value)}
                options={[
                  { value: 'Full-Time', label: 'Full-Time' },
                  { value: 'Internship', label: 'Internship' },
                  { value: 'Internship + FTE', label: 'Internship + FTE' }
                ]}
                required
              />
              <FormSelect
                label="Job Role"
                value={formData.jobRole}
                onChange={(e) => updateField('jobRole', e.target.value)}
                options={[
                  { value: '', label: 'Select Role' },
                  { value: 'Software Engineer', label: 'Software Engineer' },
                  { value: 'Data Analyst', label: 'Data Analyst' },
                  { value: 'Frontend Developer', label: 'Frontend Developer' },
                  { value: 'Backend Developer', label: 'Backend Developer' },
                  { value: 'Full Stack Developer', label: 'Full Stack Developer' },
                  { value: 'Product Manager', label: 'Product Manager' },
                  { value: 'Other', label: 'Other' }
                ]}
                required
              />
            </div>

            <FormTextArea
              label="Job Description"
              placeholder="Provide a detailed description of the role..."
              value={formData.description}
              onChange={(e) => updateField('description', e.target.value)}
              rows={4}
              required
            />

            {/* Responsibilities */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Responsibilities
              </label>
              {formData.responsibilities.map((resp, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={resp}
                    onChange={(e) => updateArrayItem('responsibilities', index, e.target.value)}
                    placeholder="Enter responsibility"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => removeArrayItem('responsibilities', index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayItem('responsibilities', '')}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
              >
                <Plus className="w-4 h-4" />
                Add Responsibility
              </button>
            </div>

            {/* Requirements */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Requirements
              </label>
              {formData.requirements.map((req, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={req}
                    onChange={(e) => updateArrayItem('requirements', index, e.target.value)}
                    placeholder="Enter requirement"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => removeArrayItem('requirements', index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayItem('requirements', '')}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
              >
                <Plus className="w-4 h-4" />
                Add Requirement
              </button>
            </div>
          </Section>

          {/* Package Details */}
          <Section title="Package Details" icon={<DollarSign className="w-6 h-6" />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                label="Minimum CTC (LPA)"
                type="number"
                step="0.1"
                placeholder="5.0"
                value={formData.package.ctc.min}
                onChange={(e) => updateNestedField('package', 'ctc', {
                  ...formData.package.ctc,
                  min: e.target.value
                })}
                required
              />
              <FormInput
                label="Maximum CTC (LPA)"
                type="number"
                step="0.1"
                placeholder="8.0"
                value={formData.package.ctc.max}
                onChange={(e) => updateNestedField('package', 'ctc', {
                  ...formData.package.ctc,
                  max: e.target.value
                })}
              />
            </div>

            {formData.jobType.includes('Internship') && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                  label="Stipend Amount (₹)"
                  type="number"
                  placeholder="15000"
                  value={formData.package.stipend.amount}
                  onChange={(e) => updateNestedField('package', 'stipend', {
                    ...formData.package.stipend,
                    amount: e.target.value
                  })}
                />
                <FormInput
                  label="Stipend Duration"
                  placeholder="per month"
                  value={formData.package.stipend.duration}
                  onChange={(e) => updateNestedField('package', 'stipend', {
                    ...formData.package.stipend,
                    duration: e.target.value
                  })}
                />
              </div>
            )}

            <FormTextArea
              label="Incentives & Bonuses"
              placeholder="Performance bonuses, joining bonus, etc."
              value={formData.package.incentives}
              onChange={(e) => updateNestedField('package', 'incentives', e.target.value)}
              rows={2}
            />

            <FormTextArea
              label="Bond Details"
              placeholder="Service agreement details, if any"
              value={formData.package.bondDetails}
              onChange={(e) => updateNestedField('package', 'bondDetails', e.target.value)}
              rows={2}
            />
          </Section>

          {/* Locations */}
          <Section title="Job Locations" icon={<MapPin className="w-6 h-6" />}>
            {formData.locations.map((location, index) => (
              <div key={index} className="border-2 border-gray-200 rounded-xl p-4 mb-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-semibold text-gray-900">Location {index + 1}</h4>
                  {formData.locations.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeArrayItem('locations', index)}
                      className="text-red-600 hover:bg-red-50 p-2 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <FormInput
                    label="City"
                    placeholder="Bangalore"
                    value={location.city}
                    onChange={(e) => updateLocation(index, 'city', e.target.value)}
                    required
                  />
                  <FormInput
                    label="State"
                    placeholder="Karnataka"
                    value={location.state}
                    onChange={(e) => updateLocation(index, 'state', e.target.value)}
                    required
                  />
                  <FormInput
                    label="Country"
                    placeholder="India"
                    value={location.country}
                    onChange={(e) => updateLocation(index, 'country', e.target.value)}
                    required
                  />
                  <FormSelect
                    label="Work Mode"
                    value={location.workMode}
                    onChange={(e) => updateLocation(index, 'workMode', e.target.value)}
                    options={[
                      { value: 'On-site', label: 'On-site' },
                      { value: 'Remote', label: 'Remote' },
                      { value: 'Hybrid', label: 'Hybrid' }
                    ]}
                    required
                  />
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addLocation}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
            >
              <Plus className="w-4 h-4" />
              Add Location
            </button>
          </Section>

          {/* Eligibility Criteria */}
          <Section title="Eligibility Criteria" icon={<GraduationCap className="w-6 h-6" />}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormInput
                label="Minimum CGPA"
                type="number"
                step="0.01"
                placeholder="7.5"
                value={formData.eligibilityCriteria.minCGPA}
                onChange={(e) => updateNestedField('eligibilityCriteria', 'minCGPA', e.target.value)}
              />
              <FormInput
                label="Maximum Backlogs"
                type="number"
                placeholder="0"
                value={formData.eligibilityCriteria.maxBacklogs}
                onChange={(e) => updateNestedField('eligibilityCriteria', 'maxBacklogs', e.target.value)}
              />
              <FormInput
                label="Batch Year"
                type="number"
                placeholder="2024"
                value={formData.eligibilityCriteria.batchYear}
                onChange={(e) => updateNestedField('eligibilityCriteria', 'batchYear', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Eligible Branches
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {['CSE', 'ECE', 'EEE', 'MECH', 'IT', 'CIVIL'].map(branch => (
                  <label key={branch} className="flex items-center gap-2 p-2 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.eligibilityCriteria.branches.includes(branch)}
                      onChange={(e) => {
                        const branches = e.target.checked
                          ? [...formData.eligibilityCriteria.branches, branch]
                          : formData.eligibilityCriteria.branches.filter(b => b !== branch);
                        updateNestedField('eligibilityCriteria', 'branches', branches);
                      }}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">{branch}</span>
                  </label>
                ))}
              </div>
            </div>
          </Section>

          {/* Important Dates */}
          <Section title="Important Dates" icon={<Calendar className="w-6 h-6" />}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormInput
                label="Application Deadline"
                type="date"
                value={formData.dates.applicationDeadline?.split('T')[0]}
                onChange={(e) => updateNestedField('dates', 'applicationDeadline', e.target.value)}
                required
              />
              <FormInput
                label="Interview Date"
                type="date"
                value={formData.dates.interviewDate?.split('T')[0]}
                onChange={(e) => updateNestedField('dates', 'interviewDate', e.target.value)}
              />
              <FormInput
                label="Joining Date"
                type="date"
                value={formData.dates.joiningDate?.split('T')[0]}
                onChange={(e) => updateNestedField('dates', 'joiningDate', e.target.value)}
              />
            </div>
          </Section>

          {/* Selection Process */}
          <Section title="Selection Process" icon={<Users className="w-6 h-6" />}>
            {formData.selectionProcess.map((step, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={step}
                  onChange={(e) => updateArrayItem('selectionProcess', index, e.target.value)}
                  placeholder="e.g., Online Assessment, Technical Interview"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => removeArrayItem('selectionProcess', index)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => addArrayItem('selectionProcess', '')}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
            >
              <Plus className="w-4 h-4" />
              Add Step
            </button>
          </Section>

          {/* Action Buttons */}
          <div className="bg-white rounded-2xl shadow-lg p-6 sticky bottom-6">
            <div className="flex flex-col md:flex-row gap-3">
              <button
                type="button"
                onClick={() => navigate('/dashboard/college-admin/jobs')}
                className="flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              >
                <X className="w-5 h-5" />
                Cancel
              </button>
              <button
                type="button"
                onClick={(e) => handleSubmit(e, 'Draft')}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 transition-colors font-medium disabled:opacity-50"
              >
                <FileText className="w-5 h-5" />
                Save as Draft
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl font-medium disabled:opacity-50"
              >
                <Save className="w-5 h-5" />
                {saving ? 'Saving...' : (isEditMode ? 'Update Job' : 'Publish Job')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

// Section Component
const Section = ({ title, icon, children }) => (
  <div className="bg-white rounded-2xl shadow-lg p-6">
    <div className="flex items-center gap-3 mb-6">
      <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
        {icon}
      </div>
      <h2 className="text-xl font-bold text-gray-900">{title}</h2>
    </div>
    <div className="space-y-4">
      {children}
    </div>
  </div>
);

// Form Input Component
const FormInput = ({ label, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      {label} {props.required && <span className="text-red-500">*</span>}
    </label>
    <input
      {...props}
      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    />
  </div>
);

// Form Select Component
const FormSelect = ({ label, options, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      {label} {props.required && <span className="text-red-500">*</span>}
    </label>
    <select
      {...props}
      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    >
      {options.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </div>
);

// Form TextArea Component
const FormTextArea = ({ label, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      {label} {props.required && <span className="text-red-500">*</span>}
    </label>
    <textarea
      {...props}
      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
    />
  </div>
);

export default JobForm;