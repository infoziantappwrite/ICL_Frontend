// src/components/profile/forms/CoursePreferencesForm.jsx - NO REQUIRED FIELDS
import { Award } from 'lucide-react';
import SectionHeader from '../shared/SectionHeader';
import FormField from '../shared/FormField';

const CoursePreferencesForm = ({ formData, handleChange }) => {
  const learningModeOptions = [
    { value: 'Online', label: 'Online' },
    { value: 'Offline', label: 'Offline' },
    { value: 'Hybrid', label: 'Hybrid' }
  ];

  const availabilityOptions = [
    { value: 'Full-time', label: 'Full-time' },
    { value: 'Part-time', label: 'Part-time' },
    { value: 'Weekends Only', label: 'Weekends Only' },
    { value: 'Flexible', label: 'Flexible' }
  ];

  const studyHoursOptions = [
    { value: '1-2 hours', label: '1-2 hours' },
    { value: '2-4 hours', label: '2-4 hours' },
    { value: '4-6 hours', label: '4-6 hours' },
    { value: '6+ hours', label: '6+ hours' }
  ];

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/50">
      <SectionHeader 
        icon={Award} 
        title="Course Preferences"
        iconBgColor="from-blue-50 to-cyan-50"
        iconColor="text-yellow-600"
      />
      <p className="text-sm text-gray-600 mb-6 -mt-2">All fields are optional. Share your course preferences when you're ready.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <FormField
            label="Primary Course Interest"
            name="courseInterestedIn"
            type="text"
            value={formData.courseInterestedIn}
            onChange={handleChange}
            placeholder="Full Stack Development"
          />
        </div>

        <FormField
          label="Preferred Learning Mode"
          name="preferredLearningMode"
          type="select"
          value={formData.preferredLearningMode}
          onChange={handleChange}
          options={learningModeOptions}
        />

        <FormField
          label="Availability"
          name="availability"
          type="select"
          value={formData.availability}
          onChange={handleChange}
          options={availabilityOptions}
        />

        <FormField
          label="Expected Start Date"
          name="expectedStartDate"
          type="date"
          value={formData.expectedStartDate}
          onChange={handleChange}
          min={new Date().toISOString().split('T')[0]}
        />

        <FormField
          label="Daily Study Hours"
          name="dailyStudyHours"
          type="select"
          value={formData.dailyStudyHours}
          onChange={handleChange}
          options={studyHoursOptions}
        />
      </div>
    </div>
  );
};

export default CoursePreferencesForm;