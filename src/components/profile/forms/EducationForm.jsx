// src/components/profile/forms/EducationForm.jsx - NO REQUIRED FIELDS
import { GraduationCap } from 'lucide-react';
import SectionHeader from '../shared/SectionHeader';
import FormField from '../shared/FormField';

const EducationForm = ({ formData, handleChange }) => {
  const qualificationOptions = [
    { value: "High School (10th)", label: "High School (10th)" },
    { value: "Intermediate (12th)", label: "Intermediate (12th)" },
    { value: "Diploma", label: "Diploma" },
    { value: "Bachelor's Degree", label: "Bachelor's Degree" },
    { value: "Master's Degree", label: "Master's Degree" },
    { value: "PhD", label: "PhD" },
    { value: "Other", label: "Other" }
  ];

  const currentYear = new Date().getFullYear();

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/50">
      <SectionHeader 
        icon={GraduationCap} 
        title="Educational Details"
        iconBgColor="from-blue-50 to-cyan-50"
        iconColor="text-purple-600"
      />
      <p className="text-sm text-gray-600 mb-6 -mt-2">All fields are optional. Add your education details when ready.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          label="Highest Qualification"
          name="highestQualification"
          type="select"
          value={formData.highestQualification}
          onChange={handleChange}
          options={qualificationOptions}
        />

        <FormField
          label="Specialization / Branch"
          name="specialization"
          type="text"
          value={formData.specialization}
          onChange={handleChange}
          placeholder="Computer Science Engineering"
        />

        <FormField
          label="College / Institution Name"
          name="collegeName"
          type="text"
          value={formData.collegeName}
          onChange={handleChange}
          placeholder="IIT Madras"
        />

        <FormField
          label="University / Board"
          name="university"
          type="text"
          value={formData.university}
          onChange={handleChange}
          placeholder="Anna University"
        />

        <FormField
          label="Graduation Year"
          name="graduationYear"
          type="number"
          value={formData.graduationYear}
          onChange={handleChange}
          min="1950"
          max={currentYear + 5}
          placeholder="2024"
        />

        <FormField
          label="CGPA / Percentage"
          name="cgpaOrPercentage"
          type="text"
          value={formData.cgpaOrPercentage}
          onChange={handleChange}
          placeholder="8.5 CGPA or 85%"
        />

        <FormField
          label="10th Percentage"
          name="tenthPercentage"
          type="text"
          value={formData.tenthPercentage}
          onChange={handleChange}
          placeholder="90%"
        />

        <FormField
          label="12th / Diploma Percentage"
          name="twelfthOrDiplomaPercentage"
          type="text"
          value={formData.twelfthOrDiplomaPercentage}
          onChange={handleChange}
          placeholder="85%"
        />
      </div>
    </div>
  );
};

export default EducationForm;