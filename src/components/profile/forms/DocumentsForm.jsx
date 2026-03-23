// src/components/profile/forms/DocumentsForm.jsx
import { useState, useRef } from 'react';
import {
  FileText, CheckCircle, PenTool, Upload, Loader2,
  AlertCircle, ExternalLink, Trash2, RefreshCw, File, Image
} from 'lucide-react';
import SectionHeader from '../shared/SectionHeader';
import FormField from '../shared/FormField';
import { uploadAPI } from '../../../api/Api';

// ── Reusable file upload zone ─────────────────────────────────────────────────
const FileUploadZone = ({
  label,
  hint,
  accept,
  existingUrl,
  existingFilename,
  onUploadSuccess,
  onRemove,
  uploadFn,
}) => {
  const inputRef = useRef(null);
  const [uploadState, setUploadState] = useState({ status: 'idle', message: '' });
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setUploadState({ status: 'idle', message: '' });
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploadState({ status: 'uploading', message: 'Uploading…' });
    try {
      const data = await uploadFn(selectedFile);
      const url = data.file?.url || data.url;
      const filename = data.file?.filename || data.file?.originalname || selectedFile.name;
      if (!url) throw new Error('Server did not return a file URL.');
      setUploadState({ status: 'success', message: 'Uploaded successfully!' });
      onUploadSuccess(url, filename);
      setSelectedFile(null);
      if (inputRef.current) inputRef.current.value = '';
    } catch (err) {
      setUploadState({ status: 'error', message: err.message || 'Upload failed. Please try again.' });
    }
  };

  const handleRemove = () => {
    setSelectedFile(null);
    setUploadState({ status: 'idle', message: '' });
    if (inputRef.current) inputRef.current.value = '';
    onRemove();
  };

  const handleRetry = () => {
    setUploadState({ status: 'idle', message: '' });
    if (inputRef.current) inputRef.current.value = '';
    setSelectedFile(null);
  };

  const isImage = (url) => /\.(jpg|jpeg|png|gif|webp)$/i.test(url || '');

  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-gray-700">{label}</label>

      {/* Existing / uploaded file preview */}
      {existingUrl && (
        <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
          {isImage(existingUrl)
            ? <Image className="w-5 h-5 text-green-600 shrink-0" />
            : <File className="w-5 h-5 text-green-600 shrink-0" />
          }
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-green-800 truncate">
              {existingFilename || 'Uploaded file'}
            </p>
            <a
              href={existingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-green-600 hover:underline flex items-center gap-1 mt-0.5"
            >
              View file <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="p-1.5 rounded-lg hover:bg-red-100 text-red-500 transition-colors"
            title="Remove file"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* File picker + Upload button */}
      {!existingUrl && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="file"
              accept={accept}
              onChange={handleFileSelect}
              disabled={uploadState.status === 'uploading'}
              className="flex-1 text-sm text-gray-600 border border-gray-300 rounded-lg px-3 py-2 bg-white
                file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0
                file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            {selectedFile && uploadState.status !== 'uploading' && (
              <button
                type="button"
                onClick={handleUpload}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors shrink-0"
              >
                <Upload className="w-4 h-4" />
                Upload
              </button>
            )}
            {uploadState.status === 'uploading' && (
              <span className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 text-sm font-medium rounded-lg shrink-0">
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading…
              </span>
            )}
          </div>

          {/* Selected file info */}
          {selectedFile && uploadState.status === 'idle' && (
            <p className="text-xs text-gray-500 flex items-center gap-1 pl-1">
              <FileText className="w-3 h-3" />
              Ready: <span className="font-medium">{selectedFile.name}</span>
              <span className="text-gray-400">({(selectedFile.size / 1024).toFixed(0)} KB)</span>
            </p>
          )}

          {/* Success */}
          {uploadState.status === 'success' && (
            <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
              <CheckCircle className="w-4 h-4 shrink-0" />
              {uploadState.message}
            </div>
          )}

          {/* Error */}
          {uploadState.status === 'error' && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-2 text-sm text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold">Upload failed</p>
                  <p className="text-xs mt-0.5">{uploadState.message}</p>
                </div>
                <button
                  type="button"
                  onClick={handleRetry}
                  className="flex items-center gap-1 text-xs font-semibold text-red-700 hover:text-red-900 shrink-0"
                >
                  <RefreshCw className="w-3 h-3" /> Retry
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-gray-400">{hint}</p>
    </div>
  );
};

// ── Main DocumentsForm ────────────────────────────────────────────────────────
const DocumentsForm = ({ formData, handleChange, onDocumentUploaded }) => {
  const communicationModeOptions = [
    { value: 'Email', label: 'Email' },
    { value: 'Phone', label: 'Phone' },
    { value: 'WhatsApp', label: 'WhatsApp' },
    { value: 'SMS', label: 'SMS' },
  ];

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/50">
      <SectionHeader
        icon={FileText}
        title="Document Uploads & Communication"
        iconBgColor="from-blue-50 to-cyan-50"
        iconColor="text-yellow-600"
      />
      <p className="text-sm text-gray-500 mb-6 -mt-2">
        Select a file then click <strong>Upload</strong>. Files are uploaded immediately and saved with your profile.
      </p>

      <div className="space-y-6">

        {/* ── Resume ── */}
        <div className="border border-gray-200 p-5 rounded-xl bg-gray-50 space-y-4">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            Resume
            <span className="text-xs font-normal text-gray-500">(Optional)</span>
          </h3>

          <FileUploadZone
            label="Upload Resume File (PDF / DOC / DOCX)"
            hint="Max 5 MB. Choose a file and click Upload."
            accept=".pdf,.doc,.docx"
            existingUrl={formData.documents?.resume?.url || formData.resumeUrl || ''}
            existingFilename={formData.documents?.resume?.filename || ''}
            onUploadSuccess={(url, filename) => onDocumentUploaded('resume', url, filename)}
            onRemove={() => onDocumentUploaded('resume', '', '')}
            uploadFn={(file) => uploadAPI.uploadResume(file)}
          />

          {/* URL fallback — only show when no file uploaded */}
          {!(formData.documents?.resume?.url || formData.resumeUrl) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Or paste a Resume URL
              </label>
              <input
                type="url"
                name="resumeUrl"
                value={formData.resumeUrl || ''}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://drive.google.com/your-resume"
              />
            </div>
          )}
        </div>

        {/* ── ID Proof ── */}
        <div className="border border-gray-200 p-5 rounded-xl bg-gray-50 space-y-4">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            Government ID Proof
            <span className="text-xs font-normal text-gray-500">(Optional)</span>
          </h3>

          <FileUploadZone
            label="Upload ID Proof (PDF / JPG / PNG)"
            hint="Aadhar, PAN, Passport, etc. Max 5 MB."
            accept=".pdf,.jpg,.jpeg,.png"
            existingUrl={formData.documents?.idProof?.url || formData.idProofUrl || ''}
            existingFilename={formData.documents?.idProof?.filename || ''}
            onUploadSuccess={(url, filename) => onDocumentUploaded('idProof', url, filename)}
            onRemove={() => onDocumentUploaded('idProof', '', '')}
            uploadFn={(file) => uploadAPI.uploadIdProof(file)}
          />

          {/* URL fallback */}
          {!(formData.documents?.idProof?.url || formData.idProofUrl) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Or paste an ID Proof URL
              </label>
              <input
                type="url"
                name="idProofUrl"
                value={formData.idProofUrl || ''}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://drive.google.com/your-id"
              />
            </div>
          )}
        </div>

        {/* ── Communication Mode ── */}
        <FormField
          label="Preferred Communication Mode"
          name="preferredCommunicationMode"
          type="select"
          value={formData.preferredCommunicationMode}
          onChange={handleChange}
          options={communicationModeOptions}
        />

        {/* ── Declaration & Consent ── */}
        <div className="border-t pt-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Declaration & Consent</h3>
          <p className="text-sm text-gray-500 mb-5">Optional — you can complete this later.</p>

          <div className="space-y-4">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                name="declarationIsCorrect"
                checked={formData.declarationIsCorrect}
                onChange={handleChange}
                className="mt-0.5 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 group-hover:text-gray-900">
                I hereby declare that all the information provided above is true and correct to the best of my knowledge.
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                name="declarationAcceptTerms"
                checked={formData.declarationAcceptTerms}
                onChange={handleChange}
                className="mt-0.5 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 group-hover:text-gray-900">
                I accept the{' '}
                <a href="/terms" className="text-blue-600 hover:underline">Terms & Conditions</a>
                {' '}of the platform.
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                name="declarationConsentDataUsage"
                checked={formData.declarationConsentDataUsage}
                onChange={handleChange}
                className="mt-0.5 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 group-hover:text-gray-900">
                I consent to the use of my data for course-related communications and improvement of services.
              </span>
            </label>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Digital Signature <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <div className="flex items-center gap-3">
                <PenTool className="w-5 h-5 text-gray-400 shrink-0" />
                <input
                  type="text"
                  name="declarationSignature"
                  value={formData.declarationSignature}
                  onChange={handleChange}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-signature text-sm"
                  placeholder="Type your full name as signature"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                By typing your name, you agree to use it as your digital signature.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentsForm;