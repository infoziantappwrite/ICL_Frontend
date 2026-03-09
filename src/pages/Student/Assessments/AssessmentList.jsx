// pages/Student/Assessments/AssessmentList.jsx
// Fixed to use assessmentAttemptAPI.getMyAssignedAssessments()
// Backend returns: assessments[].skill_id.name, .level, .duration_minutes,
//                  .source_type, .status, .scheduled_date

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, Clock, Star, Target, TrendingUp,
  PlayCircle, RefreshCw, AlertCircle, Calendar, Tag
} from 'lucide-react';
import StudentLayout from '../../../components/layout/StudentLayout';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { assessmentAttemptAPI } from '../../../api/Api';

const LEVEL_CONFIG = {
  Beginner:     { label: 'Beginner',     color: 'bg-green-100 text-green-700 border-green-200',   dot: 'bg-green-500' },
  Intermediate: { label: 'Intermediate', color: 'bg-blue-100 text-blue-700 border-blue-200',      dot: 'bg-blue-500'  },
  Advanced:     { label: 'Advanced',     color: 'bg-purple-100 text-purple-700 border-purple-200', dot: 'bg-purple-500' },
};

const SOURCE_LABEL = {
  college_admin_manual: 'Admin',
  college_admin_ai:     'AI',
  student_skill_based:  'Skill-Based',
};

const AssessmentCard = ({ assessment, onStart }) => {
  const levelCfg = LEVEL_CONFIG[assessment.level] || LEVEL_CONFIG.Beginner;
  const sourceLabel = SOURCE_LABEL[assessment.source_type] || assessment.source_type;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 p-6 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 truncate">
            {assessment.skill_id?.name || 'Skill Assessment'}
          </h3>
          <p className="text-sm text-gray-500 mt-0.5">{sourceLabel} assessment</p>
        </div>
        <span className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full border ${levelCfg.color} flex items-center gap-1.5`}>
          <span className={`w-1.5 h-1.5 rounded-full ${levelCfg.dot}`}></span>
          {levelCfg.label}
        </span>
      </div>

      {/* Tags */}
      {assessment.tags?.length > 0 && (
        <div className="flex gap-1 flex-wrap">
          {assessment.tags.slice(0, 4).map(t => (
            <span key={t} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{t}</span>
          ))}
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 text-center">
        <div className="bg-gray-50 rounded-xl p-3">
          <Clock className="w-4 h-4 text-gray-400 mx-auto mb-1" />
          <p className="text-xs text-gray-500">Duration</p>
          <p className="text-sm font-semibold text-gray-800">
            {assessment.duration_minutes ? `${assessment.duration_minutes} min` : '—'}
          </p>
        </div>
        {assessment.scheduled_date ? (
          <div className="bg-amber-50 rounded-xl p-3">
            <Calendar className="w-4 h-4 text-amber-500 mx-auto mb-1" />
            <p className="text-xs text-gray-500">Scheduled</p>
            <p className="text-sm font-semibold text-gray-800">
              {new Date(assessment.scheduled_date).toLocaleDateString()}
            </p>
          </div>
        ) : (
          <div className="bg-green-50 rounded-xl p-3">
            <Star className="w-4 h-4 text-green-500 mx-auto mb-1" />
            <p className="text-xs text-gray-500">Access</p>
            <p className="text-sm font-semibold text-green-700">On-demand</p>
          </div>
        )}
      </div>

      <button
        onClick={() => onStart(assessment)}
        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-cyan-700 transition-all shadow-sm hover:shadow"
      >
        <PlayCircle className="w-4 h-4" />
        Start Assessment
      </button>
    </div>
  );
};

const AssessmentList = () => {
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { fetchAssessments(); }, []);

  const fetchAssessments = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await assessmentAttemptAPI.getMyAssignedAssessments();
      if (res.success) setAssessments(res.assessments || []);
      else setError(res.message || 'Failed to load assessments');
    } catch (err) {
      setError(err.message || 'Failed to load assessments');
    } finally {
      setLoading(false);
    }
  };

  const handleStart = (assessment) => {
    navigate(`/dashboard/student/assessments/${assessment._id}/take`);
  };

  return (
    <StudentLayout title="Skill Assessments">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl p-6 text-white flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-1">Skill Assessments</h1>
            <p className="text-blue-100 text-sm">Take assessments to verify your skills and improve your placement profile</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/dashboard/student/assessments/history')}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-sm font-medium transition-all"
            >
              <TrendingUp className="w-4 h-4" />
              My History
            </button>
            <button
              onClick={fetchAssessments}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-sm font-medium transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Info bar */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <strong>How it works:</strong> Complete assessments assigned by your college admin or open skill-based tests.
            Your results help match you to job opportunities.
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-700">
            <AlertCircle className="w-8 h-8 mx-auto mb-2" />
            {error}
            <button onClick={fetchAssessments} className="block mx-auto mt-3 text-sm underline">Retry</button>
          </div>
        ) : assessments.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Assessments Available</h3>
            <p className="text-gray-500 text-sm">Check back later — your college admin will publish assessments soon.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <p className="text-gray-600 text-sm">{assessments.length} assessment{assessments.length !== 1 ? 's' : ''} available</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {assessments.map(a => (
                <AssessmentCard key={a._id} assessment={a} onStart={handleStart} />
              ))}
            </div>
          </>
        )}
      </div>
    </StudentLayout>
  );
};

export default AssessmentList;