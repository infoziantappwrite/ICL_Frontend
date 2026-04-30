// src/pages/CollegeAdmin/JobForm.jsx — redesigned to match SuperAdmin/CollegeAdmin theme
import Select from "react-select";
import { useToast } from '../../context/ToastContext';
import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, Save, X, Plus, Trash2, Building2, Briefcase, DollarSign,
  MapPin, Calendar, Users, GraduationCap, FileText, AlertCircle, CheckCircle, Tag,
} from 'lucide-react';
import CollegeAdminLayout from '../../components/layout/CollegeAdminLayout';
import { DetailSkeleton } from '../../components/common/SkeletonLoader';
import apiCall, { jobAPI, companyAPI, skillAPI, branchAPI } from '../../api/Api';

/* ─── ChipInput ─────────────────────────── */
const ChipInput = ({ label, hint, values, onChange, placeholder }) => {
  const [inputVal, setInputVal] = useState('');
  const add = () => {
    const v = inputVal.trim();
    if (v && !values.includes(v)) onChange([...values, v]);
    setInputVal('');
  };
  const remove = (i) => onChange(values.filter((_, idx) => idx !== i));
  return (
    <div>
      <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest tracking-wider mb-1.5">{label}</label>
      {hint && <p className="text-[10px] text-slate-400 mb-2">{hint}</p>}
      <div className="flex gap-2 mb-2">
        <input type="text" value={inputVal} onChange={e => setInputVal(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          placeholder={placeholder || 'Type and press Enter or click Add'}
          className="flex-1 px-3 py-2 text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#003399]/30 hover:border-gray-300 transition-colors bg-white" />
        <button type="button" onClick={add}
          className="px-3 py-2 bg-[#003399] text-white text-[13px] font-black rounded-xl flex items-center gap-1 hover:bg-[#002d8b] transition-all shadow-lg shadow-blue-500/10 active:scale-95">
          <Plus className="w-3.5 h-3.5" /> Add
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {values.map((v, i) => (
          <span key={i} className="flex items-center gap-1 px-2.5 py-1 bg-[#003399]/5 text-[#003399] text-xs rounded-full font-semibold border border-[#003399]/10">
            {v}
            <button type="button" onClick={() => remove(i)} className="hover:text-[#003399] transition-colors"><X className="w-3 h-3" /></button>
          </span>
        ))}
        {values.length === 0 && <span className="text-[10px] text-slate-400 italic">None added yet</span>}
      </div>
    </div>
  );
};

/* ─── Section card ─────────────────────── */
const Section = ({ icon: Icon, title, children }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 md:p-6">
    <div className="flex items-center gap-2 mb-4">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border border-[#003399]/20 bg-[#003399]/5">
        <Icon className="w-4 h-4 text-[#003399]" />
      </div>
      <h3 className="text-[15px] md:text-[16px] font-bold text-gray-900">{title}</h3>
    </div>
    <div className="space-y-4">{children}</div>
  </div>
);

/* ─── Shared form atoms ─────────────────── */
const FieldLabel = ({ children, required }) => (
  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest tracking-wider mb-1.5">
    {children}{required && <span className="text-red-400 ml-0.5">*</span>}
  </label>
);

const TextInput = ({ label, required, ...props }) => (
  <div>
    {label && <FieldLabel required={required}>{label}</FieldLabel>}
    <input {...props}
      className="w-full px-3 py-2 text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#003399]/30 hover:border-gray-300 transition-colors bg-white" />
  </div>
);

const SelectInput = ({ label, required, options, ...props }) => (
  <div>
    {label && <FieldLabel required={required}>{label}</FieldLabel>}
    <select {...props}
      className="w-full px-3 py-2 text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#003399]/30 bg-white hover:border-gray-300 transition-colors appearance-none">
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);

const TextArea = ({ label, required, ...props }) => (
  <div>
    {label && <FieldLabel required={required}>{label}</FieldLabel>}
    <textarea {...props}
      className="w-full px-3 py-2 text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#003399]/30 hover:border-gray-300 transition-colors resize-none bg-white" />
  </div>
);

const getSkillName = (skill) => {
  if (typeof skill === 'string') return skill.trim();
  if (skill && typeof skill === 'object') return (skill.name || skill.label || skill.value || '').trim();
  return '';
};

const getBranchCode = (branch) => {
  if (typeof branch === 'string') return branch.trim();
  if (branch && typeof branch === 'object') return (branch.code || branch.name || '').trim();
  return '';
};

const getBranchLabel = (branch) => {
  if (typeof branch === 'string') return branch.trim();
  if (branch && typeof branch === 'object') {
    const code = (branch.code || '').trim();
    const name = (branch.name || '').trim();
    if (code && name && code !== name) return `${code} - ${name}`;
    return code || name;
  }
  return '';
};

const DEFAULT_COUNTRY = { name: 'India', isoCode: 'IN' };

const createLocationMeta = () => ({
  stateOptions: [],
  cityOptions: [],
  selectedCountryCode: DEFAULT_COUNTRY.isoCode,
  selectedStateCode: '',
  loadedStatesForCountry: '',
  loadedCitiesForCountry: '',
  loadedCitiesForState: '',
  statesLoading: false,
  citiesLoading: false,
});

const selectStyles = {
  control: (base, state) => ({
    ...base,
    minHeight: 38,
    borderRadius: 8,
    borderColor: state.isFocused ? '#3b82f6' : '#e5e7eb',
    boxShadow: state.isFocused ? '0 0 0 2px rgba(59, 130, 246, 0.15)' : 'none',
    '&:hover': {
      borderColor: state.isFocused ? '#3b82f6' : '#d1d5db',
    },
  }),
  placeholder: (base) => ({
    ...base,
    color: '#9ca3af',
    fontSize: '0.875rem',
  }),
  singleValue: (base) => ({
    ...base,
    fontSize: '0.875rem',
    color: '#111827',
  }),
  input: (base) => ({
    ...base,
    fontSize: '0.875rem',
  }),
  option: (base, state) => ({
    ...base,
    fontSize: '0.875rem',
    backgroundColor: state.isFocused ? '#eff6ff' : state.isSelected ? '#dbeafe' : '#fff',
    color: '#111827',
  }),
  menuPortal: (base) => ({
    ...base,
    zIndex: 9999,
  }),
  menu: (base) => ({
    ...base,
    zIndex: 9999,
  }),
};

/* ══════════════════════════════════════════ */
const JobForm = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const { jobId } = useParams();
  const [searchParams] = useSearchParams();
  const isEditMode = !!jobId;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [skills, setSkills] = useState([]);
  const [branches, setBranches] = useState([]);
  const [countryOptions, setCountryOptions] = useState([]);
  const [countryLoading, setCountryLoading] = useState(false);
  const [locationMeta, setLocationMeta] = useState([createLocationMeta()]);

  const defaultFormData = {
    jobCode: '', jobTitle: '', jobType: 'Full-Time', jobRole: 'Software Engineer', companyId: '',
    description: '', responsibilities: [''], requirements: [''], preferredSkills: [],
    package: { ctc: { min: '', max: '' }, fixedPay: '', variablePay: '', joiningBonus: '', relocationAllowance: '', otherBenefits: '' },
    locations: [{ city: '', state: '', country: 'India', workMode: 'On-site' }],
    eligibility: { branches: [], batches: [], minCGPA: '', maxBacklogs: '', maxGapYears: '', activeBacklogsAllowed: false, tenthPercentage: '', twelfthPercentage: '' },
    dates: { applicationDeadline: '', interviewDate: '', resultDate: '' },
    selectionProcess: { rounds: [{ name: 'Online Test', description: '', duration: '' }], totalRounds: 1 },
    documentsRequired: { resume: true, coverLetter: false, marksheets: true, certificates: false, other: '' },
    status: 'Draft', isPinned: false, tags: [], notes: '',
  };

  const [formData, setFormData] = useState(defaultFormData);

  const batches = ['2024', '2025', '2026', '2027', '2028'];
  const roundTypes = ['Online Test', 'Technical Interview', 'HR Interview', 'Group Discussion', 'Case Study', 'Other'];

  useEffect(() => {
    fetchCompanies();
    fetchSkills();
    fetchBranches();
    fetchCountries();

    if (isEditMode) fetchJobDetails();
  }, [jobId]);

  useEffect(() => {
    setLocationMeta((prev) =>
      formData.locations.map((_, index) => prev[index] || createLocationMeta())
    );
  }, [formData.locations.length]);

  const fetchCompanies = async () => {
    try {
      const response = await companyAPI.getAllCompanies({ isActive: true });
      if (response.success) {
        setCompanies(response.companies);
        const prefilledCompanyId = searchParams.get('companyId');
        if (prefilledCompanyId && !isEditMode) setFormData(prev => ({ ...prev, companyId: prefilledCompanyId }));
      }
    } catch (err) { console.error('Error fetching companies:', err); }
  };

  const fetchSkills = async () => {
    try {
      const response = await skillAPI.getAllSkills();

      if (response.success) {
        setSkills(response.skills);
      }
    } catch (error) {
      console.error("Error fetching skills:", error);
    }
  };

  const fetchBranches = async () => {
    try {
      const response = await branchAPI.getActiveBranches();
      if (response.success) {
        setBranches(response.branches || []);
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  const updateLocationMeta = (index, updates) => {
    setLocationMeta((prev) =>
      prev.map((meta, metaIndex) =>
        metaIndex === index ? { ...meta, ...updates } : meta
      )
    );
  };

  const fetchCountries = async () => {
    try {
      setCountryLoading(true);
      const response = await apiCall('/location/countries');
      if (response.success) {
        setCountryOptions(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching countries:', error);
      toast.error('Error', 'Unable to load countries');
    } finally {
      setCountryLoading(false);
    }
  };

  const fetchStates = async (index, countryCode) => {
    if (!countryCode) {
      updateLocationMeta(index, {
        selectedCountryCode: '',
        selectedStateCode: '',
        stateOptions: [],
        cityOptions: [],
        loadedStatesForCountry: '',
        loadedCitiesForCountry: '',
        loadedCitiesForState: '',
        statesLoading: false,
        citiesLoading: false,
      });
      return;
    }

    updateLocationMeta(index, {
      statesLoading: true,
      selectedCountryCode: countryCode,
      selectedStateCode: '',
      stateOptions: [],
      cityOptions: [],
      loadedStatesForCountry: '',
      loadedCitiesForCountry: '',
      loadedCitiesForState: '',
    });

    try {
      const response = await apiCall(`/location/states/${countryCode}`);
      updateLocationMeta(index, {
        stateOptions: response.success ? response.data || [] : [],
        loadedStatesForCountry: countryCode,
      });
    } catch (error) {
      console.error('Error fetching states:', error);
      updateLocationMeta(index, {
        stateOptions: [],
        loadedStatesForCountry: countryCode,
      });
      toast.error('Error', 'Unable to load states');
    } finally {
      updateLocationMeta(index, { statesLoading: false });
    }
  };

  const fetchCities = async (index, countryCode, stateCode) => {
    if (!countryCode || !stateCode) {
      updateLocationMeta(index, {
        selectedStateCode: '',
        cityOptions: [],
        loadedCitiesForCountry: '',
        loadedCitiesForState: '',
        citiesLoading: false,
      });
      return;
    }

    updateLocationMeta(index, {
      citiesLoading: true,
      selectedStateCode: stateCode,
      cityOptions: [],
      loadedCitiesForCountry: '',
      loadedCitiesForState: '',
    });

    try {
      const response = await apiCall(`/location/cities/${countryCode}/${stateCode}`);
      updateLocationMeta(index, {
        cityOptions: response.success ? response.data || [] : [],
        loadedCitiesForCountry: countryCode,
        loadedCitiesForState: stateCode,
      });
    } catch (error) {
      console.error('Error fetching cities:', error);
      updateLocationMeta(index, {
        cityOptions: [],
        loadedCitiesForCountry: countryCode,
        loadedCitiesForState: stateCode,
      });
      toast.error('Error', 'Unable to load cities');
    } finally {
      updateLocationMeta(index, { citiesLoading: false });
    }
  };

  const normalizedPreferredSkills = formData.preferredSkills
    .map(getSkillName)
    .filter(Boolean);

  const skillOptions = [...new Set([
    ...skills.map(getSkillName),
    ...normalizedPreferredSkills,
  ])]
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b))
    .map((skillName) => ({
      value: skillName,
      label: skillName,
    }));

  const selectedSkillOptions = normalizedPreferredSkills.map((skillName) => ({
    value: skillName,
    label: skillName,
  }));

  const branchOptions = [...new Set([
    ...branches.map(getBranchCode),
    ...formData.eligibility.branches.map((branch) => branch?.trim()).filter(Boolean),
  ])]
    .filter(Boolean)
    .map((code) => {
      const matchingBranch = branches.find((branch) => getBranchCode(branch) === code);
      return {
        value: code,
        label: matchingBranch ? getBranchLabel(matchingBranch) : code,
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label));

  const selectedBranchOptions = branchOptions.filter((branch) =>
    formData.eligibility.branches.includes(branch.value)
  );

  const countrySelectOptions = countryOptions.map((country) => ({
    value: country.isoCode,
    label: country.name,
  }));

  const getStateSelectOptions = (index) =>
    (locationMeta[index]?.stateOptions || []).map((state) => ({
      value: state.isoCode,
      label: state.name,
    }));

  const getCitySelectOptions = (index) =>
    (locationMeta[index]?.cityOptions || []).map((city) => ({
      value: city.name,
      label: city.name,
    }));

  const getSelectedCountryOption = (index, location) =>
    countrySelectOptions.find((option) => option.value === locationMeta[index]?.selectedCountryCode) ||
    countrySelectOptions.find((option) => option.label === location.country) ||
    (location.country ? { value: location.country, label: location.country } : null);

  const getSelectedStateOption = (index, location) => {
    const stateOptions = getStateSelectOptions(index);
    return (
      stateOptions.find((option) => option.value === locationMeta[index]?.selectedStateCode) ||
      stateOptions.find((option) => option.label === location.state) ||
      (location.state ? { value: location.state, label: location.state } : null)
    );
  };

  const getSelectedCityOption = (index, location) => {
    const cityOptions = getCitySelectOptions(index);
    return (
      cityOptions.find((option) => option.value === location.city) ||
      (location.city ? { value: location.city, label: location.city } : null)
    );
  };

  useEffect(() => {
    if (!countryOptions.length) {
      return;
    }

    formData.locations.forEach((location, index) => {
      const meta = locationMeta[index];
      if (!meta) {
        return;
      }

      const currentCountry = location.country || DEFAULT_COUNTRY.name;
      const matchedCountry =
        countryOptions.find((country) => country.name === currentCountry) ||
        countryOptions.find((country) => country.isoCode === DEFAULT_COUNTRY.isoCode);

      if (!matchedCountry) {
        updateLocationMeta(index, {
          selectedCountryCode: '',
          selectedStateCode: '',
          stateOptions: [],
          cityOptions: [],
          loadedStatesForCountry: '',
          loadedCitiesForCountry: '',
          loadedCitiesForState: '',
        });
        return;
      }

      if (currentCountry !== matchedCountry.name) {
        updateLocation(index, 'country', matchedCountry.name);
      }

      if (meta.selectedCountryCode !== matchedCountry.isoCode) {
        updateLocationMeta(index, { selectedCountryCode: matchedCountry.isoCode });
      }

      if (meta.loadedStatesForCountry !== matchedCountry.isoCode) {
        fetchStates(index, matchedCountry.isoCode);
      }
    });
  }, [countryOptions, formData.locations]);

  useEffect(() => {
    formData.locations.forEach((location, index) => {
      const meta = locationMeta[index];
      if (!meta) {
        return;
      }

      if (!location.state || !meta.stateOptions.length || !meta.selectedCountryCode) {
        if (meta.selectedStateCode || meta.cityOptions.length || meta.loadedCitiesForState) {
          updateLocationMeta(index, {
            selectedStateCode: '',
            cityOptions: [],
            loadedCitiesForCountry: '',
            loadedCitiesForState: '',
          });
        }
        return;
      }

      const matchedState = meta.stateOptions.find((state) => state.name === location.state);

      if (!matchedState) {
        if (meta.selectedStateCode || meta.cityOptions.length || meta.loadedCitiesForState) {
          updateLocationMeta(index, {
            selectedStateCode: '',
            cityOptions: [],
            loadedCitiesForCountry: '',
            loadedCitiesForState: '',
          });
        }
        return;
      }

      if (meta.selectedStateCode !== matchedState.isoCode) {
        updateLocationMeta(index, { selectedStateCode: matchedState.isoCode });
      }

      if (
        meta.loadedCitiesForCountry !== meta.selectedCountryCode ||
        meta.loadedCitiesForState !== matchedState.isoCode
      ) {
        fetchCities(index, meta.selectedCountryCode, matchedState.isoCode);
      }
    });
  }, [formData.locations, locationMeta]);

  const fetchJobDetails = async () => {
    try {
      setLoading(true);
      const response = await jobAPI.getJobById(jobId);
      if (response.success && response.job) {
        const job = response.job;
        setFormData({
          ...defaultFormData, ...job,
          package: { ...defaultFormData.package, ...(job.package || {}), ctc: { min: job.package?.ctc?.min || '', max: job.package?.ctc?.max || '' } },
          eligibility: { ...defaultFormData.eligibility, ...(job.eligibility || {}), branches: job.eligibility?.branches || [], batches: job.eligibility?.batches || [] },
          dates: { ...defaultFormData.dates, ...(job.dates || {}), applicationDeadline: job.dates?.applicationDeadline?.split('T')[0] || '', interviewDate: job.dates?.interviewDate?.split('T')[0] || '', resultDate: job.dates?.resultDate?.split('T')[0] || '' },
          locations: job.locations?.length > 0 ? job.locations : defaultFormData.locations,
          responsibilities: job.responsibilities?.length > 0 ? job.responsibilities : [''],
          requirements: job.requirements?.length > 0 ? job.requirements : [''],
          preferredSkills: (job.preferredSkills || []).map(getSkillName).filter(Boolean),
          tags: job.tags || [], notes: job.notes || '',
          selectionProcess: { rounds: job.selectionProcess?.rounds?.length > 0 ? job.selectionProcess.rounds : defaultFormData.selectionProcess.rounds, totalRounds: job.selectionProcess?.totalRounds || 1 },
          documentsRequired: { ...defaultFormData.documentsRequired, ...(job.documentsRequired || {}) },
        });
      }
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e, saveAs) => {
    e.preventDefault();
    setSaving(true); setError(null); setSuccess(false);
    try {
      const hasIncompleteLocation = formData.locations.some(
        (location) => !location.country || !location.state || !location.city
      );

      if (hasIncompleteLocation && saveAs !== 'Draft') {
        throw new Error('Please select country, state, and city for every location');
      }

      const submitData = {
        ...formData,
        status: saveAs || formData.status,
        selectionProcess: { ...formData.selectionProcess, totalRounds: formData.selectionProcess.rounds.length },
        package: {
          ...formData.package,
          ctc: {
            min: formData.package.ctc.min !== '' ? parseFloat(formData.package.ctc.min) : undefined,
            max: formData.package.ctc.max !== '' ? parseFloat(formData.package.ctc.max) : undefined,
          },
          fixedPay: formData.package.fixedPay !== '' ? parseFloat(formData.package.fixedPay) : undefined,
          variablePay: formData.package.variablePay !== '' ? parseFloat(formData.package.variablePay) : undefined,
          joiningBonus: formData.package.joiningBonus !== '' ? parseFloat(formData.package.joiningBonus) : undefined,
          relocationAllowance: formData.package.relocationAllowance !== '' ? parseFloat(formData.package.relocationAllowance) : undefined,
        },
        eligibility: {
          ...formData.eligibility,
          minCGPA: formData.eligibility.minCGPA !== '' ? parseFloat(formData.eligibility.minCGPA) : 0,
          maxBacklogs: formData.eligibility.maxBacklogs !== '' ? parseInt(formData.eligibility.maxBacklogs) : 0,
          maxGapYears: formData.eligibility.maxGapYears !== '' ? parseInt(formData.eligibility.maxGapYears) : 0,
          tenthPercentage: formData.eligibility.tenthPercentage !== '' ? parseFloat(formData.eligibility.tenthPercentage) : undefined,
          twelfthPercentage: formData.eligibility.twelfthPercentage !== '' ? parseFloat(formData.eligibility.twelfthPercentage) : undefined,
        },
      };
      const response = isEditMode ? await jobAPI.updateJob(jobId, submitData) : await jobAPI.createJob(submitData);
      if (response.success) {
        setSuccess(true);
        toast.success(isEditMode ? 'Job Updated!' : 'Job Created!', `Job ${isEditMode ? 'updated' : 'created'} successfully. Redirecting...`);
        setTimeout(() => navigate('/dashboard/college-admin/jobs'), 1500);
      }
    } catch (err) {
      setError(err.message);
      toast.error('Save Failed', err.message || 'Could not save the job. Please try again.');
    } finally { setSaving(false); }
  };

  /* ─── field helpers ─── */
  const updateField = (field, value) => setFormData(p => ({ ...p, [field]: value }));
  const updateNested = (parent, field, value) => setFormData(p => ({ ...p, [parent]: { ...p[parent], [field]: value } }));
  const updateDoubleNested = (parent, child, field, v) => setFormData(p => ({ ...p, [parent]: { ...p[parent], [child]: { ...p[parent][child], [field]: v } } }));
  const addArrayItem = (field, template) => setFormData(p => ({ ...p, [field]: [...p[field], template] }));
  const updateArrayItem = (field, idx, value) => setFormData(p => { const a = [...p[field]]; a[idx] = value; return { ...p, [field]: a }; });
  const removeArrayItem = (field, idx) => setFormData(p => ({ ...p, [field]: p[field].filter((_, i) => i !== idx) }));
  const toggleBatch = (batch) => updateNested('eligibility', 'batches', formData.eligibility.batches.includes(batch) ? formData.eligibility.batches.filter(b => b !== batch) : [...formData.eligibility.batches, batch]);
  const updateLocation = (idx, field, value) => setFormData(p => { const locs = [...p.locations]; locs[idx] = { ...locs[idx], [field]: value }; return { ...p, locations: locs }; });
  const addLocationRow = () => {
    setFormData((prev) => ({
      ...prev,
      locations: [...prev.locations, { city: '', state: '', country: DEFAULT_COUNTRY.name, workMode: 'On-site' }],
    }));
    setLocationMeta((prev) => [...prev, createLocationMeta()]);
  };
  const removeLocationRow = (idx) => {
    setFormData((prev) => ({
      ...prev,
      locations: prev.locations.filter((_, index) => index !== idx),
    }));
    setLocationMeta((prev) => prev.filter((_, index) => index !== idx));
  };
  const handleCountryChange = (idx, countryCode) => {
    const selectedCountry = countryOptions.find((country) => country.isoCode === countryCode);

    updateLocationMeta(idx, {
      selectedCountryCode: countryCode,
      selectedStateCode: '',
      stateOptions: [],
      cityOptions: [],
      loadedStatesForCountry: '',
      loadedCitiesForCountry: '',
      loadedCitiesForState: '',
    });

    setFormData((prev) => {
      const locations = [...prev.locations];
      locations[idx] = {
        ...locations[idx],
        country: selectedCountry?.name || '',
        state: '',
        city: '',
      };
      return { ...prev, locations };
    });

    fetchStates(idx, countryCode);
  };
  const handleStateChange = (idx, stateCode) => {
    const selectedState = locationMeta[idx]?.stateOptions.find((state) => state.isoCode === stateCode);

    updateLocationMeta(idx, {
      selectedStateCode: stateCode,
      cityOptions: [],
      loadedCitiesForCountry: '',
      loadedCitiesForState: '',
    });

    setFormData((prev) => {
      const locations = [...prev.locations];
      locations[idx] = {
        ...locations[idx],
        state: selectedState?.name || '',
        city: '',
      };
      return { ...prev, locations };
    });

    fetchCities(idx, locationMeta[idx]?.selectedCountryCode, stateCode);
  };
  const handleCityChange = (idx, cityName) => updateLocation(idx, 'city', cityName);
  const addSelectionRound = () => setFormData(p => ({ ...p, selectionProcess: { ...p.selectionProcess, rounds: [...p.selectionProcess.rounds, { name: 'Online Test', description: '', duration: '' }] } }));
  const updateSelectionRound = (idx, field, value) => setFormData(p => { const rounds = [...p.selectionProcess.rounds]; rounds[idx] = { ...rounds[idx], [field]: value }; return { ...p, selectionProcess: { ...p.selectionProcess, rounds } }; });
  const removeSelectionRound = (idx) => setFormData(p => ({ ...p, selectionProcess: { ...p.selectionProcess, rounds: p.selectionProcess.rounds.filter((_, i) => i !== idx) } }));

  if (loading) return <DetailSkeleton layout={CollegeAdminLayout} />;

  return (
    <CollegeAdminLayout>
      <div className="px-6 py-4 md:px-8 md:py-6 space-y-5 font-sans">
        <div className="max-w-[1240px] mx-auto space-y-3 sm:space-y-4">

      {/* Back button */}
      <button onClick={() => navigate('/dashboard/college-admin/jobs')}
        className="flex items-center gap-2 text-gray-500 hover:text-[#003399] transition-colors group text-[14px] font-bold">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to Job Management
      </button>

      {/* ══ HERO BANNER ══ */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-12 h-12 bg-[#003399]/10 rounded-xl flex items-center justify-center flex-shrink-0">
          <Briefcase className="w-6 h-6 text-[#003399]" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span className="w-2 h-8 bg-gradient-to-b from-[#003399] to-[#00A9CE] rounded-full inline-block flex-shrink-0" />
            {isEditMode ? 'Edit Job Description' : 'Create New Job'}
          </h1>
          <p className="text-[12px] md:text-[14px] text-gray-500 mt-0.5">
            {isEditMode ? 'Update job posting details' : 'Fill in details to post a new job'}
          </p>
        </div>
      </div>

      {/* Status messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-4 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
          <p className="text-sm font-semibold text-green-800">Job {isEditMode ? 'updated' : 'created'} successfully! Redirecting...</p>
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* ══ FORM ══ */}
      <form onSubmit={(e) => handleSubmit(e, null)} className="space-y-4">

        {/* Basic Information */}
        <Section icon={Briefcase} title="Basic Information">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextInput label="Job Code" placeholder="Auto-generated if left empty"
              value={formData.jobCode} onChange={e => updateField('jobCode', e.target.value)} />
            <TextInput label="Job Title" required placeholder="e.g. Software Engineer"
              value={formData.jobTitle} onChange={e => updateField('jobTitle', e.target.value)} />
            <div>
              <FieldLabel required>Company</FieldLabel>
              <select value={formData.companyId} onChange={e => updateField('companyId', e.target.value)} required
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#003399]/30 focus:border-transparent bg-white">
                <option value="">Select Company</option>
                {companies.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <SelectInput label="Job Type" required value={formData.jobType} onChange={e => updateField('jobType', e.target.value)}
              options={[
                { value: 'Full-Time', label: 'Full-Time' },
                { value: 'Internship', label: 'Internship' },
                { value: 'Internship + FTE', label: 'Internship + FTE' },
              ]} />
            <SelectInput label="Job Role" required value={formData.jobRole} onChange={e => updateField('jobRole', e.target.value)}
              options={[
                { value: 'Software Engineer', label: 'Software Engineer' }, { value: 'Data Analyst', label: 'Data Analyst' },
                { value: 'Business Analyst', label: 'Business Analyst' }, { value: 'Product Manager', label: 'Product Manager' },
                { value: 'DevOps Engineer', label: 'DevOps Engineer' }, { value: 'Quality Assurance', label: 'Quality Assurance' },
                { value: 'Frontend Developer', label: 'Frontend Developer' }, { value: 'Backend Developer', label: 'Backend Developer' },
                { value: 'Full Stack Developer', label: 'Full Stack Developer' }, { value: 'UI/UX Designer', label: 'UI/UX Designer' },
                { value: 'Other', label: 'Other' },
              ]} />
          </div>
          <TextArea label="Job Description" required placeholder="Provide a detailed description of the role..." rows={4}
            value={formData.description} onChange={e => updateField('description', e.target.value)} />

          {/* Responsibilities */}
          <div>
            <FieldLabel>Responsibilities</FieldLabel>
            {formData.responsibilities.map((resp, idx) => (
              <div key={idx} className="flex gap-2 mb-2">
                <input type="text" value={resp}
                  onChange={e => updateArrayItem('responsibilities', idx, e.target.value)}
                  placeholder="Enter responsibility"
                  className="flex-1 px-3 py-2 text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#003399]/30 hover:border-gray-300 transition-colors bg-white" />
                {formData.responsibilities.length > 1 && (
                  <button type="button" onClick={() => removeArrayItem('responsibilities', idx)}
                    className="p-2 text-red-400 hover:bg-red-50 rounded-xl transition-colors"><Trash2 className="w-4 h-4" /></button>
                )}
              </div>
            ))}
            <button type="button" onClick={() => addArrayItem('responsibilities', '')}
              className="flex items-center gap-1.5 text-xs font-semibold text-[#003399] hover:text-[#003399] mt-1">
              <Plus className="w-3.5 h-3.5" /> Add Responsibility
            </button>
          </div>

          {/* Requirements */}
          <div>
            <FieldLabel>Requirements</FieldLabel>
            {formData.requirements.map((req, idx) => (
              <div key={idx} className="flex gap-2 mb-2">
                <input type="text" value={req}
                  onChange={e => updateArrayItem('requirements', idx, e.target.value)}
                  placeholder="Enter requirement"
                  className="flex-1 px-3 py-2 text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#003399]/30 hover:border-gray-300 transition-colors bg-white" />
                {formData.requirements.length > 1 && (
                  <button type="button" onClick={() => removeArrayItem('requirements', idx)}
                    className="p-2 text-red-400 hover:bg-red-50 rounded-xl transition-colors"><Trash2 className="w-4 h-4" /></button>
                )}
              </div>
            ))}
            <button type="button" onClick={() => addArrayItem('requirements', '')}
              className="flex items-center gap-1.5 text-xs font-semibold text-[#003399] hover:text-[#003399] mt-1">
              <Plus className="w-3.5 h-3.5" /> Add Requirement
            </button>
          </div>

          {/* Preferred Skills Dropdown */}
          <div>
            <FieldLabel>Preferred Skills</FieldLabel>

            <Select
              isMulti
              isSearchable
              closeMenuOnSelect
              options={skillOptions}
              placeholder="Search and select skills..."
              value={selectedSkillOptions}
              menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
              menuPosition="fixed"
              styles={{
                menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                menu: (base) => ({ ...base, zIndex: 9999 }),
              }}
              onChange={(selected) =>
                updateField(
                  "preferredSkills",
                  selected ? selected.map((s) => s.value) : []
                )
              }
              className="text-sm"
            />

            <p className="text-xs text-slate-400 mt-1">
              Search and select multiple skills
            </p>
          </div>
        </Section>

        {/* Package Details */}
        <Section icon={DollarSign} title="Package Details">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextInput label="Minimum CTC (LPA)" required type="number" step="0.1" min="0" placeholder="5.0"
              value={formData.package.ctc.min} onChange={e => updateDoubleNested('package', 'ctc', 'min', e.target.value)} />
            <TextInput label="Maximum CTC (LPA)" type="number" step="0.1" placeholder="8.0"
              value={formData.package.ctc.max} onChange={e => updateDoubleNested('package', 'ctc', 'max', e.target.value)} />
            <TextInput label="Fixed Pay (LPA)" type="number" step="0.1" placeholder="6.0"
              value={formData.package.fixedPay} onChange={e => updateNested('package', 'fixedPay', e.target.value)} />
            <TextInput label="Variable Pay (LPA)" type="number" step="0.1" placeholder="2.0"
              value={formData.package.variablePay} onChange={e => updateNested('package', 'variablePay', e.target.value)} />
            <TextInput label="Joining Bonus" type="number" placeholder="50000"
              value={formData.package.joiningBonus} onChange={e => updateNested('package', 'joiningBonus', e.target.value)} />
            <TextInput label="Relocation Allowance" type="number" placeholder="25000"
              value={formData.package.relocationAllowance} onChange={e => updateNested('package', 'relocationAllowance', e.target.value)} />
          </div>
          <TextArea label="Other Benefits" placeholder="Health insurance, meal vouchers, etc." rows={2}
            value={formData.package.otherBenefits} onChange={e => updateNested('package', 'otherBenefits', e.target.value)} />
        </Section>

        {/* Job Locations */}
        <Section icon={MapPin} title="Job Locations">
          {formData.locations.map((location, idx) => (
            <div key={idx} className="border border-gray-200 rounded-lg p-4 mb-3 bg-gray-50/30">
              <div className="flex justify-between items-center mb-3">
                <p className="text-xs font-bold text-gray-700">Location {idx + 1}</p>
                {formData.locations.length > 1 && (
                  <button type="button" onClick={() => removeLocationRow(idx)}
                    className="text-red-400 hover:bg-red-50 p-1.5 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <FieldLabel required>Country</FieldLabel>
                  <Select
                    inputId={`job-country-${idx}`}
                    isSearchable
                    options={countrySelectOptions}
                    value={getSelectedCountryOption(idx, location)}
                    onChange={(option) => handleCountryChange(idx, option?.value || '')}
                    placeholder={countryLoading ? 'Loading countries...' : 'Search or select country'}
                    isDisabled={countryLoading}
                    menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                    menuPosition="fixed"
                    styles={selectStyles}
                    className="text-sm"
                    noOptionsMessage={() => 'No countries found'}
                  />
                </div>
                <div>
                  <FieldLabel required>State</FieldLabel>
                  <Select
                    inputId={`job-state-${idx}`}
                    isSearchable
                    options={getStateSelectOptions(idx)}
                    value={getSelectedStateOption(idx, location)}
                    onChange={(option) => handleStateChange(idx, option?.value || '')}
                    placeholder={locationMeta[idx]?.statesLoading ? 'Loading states...' : locationMeta[idx]?.selectedCountryCode ? 'Search or select state' : 'Select country first'}
                    isDisabled={!locationMeta[idx]?.selectedCountryCode || locationMeta[idx]?.statesLoading}
                    menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                    menuPosition="fixed"
                    styles={selectStyles}
                    className="text-sm"
                    noOptionsMessage={() => 'No states found'}
                  />
                </div>
                <div>
                  <FieldLabel required>City</FieldLabel>
                  <Select
                    inputId={`job-city-${idx}`}
                    isSearchable
                    options={getCitySelectOptions(idx)}
                    value={getSelectedCityOption(idx, location)}
                    onChange={(option) => handleCityChange(idx, option?.value || '')}
                    placeholder={locationMeta[idx]?.citiesLoading ? 'Loading cities...' : locationMeta[idx]?.selectedStateCode ? 'Search or select city' : 'Select state first'}
                    isDisabled={!locationMeta[idx]?.selectedStateCode || locationMeta[idx]?.citiesLoading}
                    menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                    menuPosition="fixed"
                    styles={selectStyles}
                    className="text-sm"
                    noOptionsMessage={() => 'No cities found'}
                  />
                </div>
                <SelectInput label="Work Mode" required value={location.workMode}
                  onChange={e => updateLocation(idx, 'workMode', e.target.value)}
                  options={[{ value: 'On-site', label: 'On-site' }, { value: 'Remote', label: 'Remote' }, { value: 'Hybrid', label: 'Hybrid' }]} />
              </div>
            </div>
          ))}
          <button type="button" onClick={addLocationRow}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#003399] hover:text-[#003399]">
            <Plus className="w-3.5 h-3.5" /> Add Location
          </button>
        </Section>

        {/* Eligibility Criteria */}
        <Section icon={GraduationCap} title="Eligibility Criteria">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextInput label="Minimum CGPA" type="number" step="0.01" min="0" max="10" placeholder="7.5"
              value={formData.eligibility.minCGPA} onChange={e => updateNested('eligibility', 'minCGPA', e.target.value)} />
            <TextInput label="Maximum Backlogs" type="number" min="0" placeholder="0"
              value={formData.eligibility.maxBacklogs} onChange={e => updateNested('eligibility', 'maxBacklogs', e.target.value)} />
            <TextInput label="Maximum Gap Years" type="number" min="0" placeholder="0"
              value={formData.eligibility.maxGapYears} onChange={e => updateNested('eligibility', 'maxGapYears', e.target.value)} />
            <TextInput label="10th Percentage" type="number" step="0.01" min="0" max="100" placeholder="60"
              value={formData.eligibility.tenthPercentage} onChange={e => updateNested('eligibility', 'tenthPercentage', e.target.value)} />
            <TextInput label="12th Percentage" type="number" step="0.01" min="0" max="100" placeholder="60"
              value={formData.eligibility.twelfthPercentage} onChange={e => updateNested('eligibility', 'twelfthPercentage', e.target.value)} />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={formData.eligibility.activeBacklogsAllowed}
              onChange={e => updateNested('eligibility', 'activeBacklogsAllowed', e.target.checked)}
              className="w-4 h-4 text-[#003399] rounded border-gray-300" />
            <span className="text-sm font-medium text-gray-700">Allow Active Backlogs</span>
          </label>

          <div>
            <FieldLabel required>Eligible Branches</FieldLabel>
            <Select
              isMulti
              isSearchable
              closeMenuOnSelect={false}
              options={branchOptions}
              value={selectedBranchOptions}
              placeholder={branchOptions.length ? 'Search and select departments...' : 'No departments available'}
              noOptionsMessage={() => 'No departments found'}
              menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
              menuPosition="fixed"
              styles={{
                menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                menu: (base) => ({ ...base, zIndex: 9999 }),
              }}
              onChange={(selected) =>
                updateNested(
                  'eligibility',
                  'branches',
                  selected ? selected.map((branch) => branch.value) : []
                )
              }
              className="text-sm"
            />
            <p className="text-xs text-slate-400 mt-1">
              Select one or more departments from the active branch list
            </p>
          </div>

          <div>
            <FieldLabel required>Eligible Batches</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {batches.map(batch => (
                <button key={batch} type="button" onClick={() => toggleBatch(batch)}
                  className={`px-3 py-1.5 rounded-lg text-[13px] font-semibold border-2 transition-all ${formData.eligibility.batches.includes(batch)
                    ? 'bg-[#003399] border-[#003399] text-white shadow-sm'
                    : 'border-gray-200 text-gray-600 hover:border-[#003399]/30 hover:text-[#003399]'
                    }`}>
                  {batch}
                </button>
              ))}
            </div>
          </div>
        </Section>

        {/* Important Dates */}
        <Section icon={Calendar} title="Important Dates">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <TextInput label="Application Deadline" required type="date"
              value={formData.dates.applicationDeadline} onChange={e => updateNested('dates', 'applicationDeadline', e.target.value)} />
            <TextInput label="Interview Date" type="date"
              value={formData.dates.interviewDate} onChange={e => updateNested('dates', 'interviewDate', e.target.value)} />
            <TextInput label="Result Date" type="date"
              value={formData.dates.resultDate} onChange={e => updateNested('dates', 'resultDate', e.target.value)} />
          </div>
        </Section>

        {/* Selection Process */}
        <Section icon={Users} title="Selection Process">
          {formData.selectionProcess.rounds.map((round, idx) => (
            <div key={idx} className="border border-gray-200 rounded-lg p-4 mb-3 bg-gray-50/30">
              <div className="flex justify-between items-center mb-3">
                <p className="text-xs font-bold text-gray-700">Round {idx + 1}</p>
                {formData.selectionProcess.rounds.length > 1 && (
                  <button type="button" onClick={() => removeSelectionRound(idx)}
                    className="text-red-400 hover:bg-red-50 p-1.5 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <SelectInput label="Round Type" value={round.name} onChange={e => updateSelectionRound(idx, 'name', e.target.value)}
                  options={roundTypes.map(t => ({ value: t, label: t }))} />
                <TextInput label="Duration" placeholder="60 minutes"
                  value={round.duration} onChange={e => updateSelectionRound(idx, 'duration', e.target.value)} />
                <div className="md:col-span-3">
                  <TextArea label="Description" placeholder="Describe this round..." rows={2}
                    value={round.description} onChange={e => updateSelectionRound(idx, 'description', e.target.value)} />
                </div>
              </div>
            </div>
          ))}
          <button type="button" onClick={addSelectionRound}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#003399] hover:text-[#003399]">
            <Plus className="w-3.5 h-3.5" /> Add Selection Round
          </button>
        </Section>

        {/* Documents Required */}
        <Section icon={FileText} title="Documents Required">
          <div className="space-y-2">
            {[
              { key: 'resume', label: 'Resume' },
              { key: 'coverLetter', label: 'Cover Letter' },
              { key: 'marksheets', label: 'Marksheets' },
              { key: 'certificates', label: 'Certificates' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2.5 cursor-pointer">
                <input type="checkbox" checked={formData.documentsRequired[key]}
                  onChange={e => updateNested('documentsRequired', key, e.target.checked)}
                  className="w-4 h-4 text-[#003399] rounded border-gray-300" />
                <span className="text-sm font-medium text-gray-700">{label}</span>
              </label>
            ))}
            <TextInput label="Other Documents" placeholder="Any other documents needed..."
              value={formData.documentsRequired.other} onChange={e => updateNested('documentsRequired', 'other', e.target.value)} />
          </div>
        </Section>

        {/* Tags & Notes */}
        <Section icon={Tag} title="Tags & Notes">
          <ChipInput label="Tags"
            hint="Add tags to help categorize and search this job posting."
            values={formData.tags} onChange={(v) => updateField('tags', v)}
            placeholder="e.g. urgent, remote-friendly, tier1, mass-hiring..." />
          <TextArea label="Internal Notes (not visible to students)"
            placeholder="Any internal notes, reminders, or special instructions..."
            value={formData.notes} onChange={e => updateField('notes', e.target.value)} rows={3} />
        </Section>

        {/* ══ ACTION BUTTONS ══ */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 md:p-6">
          <div className="flex flex-col sm:flex-row justify-end gap-3">
            <button type="button" onClick={() => navigate('/dashboard/college-admin/jobs')}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-slate-50 text-[13px] font-bold transition-all shadow-sm w-full sm:w-auto">
              <X className="w-4 h-4" /> Cancel
            </button>
            <button type="button" onClick={(e) => handleSubmit(e, 'Draft')} disabled={saving}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-[13px] font-bold disabled:opacity-50 transition-all shadow-sm w-full sm:w-auto">
              <FileText className="w-4 h-4" /> Save as Draft
            </button>
            <button type="submit" disabled={saving}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#003399] text-white rounded-lg shadow-sm hover:bg-[#003399] text-[13px] font-bold disabled:opacity-50 transition-colors w-full sm:w-auto">
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : isEditMode ? 'Update Job' : 'Publish Job'}
            </button>
          </div>
        </div>

      </form>
    </div>
      </div>
    </CollegeAdminLayout>
  );
};

export default JobForm;