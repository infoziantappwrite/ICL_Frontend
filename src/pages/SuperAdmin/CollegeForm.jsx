import { useToast } from '../../context/ToastContext';
// pages/SuperAdmin/CollegeForm.jsx - Add/Edit College Form
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Select from 'react-select';
import apiCall from '../../api/Api';
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
  Plus,
  Trash2,
  Hash,
} from 'lucide-react';
import SuperAdminDashboardLayout from '../../components/layout/SuperAdminDashboardLayout';
import { DetailSkeleton } from '../../components/common/SkeletonLoader';

/* ─── Section heading ─────────────────────── */
const SHead = ({ icon: Icon, title, sub, color = '#003399' }) => (
  <div className="flex items-center gap-3 mb-5">
    <div
      className="w-8 h-8 rounded-xl flex items-center justify-center border flex-shrink-0 shadow-sm"
      style={{
        backgroundColor: `${color}12`,
        borderColor: `${color}25`,
      }}
    >
      <Icon className="w-4 h-4" style={{ color }} />
    </div>
    <div>
      <h3 className="text-sm font-black text-slate-800 leading-none">{title}</h3>
      {sub && <p className="text-[10px] text-slate-400 mt-1 font-medium italic">{sub}</p>}
    </div>
  </div>
);

/* ─── Field wrapper ───────────────────────── */
const Field = ({ label, icon: Icon, required, hint, children }) => (
  <div>
    <label className="flex items-center gap-1.5 text-xs font-bold text-gray-600 mb-1.5">
      {Icon && <Icon className="w-3.5 h-3.5 text-gray-400" />}
      {label}
      {required && <span className="text-blue-500">*</span>}
    </label>
    {children}
    {hint && <p className="text-[10px] text-gray-400 mt-1">{hint}</p>}
  </div>
);

const inputBase =
  'w-full px-3 py-2.5 text-sm border border-slate-100 hover:border-slate-200 rounded-xl focus:ring-2 focus:ring-[#003399]/20 focus:border-[#003399]/30 transition-all bg-white placeholder-slate-400';

const DEFAULT_COUNTRY = { name: 'India', isoCode: 'IN' };
const selectStyles = {
  control: (base, state) => ({
    ...base,
    minHeight: 46,
    borderRadius: 12,
    borderColor: state.isFocused ? '#003399' : '#f1f5f9',
    boxShadow: state.isFocused ? '0 0 0 2px rgba(0, 51, 153, 0.12)' : 'none',
    '&:hover': {
      borderColor: state.isFocused ? '#003399' : '#e2e8f0',
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
    backgroundColor: state.isFocused ? '#eff6ff' : state.isSelected ? '#eef2ff' : '#fff',
    color: '#0f172a',
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

const CollegeForm = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const { collegeId } = useParams();
  const isEditMode = Boolean(collegeId);

  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      country: 'India',
      pincode: '',
    },
    university: '',
    type: 'Private',
    establishedYear: new Date().getFullYear(),
    accreditation: [],
    website: '',
    departments: [],
  });

  const [newDepartment, setNewDepartment] = useState({
    name: '',
    code: '',
    hodName: '',
    hodEmail: '',
  });

  const [newAccreditation, setNewAccreditation] = useState('');
  const [countryOptions, setCountryOptions] = useState([]);
  const [stateOptions, setStateOptions] = useState([]);
  const [cityOptions, setCityOptions] = useState([]);
  const [selectedCountryCode, setSelectedCountryCode] = useState(DEFAULT_COUNTRY.isoCode);
  const [selectedStateCode, setSelectedStateCode] = useState('');
  const [locationLoading, setLocationLoading] = useState({
    countries: false,
    states: false,
    cities: false,
  });

  useEffect(() => {
    if (isEditMode) {
      fetchCollegeData();
    }
  }, [collegeId]);

  useEffect(() => {
    fetchCountries();
  }, []);

  useEffect(() => {
    if (!countryOptions.length) {
      return;
    }

    const currentCountry = formData.address?.country || DEFAULT_COUNTRY.name;
    const matchedCountry =
      countryOptions.find((country) => country.name === currentCountry) ||
      countryOptions.find((country) => country.isoCode === DEFAULT_COUNTRY.isoCode);

    if (!matchedCountry) {
      setSelectedCountryCode('');
      setStateOptions([]);
      setCityOptions([]);
      setSelectedStateCode('');
      return;
    }

    if (currentCountry !== matchedCountry.name) {
      setFormData((prev) => ({
        ...prev,
        address: {
          ...prev.address,
          country: matchedCountry.name,
        },
      }));
    }

    setSelectedCountryCode((prev) => (prev === matchedCountry.isoCode ? prev : matchedCountry.isoCode));
    fetchStates(matchedCountry.isoCode);
  }, [countryOptions, formData.address?.country]);

  useEffect(() => {
    if (!formData.address?.state || !stateOptions.length || !selectedCountryCode) {
      setSelectedStateCode((prev) => (prev ? '' : prev));
      setCityOptions([]);
      return;
    }

    const matchedState = stateOptions.find((state) => state.name === formData.address.state);

    if (!matchedState) {
      setSelectedStateCode('');
      setCityOptions([]);
      return;
    }

    setSelectedStateCode((prev) => (prev === matchedState.isoCode ? prev : matchedState.isoCode));
    fetchCities(selectedCountryCode, matchedState.isoCode);
  }, [stateOptions, selectedCountryCode, formData.address?.state]);

  const fetchCollegeData = async () => {
    try {
      setLoading(true);
      const data = await apiCall(`/super-admin/colleges/${collegeId}`);
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

  const fetchCountries = async () => {
    try {
      setLocationLoading((prev) => ({ ...prev, countries: true }));
      const data = await apiCall('/location/countries');
      if (data.success) {
        setCountryOptions(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching countries:', error);
      toast.error('Error', 'Unable to load countries');
    } finally {
      setLocationLoading((prev) => ({ ...prev, countries: false }));
    }
  };

  const fetchStates = async (countryCode) => {
    if (!countryCode) {
      setStateOptions([]);
      setCityOptions([]);
      setSelectedStateCode('');
      return;
    }

    try {
      setLocationLoading((prev) => ({ ...prev, states: true }));
      const data = await apiCall(`/location/states/${countryCode}`);
      if (data.success) {
        setStateOptions(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching states:', error);
      setStateOptions([]);
      toast.error('Error', 'Unable to load states');
    } finally {
      setLocationLoading((prev) => ({ ...prev, states: false }));
    }
  };

  const fetchCities = async (countryCode, stateCode) => {
    if (!countryCode || !stateCode) {
      setCityOptions([]);
      return;
    }

    try {
      setLocationLoading((prev) => ({ ...prev, cities: true }));
      const data = await apiCall(`/location/cities/${countryCode}/${stateCode}`);
      if (data.success) {
        setCityOptions(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching cities:', error);
      setCityOptions([]);
      toast.error('Error', 'Unable to load cities');
    } finally {
      setLocationLoading((prev) => ({ ...prev, cities: false }));
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    let finalValue;
    if (type === 'checkbox') {
      finalValue = checked;
    } else if (type === 'number') {
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

  const handleCountryChange = (e) => {
    const countryCode = e.target.value;
    const selectedCountry = countryOptions.find((country) => country.isoCode === countryCode);

    setSelectedCountryCode(countryCode);
    setSelectedStateCode('');
    setStateOptions([]);
    setCityOptions([]);
    setFormData((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        country: selectedCountry?.name || '',
        state: '',
        city: '',
      },
    }));
  };

  const handleStateChange = (e) => {
    const stateCode = e.target.value;
    const selectedState = stateOptions.find((state) => state.isoCode === stateCode);

    setSelectedStateCode(stateCode);
    setCityOptions([]);
    setFormData((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        state: selectedState?.name || '',
        city: '',
      },
    }));
  };

  const handleCityChange = (e) => {
    const cityName = e.target.value;

    setFormData((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        city: cityName,
      },
    }));
  };

  const countrySelectOptions = countryOptions.map((country) => ({
    value: country.isoCode,
    label: country.name,
  }));
  const stateSelectOptions = stateOptions.map((state) => ({
    value: state.isoCode,
    label: state.name,
  }));
  const citySelectOptions = cityOptions.map((city) => ({
    value: city.name,
    label: city.name,
  }));
  const selectedCountryOption =
    countrySelectOptions.find((option) => option.value === selectedCountryCode) ||
    countrySelectOptions.find((option) => option.label === formData.address?.country) ||
    (formData.address?.country ? { value: formData.address.country, label: formData.address.country } : null);
  const selectedStateOption =
    stateSelectOptions.find((option) => option.value === selectedStateCode) ||
    stateSelectOptions.find((option) => option.label === formData.address?.state) ||
    (formData.address?.state ? { value: formData.address.state, label: formData.address.state } : null);
  const selectedCityOption =
    citySelectOptions.find((option) => option.value === formData.address?.city) ||
    (formData.address?.city ? { value: formData.address.city, label: formData.address.city } : null);

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

    if (!formData.address?.state || !formData.address?.city) {
      toast.error('Error', 'Please select both state and city');
      return;
    }

    setSubmitting(true);

    try {
      console.log('📤 Submitting college data:', formData);

      const endpoint = isEditMode
        ? `/super-admin/colleges/${collegeId}`
        : '/super-admin/colleges';

      const method = isEditMode ? 'PUT' : 'POST';

      const data = await apiCall(endpoint, {
        method,
        body: JSON.stringify(formData),
      });
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
      <DetailSkeleton layout={SuperAdminDashboardLayout} />
    );
  }

  return (
    <SuperAdminDashboardLayout>
      <div className="px-6 py-4 md:px-8 md:py-6 space-y-5 font-sans">

      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <span className="w-2 h-8 bg-gradient-to-b from-[#003399] to-[#00A9CE] rounded-full" />
          {isEditMode ? 'Edit College' : 'Add New College'}
        </h1>
        <p className="text-sm text-slate-400 font-medium mt-1">
          {isEditMode ? 'Update college information and settings' : 'Register a new college on the platform'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Basic Information */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <SHead icon={Building2} title="Basic Information" sub="Core college identity details" color="#003399" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Field label="College Name" required>
                <input
                  type="text" name="name" value={formData.name} onChange={handleChange} required
                  className={inputBase} placeholder="Enter college name"
                />
              </Field>
            </div>

            <Field label="College Code" icon={Hash} required hint="3–10 uppercase alphanumeric characters">
              <input
                type="text" name="code" value={formData.code} onChange={handleChange}
                required pattern="[A-Z0-9]{3,10}"
                className={`${inputBase} uppercase`} placeholder="e.g., MIT123" maxLength="10"
              />
            </Field>

            <Field label="Email" icon={Mail} required>
              <input
                type="email" name="email" value={formData.email} onChange={handleChange} required
                className={inputBase} placeholder="college@example.com"
              />
            </Field>

            <Field label="Phone" icon={Phone} required hint="10-digit number">
              <input
                type="tel" name="phone" value={formData.phone} onChange={handleChange}
                required pattern="[0-9]{10}"
                className={inputBase} placeholder="1234567890" maxLength="10"
              />
            </Field>

            <Field label="Website" icon={Globe}>
              <input
                type="url" name="website" value={formData.website} onChange={handleChange}
                className={inputBase} placeholder="https://www.example.com"
              />
            </Field>
          </div>
        </div>

        {/* Location Details */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <SHead icon={MapPin} title="Location Details" sub="Address and geographical information" color="#00A9CE" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Field label="Street Address">
                <input
                  type="text" name="address.street"
                  value={formData.address?.street || ''} onChange={handleChange}
                  className={inputBase} placeholder="Street address"
                />
              </Field>
            </div>

            <Field label="State" required>
              <Select
                inputId="college-state"
                isSearchable
                options={stateSelectOptions}
                value={selectedStateOption}
                onChange={(option) => handleStateChange({ target: { value: option?.value || '' } })}
                placeholder={locationLoading.states ? 'Loading states...' : selectedCountryCode ? 'Search or select state' : 'Select country first'}
                isDisabled={!selectedCountryCode || locationLoading.states}
                menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                menuPosition="fixed"
                styles={selectStyles}
                className="text-sm"
                noOptionsMessage={() => 'No states found'}
              />
            </Field>

            <Field label="City" required>
              <Select
                inputId="college-city"
                isSearchable
                options={citySelectOptions}
                value={selectedCityOption}
                onChange={(option) => handleCityChange({ target: { value: option?.value || '' } })}
                placeholder={locationLoading.cities ? 'Loading cities...' : selectedStateCode ? 'Search or select city' : 'Select state first'}
                isDisabled={!selectedStateCode || locationLoading.cities}
                menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                menuPosition="fixed"
                styles={selectStyles}
                className="text-sm"
                noOptionsMessage={() => 'No cities found'}
              />
            </Field>

            <Field label="Pincode" hint="6 digit code">
              <input
                type="text" name="address.pincode"
                value={formData.address?.pincode || ''} onChange={handleChange}
                pattern="[0-9]{6}"
                className={inputBase} placeholder="123456" maxLength="6"
              />
            </Field>

            <Field label="Country">
              <Select
                inputId="college-country"
                isSearchable
                options={countrySelectOptions}
                value={selectedCountryOption}
                onChange={(option) => handleCountryChange({ target: { value: option?.value || '' } })}
                placeholder={locationLoading.countries ? 'Loading countries...' : 'Search or select country'}
                isDisabled={locationLoading.countries}
                menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                menuPosition="fixed"
                styles={selectStyles}
                className="text-sm"
                noOptionsMessage={() => 'No countries found'}
              />
            </Field>
          </div>
        </div>

        {/* College Details */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <SHead icon={GraduationCap} title="College Details" sub="Academic affiliation and credentials" color="#6366f1" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            <Field label="University" required>
              <input
                type="text" name="university" value={formData.university} onChange={handleChange} required
                className={inputBase} placeholder="University name"
              />
            </Field>

            <Field label="College Type">
              <select name="type" value={formData.type} onChange={handleChange} className={inputBase}>
                <option value="Government">Government</option>
                <option value="Private">Private</option>
                <option value="Autonomous">Autonomous</option>
                <option value="Deemed">Deemed</option>
                <option value="Other">Other</option>
              </select>
              {formData.type === 'Other' && (
                <input
                  type="text" name="typeOther"
                  className={`${inputBase} mt-2`} placeholder="Specify college type..."
                  value={formData.typeOther || ''} onChange={handleChange}
                />
              )}
            </Field>

            <Field label="Established Year" icon={Calendar}>
              <input
                type="number" name="establishedYear" value={formData.establishedYear} onChange={handleChange}
                min="1800" max={new Date().getFullYear()}
                className={inputBase} placeholder="2000"
              />
            </Field>

            <Field label="Accreditations" icon={Award}>
              <div className="flex gap-2 mb-2">
                <input
                  type="text" value={newAccreditation}
                  onChange={(e) => setNewAccreditation(e.target.value)}
                  className={`${inputBase} flex-1`} placeholder="e.g., NAAC A++"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAccreditation())}
                />
                <button
                  type="button" onClick={addAccreditation}
                  className="px-3 py-2 bg-[#003399] text-white text-xs font-black rounded-xl hover:bg-[#002d8b] transition-all"
                >
                  Add
                </button>
              </div>
              {formData.accreditation?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {formData.accreditation.map((acc, index) => (
                    <span key={index} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#00A9CE]/10 text-[#00A9CE] border border-[#00A9CE]/20 rounded-full text-[11px] font-bold">
                      {acc}
                      <button type="button" onClick={() => removeAccreditation(index)}
                        className="text-[#00A9CE] hover:text-[#003399] transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </Field>
          </div>
        </div>

        {/* Departments */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <SHead icon={Users} title="Departments" sub="Academic departments and their heads" color="#10b981" />

          {/* Add department row */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 mb-3 p-3 bg-[#003399]/[0.03] rounded-xl border border-[#003399]/10">
            <input
              type="text" value={newDepartment.name}
              onChange={(e) => setNewDepartment({ ...newDepartment, name: e.target.value })}
              className={inputBase} placeholder="Department Name"
            />
            <input
              type="text" value={newDepartment.code}
              onChange={(e) => setNewDepartment({ ...newDepartment, code: e.target.value.toUpperCase() })}
              className={`${inputBase} uppercase`} placeholder="Code (CSE)"
            />
            <input
              type="text" value={newDepartment.hodName}
              onChange={(e) => setNewDepartment({ ...newDepartment, hodName: e.target.value })}
              className={inputBase} placeholder="HOD Name"
            />
            <input
              type="email" value={newDepartment.hodEmail}
              onChange={(e) => setNewDepartment({ ...newDepartment, hodEmail: e.target.value })}
              className={inputBase} placeholder="HOD Email"
            />
            <button
              type="button" onClick={addDepartment}
              className="inline-flex items-center justify-center gap-1.5 bg-[#003399] text-white text-xs font-black px-3 py-2.5 rounded-xl hover:bg-[#002d8b] transition-all">
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>

          {formData.departments?.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60">
                    {['Department', 'Code', 'HOD Name', 'HOD Email', ''].map(h => (
                      <th key={h} className="px-3 py-2 text-left text-[9px] font-black text-slate-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {formData.departments.map((dept, index) => (
                    <tr key={index} className="hover:bg-[#003399]/[0.02] transition-colors">
                      <td className="px-3 py-2.5 text-xs font-semibold text-slate-800">{dept.name}</td>
                      <td className="px-3 py-2.5">
                        <span className="text-[10px] font-black text-[#003399] bg-[#003399]/5 px-1.5 py-0.5 rounded-md border border-[#003399]/10">{dept.code}</span>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-slate-600">{dept.hodName || '—'}</td>
                      <td className="px-3 py-2.5 text-xs text-slate-500 font-mono">{dept.hodEmail || '—'}</td>
                      <td className="px-3 py-2.5">
                        <button type="button" onClick={() => removeDepartment(index)}
                          className="w-6 h-6 flex items-center justify-center rounded-lg bg-red-50 hover:bg-red-100 text-red-500 transition-colors">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-slate-400">
              <GraduationCap className="w-8 h-8 mb-2 text-slate-200" />
              <p className="text-xs font-medium text-slate-400">No departments added yet</p>
            </div>
          )}
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-3 justify-end pb-6">
          <button type="button" onClick={() => navigate('/dashboard/super-admin/colleges')}
            className="inline-flex items-center gap-2 border border-slate-100 bg-white text-slate-600 text-xs font-black px-5 py-2.5 rounded-xl hover:bg-slate-50 transition-all">
            <X className="w-3.5 h-3.5" /> Cancel
          </button>
          <button type="submit" disabled={submitting}
            className="inline-flex items-center gap-2 bg-[#003399] hover:bg-[#002d8b] text-white text-xs font-black px-5 py-2.5 rounded-xl shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed">
            {submitting ? (
              <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />{isEditMode ? 'Updating...' : 'Creating...'}</>
            ) : (
              <><Save className="w-3.5 h-3.5" />{isEditMode ? 'Update College' : 'Create College'}</>
            )}
          </button>
        </div>
      </form>
      </div>
    </SuperAdminDashboardLayout>
  );
};

export default CollegeForm;
