// src/pages/CollegeAdmin/JobForm.jsx - FIXED TO MATCH BACKEND SCHEMA
import { useToast } from '../../context/ToastContext';
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
  const toast = useToast();
  const navigate = useNavigate();
  const { jobId } = useParams();
  const isEditMode = !!jobId;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [companies, setCompanies] = useState([]);

  // FIXED: Match backend schema exactly
  const defaultFormData = {
    // Basic Info - MATCHES BACKEND
    jobCode: '',
    jobTitle: '',
    jobType: 'Full-Time',
    jobRole: 'Software Engineer',
    companyId: '',
    
    // Description
    description: '',
    responsibilities: [''],
    requirements: [''],
    preferredSkills: [],
    
    // Package - MATCHES BACKEND
    package: {
      ctc: { 
        min: '', 
        max: '' 
      },
      fixedPay: '',
      variablePay: '',
      joiningBonus: '',
      relocationAllowance: '',
      otherBenefits: ''
    },
    
    // Locations - MATCHES BACKEND
    locations: [{
      city: '',
      state: '',
      country: 'India',
      workMode: 'On-site'
    }],
    
    // FIXED: Use 'eligibility' not 'eligibilityCriteria'
    eligibility: {
      branches: [],
      batches: [],  // FIXED: Use batches array not batchYear
      minCGPA: '',
      maxBacklogs: '',
      maxGapYears: '',
      activeBacklogsAllowed: false,
      tenthPercentage: '',
      twelfthPercentage: ''
    },
    
    // Dates - MATCHES BACKEND
    dates: {
      applicationDeadline: '',
      interviewDate: '',
      resultDate: ''
    },
    
    // FIXED: selectionProcess is object with rounds array
    selectionProcess: {
      rounds: [{
        name: 'Online Test',
        description: '',
        duration: ''
      }],
      totalRounds: 1
    },
    
    // Documents - MATCHES BACKEND (object not array)
    documentsRequired: {
      resume: true,
      coverLetter: false,
      marksheets: true,
      certificates: false,
      other: ''
    },
    
    // Status
    status: 'Draft',
    isPinned: false,
    tags: [],
    notes: ''
  };

  const [formData, setFormData] = useState(defaultFormData);

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

  // FIXED: Properly merge API data with defaults
  const fetchJobDetails = async () => {
    try {
      setLoading(true);
      const response = await jobAPI.getJobById(jobId);
      
      if (response.success && response.job) {
        const job = response.job;
        console.log('Fetched job:', job);
        
        setFormData({
          ...defaultFormData,
          ...job,
          // Ensure nested objects are properly merged
          package: {
            ...defaultFormData.package,
            ...(job.package || {}),
            ctc: {
              min: job.package?.ctc?.min || '',
              max: job.package?.ctc?.max || ''
            }
          },
          eligibility: {
            ...defaultFormData.eligibility,
            ...(job.eligibility || {}),
            branches: job.eligibility?.branches || [],
            batches: job.eligibility?.batches || []
          },
          dates: {
            ...defaultFormData.dates,
            ...(job.dates || {}),
            applicationDeadline: job.dates?.applicationDeadline?.split('T')[0] || '',
            interviewDate: job.dates?.interviewDate?.split('T')[0] || '',
            resultDate: job.dates?.resultDate?.split('T')[0] || ''
          },
          locations: job.locations?.length > 0 ? job.locations : defaultFormData.locations,
          responsibilities: job.responsibilities?.length > 0 ? job.responsibilities : [''],
          requirements: job.requirements?.length > 0 ? job.requirements : [''],
          preferredSkills: job.preferredSkills || [],
          selectionProcess: {
            rounds: job.selectionProcess?.rounds?.length > 0 
              ? job.selectionProcess.rounds 
              : defaultFormData.selectionProcess.rounds,
            totalRounds: job.selectionProcess?.totalRounds || 1
          },
          documentsRequired: {
            ...defaultFormData.documentsRequired,
            ...(job.documentsRequired || {})
          }
        });
      }
    } catch (err) {
      console.error('Error fetching job details:', err);
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
      // Prepare data for backend
      const submitData = {
        ...formData,
        status: saveAs || formData.status,
        // Update totalRounds
        selectionProcess: {
          ...formData.selectionProcess,
          totalRounds: formData.selectionProcess.rounds.length
        }
      };

      console.log('Submitting job data:', submitData);

      let response;
      if (isEditMode) {
        response = await jobAPI.updateJob(jobId, submitData);
      } else {
        response = await jobAPI.createJob(submitData);
      }

      if (response.success) {
        setSuccess(true);
        toast.success(isEditMode ? 'Job Updated!' : 'Job Created!', `Job ${isEditMode ? 'updated' : 'created'} successfully. Redirecting...`);
        setTimeout(() => {
          navigate('/dashboard/college-admin/jobs');
        }, 1500);
      }
    } catch (err) {
      console.error('Submit error:', err);
      setError(err.message);
      toast.error('Save Failed', err.message || 'Could not save the job. Please try again.');
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

  const updateDoubleNestedField = (parent, child, field, value) => {
    setFormData({
      ...formData,
      [parent]: {
        ...formData[parent],
        [child]: {
          ...formData[parent][child],
          [field]: value
        }
      }
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

  const addSelectionRound = () => {
    setFormData({
      ...formData,
      selectionProcess: {
        ...formData.selectionProcess,
        rounds: [
          ...formData.selectionProcess.rounds,
          { name: 'Online Test', description: '', duration: '' }
        ]
      }
    });
  };

  const updateSelectionRound = (index, field, value) => {
    const newRounds = [...formData.selectionProcess.rounds];
    newRounds[index] = { ...newRounds[index], [field]: value };
    setFormData({
      ...formData,
      selectionProcess: {
        ...formData.selectionProcess,
        rounds: newRounds
      }
    });
  };

  const removeSelectionRound = (index) => {
    setFormData({
      ...formData,
      selectionProcess: {
        ...formData.selectionProcess,
        rounds: formData.selectionProcess.rounds.filter((_, i) => i !== index)
      }
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

  const toggleBranch = (branch) => {
    const branches = formData.eligibility.branches.includes(branch)
      ? formData.eligibility.branches.filter(b => b !== branch)
      : [...formData.eligibility.branches, branch];
    
    setFormData({
      ...formData,
      eligibility: {
        ...formData.eligibility,
        branches
      }
    });
  };

  const toggleBatch = (batch) => {
    const batches = formData.eligibility.batches.includes(batch)
      ? formData.eligibility.batches.filter(b => b !== batch)
      : [...formData.eligibility.batches, batch];
    
    setFormData({
      ...formData,
      eligibility: {
        ...formData.eligibility,
        batches
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  const branches = ['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL', 'Other'];
  const batches = ['2024', '2025', '2026', '2027', '2028'];
  const roundTypes = ['Online Test', 'Technical Interview', 'HR Interview', 'Group Discussion', 'Case Study', 'Other'];

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
              Job {isEditMode ? 'updated' : 'created'} successfully! Redirecting...
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
                placeholder="Auto-generated if left empty"
                value={formData.jobCode}
                onChange={(e) => updateField('jobCode', e.target.value)}
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
                    label: company.name
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
                  { value: 'Software Engineer', label: 'Software Engineer' },
                  { value: 'Data Analyst', label: 'Data Analyst' },
                  { value: 'Business Analyst', label: 'Business Analyst' },
                  { value: 'Product Manager', label: 'Product Manager' },
                  { value: 'DevOps Engineer', label: 'DevOps Engineer' },
                  { value: 'Quality Assurance', label: 'Quality Assurance' },
                  { value: 'Frontend Developer', label: 'Frontend Developer' },
                  { value: 'Backend Developer', label: 'Backend Developer' },
                  { value: 'Full Stack Developer', label: 'Full Stack Developer' },
                  { value: 'UI/UX Designer', label: 'UI/UX Designer' },
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
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  {formData.responsibilities.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeArrayItem('responsibilities', index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
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
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  {formData.requirements.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeArrayItem('requirements', index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
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
                onChange={(e) => updateDoubleNestedField('package', 'ctc', 'min', e.target.value)}
                required
              />
              <FormInput
                label="Maximum CTC (LPA)"
                type="number"
                step="0.1"
                placeholder="8.0"
                value={formData.package.ctc.max}
                onChange={(e) => updateDoubleNestedField('package', 'ctc', 'max', e.target.value)}
              />
              <FormInput
                label="Fixed Pay (LPA)"
                type="number"
                step="0.1"
                placeholder="6.0"
                value={formData.package.fixedPay}
                onChange={(e) => updateNestedField('package', 'fixedPay', e.target.value)}
              />
              <FormInput
                label="Variable Pay (LPA)"
                type="number"
                step="0.1"
                placeholder="2.0"
                value={formData.package.variablePay}
                onChange={(e) => updateNestedField('package', 'variablePay', e.target.value)}
              />
              <FormInput
                label="Joining Bonus"
                type="number"
                placeholder="50000"
                value={formData.package.joiningBonus}
                onChange={(e) => updateNestedField('package', 'joiningBonus', e.target.value)}
              />
              <FormInput
                label="Relocation Allowance"
                type="number"
                placeholder="25000"
                value={formData.package.relocationAllowance}
                onChange={(e) => updateNestedField('package', 'relocationAllowance', e.target.value)}
              />
            </div>

            <FormTextArea
              label="Other Benefits"
              placeholder="Health insurance, meal vouchers, etc."
              value={formData.package.otherBenefits}
              onChange={(e) => updateNestedField('package', 'otherBenefits', e.target.value)}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                label="Minimum CGPA"
                type="number"
                step="0.01"
                min="0"
                max="10"
                placeholder="7.5"
                value={formData.eligibility.minCGPA}
                onChange={(e) => updateNestedField('eligibility', 'minCGPA', e.target.value)}
              />
              <FormInput
                label="Maximum Backlogs"
                type="number"
                min="0"
                placeholder="0"
                value={formData.eligibility.maxBacklogs}
                onChange={(e) => updateNestedField('eligibility', 'maxBacklogs', e.target.value)}
              />
              <FormInput
                label="Maximum Gap Years"
                type="number"
                min="0"
                placeholder="0"
                value={formData.eligibility.maxGapYears}
                onChange={(e) => updateNestedField('eligibility', 'maxGapYears', e.target.value)}
              />
              <FormInput
                label="10th Percentage"
                type="number"
                step="0.01"
                min="0"
                max="100"
                placeholder="60"
                value={formData.eligibility.tenthPercentage}
                onChange={(e) => updateNestedField('eligibility', 'tenthPercentage', e.target.value)}
              />
              <FormInput
                label="12th Percentage"
                type="number"
                step="0.01"
                min="0"
                max="100"
                placeholder="60"
                value={formData.eligibility.twelfthPercentage}
                onChange={(e) => updateNestedField('eligibility', 'twelfthPercentage', e.target.value)}
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <input
                  type="checkbox"
                  checked={formData.eligibility.activeBacklogsAllowed}
                  onChange={(e) => updateNestedField('eligibility', 'activeBacklogsAllowed', e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                Allow Active Backlogs
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Eligible Branches *
              </label>
              <div className="flex flex-wrap gap-2">
                {branches.map(branch => (
                  <button
                    key={branch}
                    type="button"
                    onClick={() => toggleBranch(branch)}
                    className={`px-4 py-2 rounded-lg border-2 transition-all ${
                      formData.eligibility.branches.includes(branch)
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'border-gray-300 text-gray-700 hover:border-blue-400'
                    }`}
                  >
                    {branch}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Eligible Batches *
              </label>
              <div className="flex flex-wrap gap-2">
                {batches.map(batch => (
                  <button
                    key={batch}
                    type="button"
                    onClick={() => toggleBatch(batch)}
                    className={`px-4 py-2 rounded-lg border-2 transition-all ${
                      formData.eligibility.batches.includes(batch)
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'border-gray-300 text-gray-700 hover:border-blue-400'
                    }`}
                  >
                    {batch}
                  </button>
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
                value={formData.dates.applicationDeadline}
                onChange={(e) => updateNestedField('dates', 'applicationDeadline', e.target.value)}
                required
              />
              <FormInput
                label="Interview Date"
                type="date"
                value={formData.dates.interviewDate}
                onChange={(e) => updateNestedField('dates', 'interviewDate', e.target.value)}
              />
              <FormInput
                label="Result Date"
                type="date"
                value={formData.dates.resultDate}
                onChange={(e) => updateNestedField('dates', 'resultDate', e.target.value)}
              />
            </div>
          </Section>

          {/* Selection Process */}
          <Section title="Selection Process" icon={<Users className="w-6 h-6" />}>
            {formData.selectionProcess.rounds.map((round, index) => (
              <div key={index} className="border-2 border-gray-200 rounded-xl p-4 mb-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-semibold text-gray-900">Round {index + 1}</h4>
                  {formData.selectionProcess.rounds.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSelectionRound(index)}
                      className="text-red-600 hover:bg-red-50 p-2 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <FormSelect
                    label="Round Type"
                    value={round.name}
                    onChange={(e) => updateSelectionRound(index, 'name', e.target.value)}
                    options={roundTypes.map(type => ({ value: type, label: type }))}
                  />
                  <FormInput
                    label="Duration"
                    placeholder="60 minutes"
                    value={round.duration}
                    onChange={(e) => updateSelectionRound(index, 'duration', e.target.value)}
                  />
                  <div className="md:col-span-3">
                    <FormTextArea
                      label="Description"
                      placeholder="Describe this round..."
                      value={round.description}
                      onChange={(e) => updateSelectionRound(index, 'description', e.target.value)}
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addSelectionRound}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
            >
              <Plus className="w-4 h-4" />
              Add Selection Round
            </button>
          </Section>

          {/* Documents Required */}
          <Section title="Documents Required" icon={<FileText className="w-6 h-6" />}>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.documentsRequired.resume}
                  onChange={(e) => updateNestedField('documentsRequired', 'resume', e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm font-medium text-gray-700">Resume</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.documentsRequired.coverLetter}
                  onChange={(e) => updateNestedField('documentsRequired', 'coverLetter', e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm font-medium text-gray-700">Cover Letter</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.documentsRequired.marksheets}
                  onChange={(e) => updateNestedField('documentsRequired', 'marksheets', e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm font-medium text-gray-700">Marksheets</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.documentsRequired.certificates}
                  onChange={(e) => updateNestedField('documentsRequired', 'certificates', e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm font-medium text-gray-700">Certificates</span>
              </label>
              <FormInput
                label="Other Documents"
                placeholder="Any other documents needed..."
                value={formData.documentsRequired.other}
                onChange={(e) => updateNestedField('documentsRequired', 'other', e.target.value)}
              />
            </div>
          </Section>

          {/* Action Buttons */}
          <div className="bg-white rounded-2xl shadow-lg p-6 sticky bottom-6">
            <div className="flex flex-col md:flex-row gap-3">
              <button
                type="button"
                onClick={() => navigate('/dashboard/college-admin/jobs')}
                className="flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium"
              >
                <X className="w-5 h-5" />
                Cancel
              </button>
              <button
                type="button"
                onClick={(e) => handleSubmit(e, 'Draft')}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 font-medium disabled:opacity-50"
              >
                <FileText className="w-5 h-5" />
                Save as Draft
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 shadow-lg font-medium disabled:opacity-50"
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