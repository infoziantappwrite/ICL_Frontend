// src/components/profile/forms/SkillsForm.jsx - NO REQUIRED FIELDS
import { Code } from 'lucide-react';
import SectionHeader from '../shared/SectionHeader';
import SkillInput from '../shared/SkillInput';

const SkillsForm = ({
  formData,
  newPrimarySkill,
  setNewPrimarySkill,
  newSecondarySkill,
  setNewSecondarySkill,
  newProgrammingLanguage,
  setNewProgrammingLanguage,
  newTool,
  setNewTool,
  addSkill,
  removeSkill
}) => {
  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/50">
      <SectionHeader 
        icon={Code} 
        title="Skills & Technical Background"
        iconBgColor="from-blue-50 to-cyan-50"
        iconColor="text-orange-600"
      />
      <p className="text-sm text-gray-600 mb-6 -mt-2">All skills are optional. Add the skills you have when ready.</p>

      <div className="space-y-6">
        <SkillInput
          label="Primary Skills"
          skills={formData.primarySkills}
          newSkill={newPrimarySkill}
          setNewSkill={setNewPrimarySkill}
          onAddSkill={() => addSkill('primarySkills', newPrimarySkill, setNewPrimarySkill)}
          onRemoveSkill={(index) => removeSkill('primarySkills', index)}
          placeholder="e.g., React, Node.js, Python"
          skillColor="blue"
        />

        <SkillInput
          label="Secondary Skills"
          skills={formData.secondarySkills}
          newSkill={newSecondarySkill}
          setNewSkill={setNewSecondarySkill}
          onAddSkill={() => addSkill('secondarySkills', newSecondarySkill, setNewSecondarySkill)}
          onRemoveSkill={(index) => removeSkill('secondarySkills', index)}
          placeholder="e.g., MySQL, MongoDB"
          skillColor="green"
        />

        <SkillInput
          label="Programming Languages"
          skills={formData.programmingLanguages}
          newSkill={newProgrammingLanguage}
          setNewSkill={setNewProgrammingLanguage}
          onAddSkill={() => addSkill('programmingLanguages', newProgrammingLanguage, setNewProgrammingLanguage)}
          onRemoveSkill={(index) => removeSkill('programmingLanguages', index)}
          placeholder="e.g., JavaScript, Python, Java"
          skillColor="purple"
        />

        <SkillInput
          label="Tools & Technologies"
          skills={formData.toolsAndTechnologies}
          newSkill={newTool}
          setNewSkill={setNewTool}
          onAddSkill={() => addSkill('toolsAndTechnologies', newTool, setNewTool)}
          onRemoveSkill={(index) => removeSkill('toolsAndTechnologies', index)}
          placeholder="e.g., Git, Docker, AWS"
          skillColor="orange"
        />
      </div>
    </div>
  );
};

export default SkillsForm;