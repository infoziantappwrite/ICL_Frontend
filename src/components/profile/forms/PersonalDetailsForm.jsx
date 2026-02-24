// src/components/profile/forms/PersonalDetailsForm.jsx - NO REQUIRED FIELDS
import { User } from 'lucide-react';
import SectionHeader from '../shared/SectionHeader';
import FormField from '../shared/FormField';

const PersonalDetailsForm = ({ formData, handleChange }) => {
  const genderOptions = [
    { value: 'Male', label: 'Male' },
    { value: 'Female', label: 'Female' },
    { value: 'Other', label: 'Other' },
    { value: 'Prefer not to say', label: 'Prefer not to say' }
  ];

  const maxDOB = new Date(new Date().setFullYear(new Date().getFullYear() - 16)).toISOString().split('T')[0];
  const minDOB = new Date(new Date().setFullYear(new Date().getFullYear() - 100)).toISOString().split('T')[0];

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/50">
      <SectionHeader icon={User} title="Personal Details" />
      <p className="text-sm text-gray-600 mb-6 -mt-2">All fields are optional. Fill what you want to share.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <FormField
            label="Full Name"
            name="fullName"
            type="text"
            value={formData.fullName}
            onChange={handleChange}
            minLength={2}
            maxLength={100}
            placeholder="John Doe"
          />
        </div>

        <div className="md:col-span-2">
          <FormField
            label="Email Address"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            disabled
            placeholder="john@example.com"
            helpText="Email cannot be changed"
          />
        </div>

        <FormField
          label="Mobile Number"
          name="mobileNumber"
          type="tel"
          value={formData.mobileNumber}
          onChange={handleChange}
          pattern="[0-9]{10}"
          placeholder="9876543210"
          helpText="Enter 10-digit mobile number"
        />

        <FormField
          label="WhatsApp Number"
          name="whatsappNumber"
          type="tel"
          value={formData.whatsappNumber}
          onChange={handleChange}
          pattern="[0-9]{10}"
          placeholder="9876543210"
        />

        <FormField
          label="Alternate Mobile Number"
          name="alternateMobileNumber"
          type="tel"
          value={formData.alternateMobileNumber}
          onChange={handleChange}
          pattern="[0-9]{10}"
          placeholder="9876543211"
        />

        <FormField
          label="Gender"
          name="gender"
          type="select"
          value={formData.gender}
          onChange={handleChange}
          options={genderOptions}
        />

        <FormField
          label="Date of Birth"
          name="dateOfBirth"
          type="date"
          value={formData.dateOfBirth}
          onChange={handleChange}
          max={maxDOB}
          min={minDOB}
          helpText="You must be between 16 and 100 years old"
        />

        <FormField
          label="City"
          name="city"
          type="text"
          value={formData.city}
          onChange={handleChange}
          placeholder="Chennai"
        />

        <FormField
          label="State"
          name="state"
          type="text"
          value={formData.state}
          onChange={handleChange}
          placeholder="Tamil Nadu"
        />

        <FormField
          label="Country"
          name="country"
          type="text"
          value={formData.country}
          onChange={handleChange}
          placeholder="India"
        />

        <FormField
          label="Pincode"
          name="pincode"
          type="text"
          value={formData.pincode}
          onChange={handleChange}
          pattern="[0-9]{6}"
          placeholder="600001"
          helpText="Enter 6-digit pincode"
        />
      </div>
    </div>
  );
};

export default PersonalDetailsForm;