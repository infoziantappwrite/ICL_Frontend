// src/components/profile/forms/ProfessionalForm.jsx - NO REQUIRED FIELDS
import { Briefcase } from 'lucide-react';
import SectionHeader from '../shared/SectionHeader';
import FormField from '../shared/FormField';

const ProfessionalForm = ({ formData, handleChange }) => {
  const statusOptions = [
    { value: 'Student', label: 'Student' },
    { value: 'Graduate', label: 'Graduate' },
    { value: 'Working Professional', label: 'Working Professional' }
  ];

  const candidateTypeOptions = [
    { value: 'FRESHER', label: 'Fresher' },
    { value: 'EXPERIENCED', label: 'Experienced' }
  ];

  const isExperienced = formData.candidateType === 'EXPERIENCED';

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/50">
      <SectionHeader 
        icon={Briefcase} 
        title="Professional Details"
        iconBgColor="from-blue-50 to-cyan-50"
        iconColor="text-green-600"
      />
      <p className="text-sm text-gray-600 mb-6 -mt-2">All fields are optional. Share your professional background if applicable.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          label="Current Status"
          name="currentStatus"
          type="select"
          value={formData.currentStatus}
          onChange={handleChange}
          options={statusOptions}
        />

        <FormField
          label="Candidate Type"
          name="candidateType"
          type="select"
          value={formData.candidateType}
          onChange={handleChange}
          options={candidateTypeOptions}
        />

        {isExperienced && (
          <>
            <FormField
              label="Years of Experience"
              name="yearsOfExperience"
              type="number"
              value={formData.yearsOfExperience}
              onChange={handleChange}
              min="0"
              max="50"
              placeholder="3"
            />

            <FormField
              label="Previous Organization"
              name="previousOrganization"
              type="text"
              value={formData.previousOrganization}
              onChange={handleChange}
              placeholder="ABC Corp"
            />

            <div className="md:col-span-2">
              <FormField
                label="Current Role / Designation"
                name="currentRole"
                type="text"
                value={formData.currentRole}
                onChange={handleChange}
                placeholder="Software Engineer"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProfessionalForm;