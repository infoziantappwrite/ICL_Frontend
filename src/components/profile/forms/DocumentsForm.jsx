// src/components/profile/forms/DocumentsForm.jsx - NO REQUIRED FIELDS
import { FileText, CheckCircle, PenTool } from 'lucide-react';
import SectionHeader from '../shared/SectionHeader';
import FormField from '../shared/FormField';

const DocumentsForm = ({ formData, handleChange, files, handleFileChange }) => {
  const communicationModeOptions = [
    { value: 'Email', label: 'Email' },
    { value: 'Phone', label: 'Phone' },
    { value: 'WhatsApp', label: 'WhatsApp' },
    { value: 'SMS', label: 'SMS' }
  ];

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/50">
      <SectionHeader 
        icon={FileText} 
        title="Document Uploads & Communication"
        iconBgColor="from-yellow-100 to-amber-100"
        iconColor="text-yellow-600"
      />
      <p className="text-sm text-gray-600 mb-6 -mt-2">All fields are optional. Add documents when you're ready.</p>

      <div className="space-y-6">
        {/* Resume Section */}
        <div className="border border-gray-200 p-4 rounded-lg bg-gray-50">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            Resume
            <span className="text-xs font-normal text-gray-500">(Upload file OR provide URL - Optional)</span>
          </h3>

          {/* Show existing resume if available */}
          {formData.documents.resume.url && !files.resumeFile && (
            <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Current resume: {formData.documents.resume.filename || 'Uploaded'}
              </p>
            </div>
          )}

          {/* Resume URL */}
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Resume URL
            </label>
            <input
              type="url"
              name="resumeUrl"
              value={formData.resumeUrl}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://drive.google.com/your-resume"
            />
          </div>

          {/* Resume File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Upload Resume File (PDF/DOC/DOCX)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="file"
                name="resumeFile"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                className="w-full px-2 py-2 border border-gray-300 rounded-lg bg-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {files.resumeFile && (
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              )}
            </div>
            {files.resumeFile && (
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                File selected: {files.resumeFile.name}
              </p>
            )}
          </div>

          <p className="text-xs text-gray-500 mt-2">
            You can provide URL or upload a file, or skip this for now.
          </p>
        </div>

        {/* ID Proof Section */}
        <div className="border border-gray-200 p-4 rounded-lg bg-gray-50">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            Government ID Proof
            <span className="text-xs font-normal text-gray-500">(Upload file OR provide URL - Optional)</span>
          </h3>

          {/* Show existing ID proof if available */}
          {formData.documents.idProof.url && !files.idProofFile && (
            <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Current ID proof: {formData.documents.idProof.filename || 'Uploaded'}
              </p>
            </div>
          )}

          {/* ID Proof URL */}
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ID Proof URL
            </label>
            <input
              type="url"
              name="idProofUrl"
              value={formData.idProofUrl}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://drive.google.com/your-id"
            />
          </div>

          {/* ID Proof File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Upload ID Proof File (PDF/JPG/PNG)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="file"
                name="idProofFile"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="w-full px-2 py-2 border border-gray-300 rounded-lg bg-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {files.idProofFile && (
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              )}
            </div>
            {files.idProofFile && (
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                File selected: {files.idProofFile.name}
              </p>
            )}
          </div>

          <p className="text-xs text-gray-500 mt-2">
            You can provide URL or upload a file, or skip this for now.
          </p>
        </div>

        {/* Communication Mode */}
        <FormField
          label="Preferred Communication Mode"
          name="preferredCommunicationMode"
          type="select"
          value={formData.preferredCommunicationMode}
          onChange={handleChange}
          options={communicationModeOptions}
        />

        {/* Declaration & Consent - Optional */}
        <div className="border-t pt-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Declaration & Consent</h3>
          <p className="text-sm text-gray-600 mb-4">Optional - You can complete this later if needed.</p>
          
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                name="declarationIsCorrect"
                checked={formData.declarationIsCorrect}
                onChange={handleChange}
                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label className="text-sm text-gray-700">
                I hereby declare that all the information provided above is true and correct to the best of my knowledge.
              </label>
            </div>

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                name="declarationAcceptTerms"
                checked={formData.declarationAcceptTerms}
                onChange={handleChange}
                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label className="text-sm text-gray-700">
                I accept the <a href="/terms" className="text-blue-600 hover:underline">Terms & Conditions</a> of the platform.
              </label>
            </div>

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                name="declarationConsentDataUsage"
                checked={formData.declarationConsentDataUsage}
                onChange={handleChange}
                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label className="text-sm text-gray-700">
                I consent to the use of my data for course-related communications and improvement of services.
              </label>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Digital Signature (Optional)
              </label>
              <div className="flex items-center gap-3">
                <PenTool className="w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="declarationSignature"
                  value={formData.declarationSignature}
                  onChange={handleChange}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-signature"
                  placeholder="Type your full name as signature"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                By typing your name, you agree to use it as your digital signature
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentsForm;