// src/components/profile/forms/CareerGoalsForm.jsx - NO REQUIRED FIELDS
import { Target } from 'lucide-react';
import SectionHeader from '../shared/SectionHeader';
import FormField from '../shared/FormField';
import SkillInput from '../shared/SkillInput';

const CareerGoalsForm = ({
  formData,
  handleChange,
  newTargetCompany,
  setNewTargetCompany,
  addTargetCompany,
  removeTargetCompany
}) => {
  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/50">
      <SectionHeader 
        icon={Target} 
        title="Career Goals"
        iconBgColor="from-pink-100 to-rose-100"
        iconColor="text-pink-600"
      />
      <p className="text-sm text-gray-600 mb-6 -mt-2">All fields are optional. Share your career aspirations when ready.</p>

      <div className="space-y-6">
        <FormField
          label="Career Objective"
          name="careerObjective"
          type="textarea"
          value={formData.careerObjective}
          onChange={handleChange}
          minLength={50}
          maxLength={500}
          placeholder="Describe your career goals and objectives (50-500 characters)"
          helpText="Optional - You can add this later"
        />

        <FormField
          label="Preferred Job Role"
          name="preferredJobRole"
          type="text"
          value={formData.preferredJobRole}
          onChange={handleChange}
          placeholder="Full Stack Developer"
        />

        <SkillInput
          label="Target Companies"
          skills={formData.targetCompanies}
          newSkill={newTargetCompany}
          setNewSkill={setNewTargetCompany}
          onAddSkill={addTargetCompany}
          onRemoveSkill={removeTargetCompany}
          placeholder="e.g., Google, Microsoft, Amazon"
          skillColor="purple"
        />
      </div>
    </div>
  );
};

export default CareerGoalsForm;