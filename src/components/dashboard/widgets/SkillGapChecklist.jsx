// src/components/dashboard/widgets/SkillGapChecklist.jsx
// Role-based skill-gap checklist.
// Props:
//   studentSkills — array of skill strings or {name} objects from profile
//   onBrowseCourses — () => void  (navigate to courses page)
//
// Zero API cost — static role→skills config diffed against profile skills.

import { useState, useMemo } from 'react';
import { CheckCircle2, Circle, Target, ChevronDown, ArrowRight, BookOpen } from 'lucide-react';

// ─── Static role → required skills config ─────────────────────────────────────
const ROLE_SKILLS = {
  'Full Stack Developer': {
    icon: '🖥️',
    skills: [
      { name: 'HTML & CSS', priority: 'core' },
      { name: 'JavaScript', priority: 'core' },
      { name: 'React.js',   priority: 'core' },
      { name: 'Node.js',    priority: 'core' },
      { name: 'Express.js', priority: 'core' },
      { name: 'MongoDB',    priority: 'core' },
      { name: 'REST APIs',  priority: 'core' },
      { name: 'Git',        priority: 'good-to-have' },
      { name: 'TypeScript', priority: 'good-to-have' },
      { name: 'Docker',     priority: 'good-to-have' },
    ],
  },
  'Data Analyst': {
    icon: '📊',
    skills: [
      { name: 'Python',            priority: 'core' },
      { name: 'SQL',               priority: 'core' },
      { name: 'Excel',             priority: 'core' },
      { name: 'Statistics',        priority: 'core' },
      { name: 'Pandas',            priority: 'core' },
      { name: 'Power BI',          priority: 'good-to-have' },
      { name: 'Tableau',           priority: 'good-to-have' },
      { name: 'Machine Learning',  priority: 'good-to-have' },
      { name: 'NumPy',             priority: 'good-to-have' },
      { name: 'Data Visualisation',priority: 'good-to-have' },
    ],
  },
  'Backend Developer': {
    icon: '⚙️',
    skills: [
      { name: 'Java',        priority: 'core' },
      { name: 'Spring Boot', priority: 'core' },
      { name: 'SQL',         priority: 'core' },
      { name: 'REST APIs',   priority: 'core' },
      { name: 'Node.js',     priority: 'core' },
      { name: 'MongoDB',     priority: 'good-to-have' },
      { name: 'Docker',      priority: 'good-to-have' },
      { name: 'Redis',       priority: 'good-to-have' },
      { name: 'Microservices',priority: 'good-to-have' },
      { name: 'Git',         priority: 'good-to-have' },
    ],
  },
  'Cloud / DevOps Engineer': {
    icon: '☁️',
    skills: [
      { name: 'Linux',       priority: 'core' },
      { name: 'Docker',      priority: 'core' },
      { name: 'Kubernetes',  priority: 'core' },
      { name: 'AWS',         priority: 'core' },
      { name: 'CI/CD',       priority: 'core' },
      { name: 'Terraform',   priority: 'good-to-have' },
      { name: 'Jenkins',     priority: 'good-to-have' },
      { name: 'Python',      priority: 'good-to-have' },
      { name: 'Git',         priority: 'good-to-have' },
      { name: 'Ansible',     priority: 'good-to-have' },
    ],
  },
  'Mobile Developer': {
    icon: '📱',
    skills: [
      { name: 'React Native', priority: 'core' },
      { name: 'JavaScript',   priority: 'core' },
      { name: 'REST APIs',    priority: 'core' },
      { name: 'Git',          priority: 'core' },
      { name: 'Expo',         priority: 'core' },
      { name: 'Flutter',      priority: 'good-to-have' },
      { name: 'Dart',         priority: 'good-to-have' },
      { name: 'Android',      priority: 'good-to-have' },
      { name: 'iOS',          priority: 'good-to-have' },
      { name: 'Firebase',     priority: 'good-to-have' },
    ],
  },
  'UI/UX Designer': {
    icon: '🎨',
    skills: [
      { name: 'Figma',               priority: 'core' },
      { name: 'User Research',       priority: 'core' },
      { name: 'Wireframing',         priority: 'core' },
      { name: 'Prototyping',         priority: 'core' },
      { name: 'Design Systems',      priority: 'core' },
      { name: 'HTML & CSS',          priority: 'good-to-have' },
      { name: 'Adobe XD',            priority: 'good-to-have' },
      { name: 'Accessibility',       priority: 'good-to-have' },
      { name: 'Motion Design',       priority: 'good-to-have' },
      { name: 'User Testing',        priority: 'good-to-have' },
    ],
  },
  'Data Scientist / ML Engineer': {
    icon: '🧠',
    skills: [
      { name: 'Python',          priority: 'core' },
      { name: 'Machine Learning',priority: 'core' },
      { name: 'Statistics',      priority: 'core' },
      { name: 'Deep Learning',   priority: 'core' },
      { name: 'Pandas',          priority: 'core' },
      { name: 'TensorFlow',      priority: 'good-to-have' },
      { name: 'PyTorch',         priority: 'good-to-have' },
      { name: 'SQL',             priority: 'good-to-have' },
      { name: 'NLP',             priority: 'good-to-have' },
      { name: 'Computer Vision', priority: 'good-to-have' },
    ],
  },
  'QA / Test Engineer': {
    icon: '🔍',
    skills: [
      { name: 'Manual Testing',  priority: 'core' },
      { name: 'Selenium',        priority: 'core' },
      { name: 'Java',            priority: 'core' },
      { name: 'JIRA',            priority: 'core' },
      { name: 'API Testing',     priority: 'core' },
      { name: 'Postman',         priority: 'good-to-have' },
      { name: 'Cypress',         priority: 'good-to-have' },
      { name: 'SQL',             priority: 'good-to-have' },
      { name: 'Performance Testing', priority: 'good-to-have' },
      { name: 'CI/CD',           priority: 'good-to-have' },
    ],
  },
};

const ROLES = Object.keys(ROLE_SKILLS);

const normalise = (s) => (typeof s === 'string' ? s : s?.name || '').toLowerCase().trim();

// Check if student skill list contains a required skill (fuzzy: includes)
const hasSkill = (studentSkillNames, requiredName) => {
  const req = requiredName.toLowerCase();
  return studentSkillNames.some(s => s.includes(req) || req.includes(s));
};

export const SkillGapChecklist = ({ studentSkills = [], onBrowseCourses }) => {
  const [selectedRole, setSelectedRole] = useState(ROLES[0]);
  const [showAll, setShowAll]           = useState(false);
  const [open, setOpen]                 = useState(false);

  const studentSkillNames = useMemo(
    () => studentSkills.map(normalise).filter(Boolean),
    [studentSkills]
  );

  const { have, gap, coreGaps, gtgGaps } = useMemo(() => {
    const roleSkills = ROLE_SKILLS[selectedRole]?.skills || [];
    const withStatus = roleSkills.map(s => ({
      ...s,
      has: hasSkill(studentSkillNames, s.name),
    }));
    return {
      have:     withStatus.filter(s => s.has),
      gap:      withStatus.filter(s => !s.has),
      coreGaps: withStatus.filter(s => !s.has && s.priority === 'core'),
      gtgGaps:  withStatus.filter(s => !s.has && s.priority === 'good-to-have'),
    };
  }, [selectedRole, studentSkillNames]);

  const roleData     = ROLE_SKILLS[selectedRole];
  const totalSkills  = roleData.skills.length;
  const readyPct     = Math.round((have.length / totalSkills) * 100);
  const barColor     = readyPct >= 80 ? 'bg-emerald-500' : readyPct >= 50 ? 'bg-blue-500' : 'bg-amber-400';
  const barText      = readyPct >= 80 ? 'text-emerald-600' : readyPct >= 50 ? 'text-blue-600' : 'text-amber-600';

  const visibleGap   = showAll ? gap : gap.slice(0, 5);

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 md:p-5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-4 h-4 text-gray-400" />
        <h3 className="text-[14px] font-bold text-gray-900">Skill Gap Checklist</h3>
      </div>

      {/* Role selector */}
      <div className="relative mb-4">
        <button
          onClick={() => setOpen(o => !o)}
          className="w-full flex items-center justify-between px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[13px] font-medium text-gray-700 hover:border-gray-300 transition-colors"
        >
          <span className="flex items-center gap-2">
            <span>{roleData.icon}</span>
            {selectedRole}
          </span>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        {open && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-lg z-20 overflow-hidden">
            {ROLES.map(role => (
              <button
                key={role}
                onClick={() => { setSelectedRole(role); setOpen(false); setShowAll(false); }}
                className={`w-full text-left flex items-center gap-2.5 px-3.5 py-2.5 text-[12px] font-medium transition-colors
                  ${role === selectedRole ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`}
              >
                <span>{ROLE_SKILLS[role].icon}</span>
                {role}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Readiness bar */}
      <div className="mb-4">
        <div className="flex justify-between text-[11px] mb-1.5">
          <span className="text-gray-500 font-medium">Role readiness</span>
          <span className={`font-bold ${barText}`}>{have.length}/{totalSkills} skills</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${barColor} transition-all duration-700`}
            style={{ width: `${readyPct}%` }}
          />
        </div>
        <p className={`text-[10px] mt-1 font-semibold ${barText}`}>
          {readyPct >= 80
            ? '🎉 You\'re well-prepared for this role!'
            : readyPct >= 50
              ? '💪 Almost there — bridge ' + coreGaps.length + ' core gaps.'
              : '📚 Focus on core skills first — ' + coreGaps.length + ' remaining.'}
        </p>
      </div>

      {/* Skills you have */}
      {have.length > 0 && (
        <div className="mb-3">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">You have ({have.length})</p>
          <div className="flex flex-wrap gap-1.5">
            {have.map(s => (
              <span key={s.name}
                className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100">
                <CheckCircle2 className="w-3 h-3" />
                {s.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Skill gaps */}
      {gap.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
            Skill gaps ({gap.length})
          </p>
          <div className="space-y-1.5">
            {visibleGap.map(s => (
              <div key={s.name}
                className="flex items-center justify-between gap-2 py-1.5 px-2.5 rounded-xl bg-gray-50 border border-gray-100">
                <div className="flex items-center gap-2">
                  <Circle className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                  <span className="text-[12px] text-gray-700 font-medium">{s.name}</span>
                </div>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                  s.priority === 'core'
                    ? 'bg-red-50 text-red-600 border border-red-100'
                    : 'bg-gray-100 text-gray-400'
                }`}>
                  {s.priority === 'core' ? 'Core' : 'Optional'}
                </span>
              </div>
            ))}
          </div>

          {gap.length > 5 && (
            <button
              onClick={() => setShowAll(v => !v)}
              className="mt-2 text-[11px] font-semibold text-blue-600 hover:text-blue-700"
            >
              {showAll ? 'Show less ↑' : `Show ${gap.length - 5} more ↓`}
            </button>
          )}
        </div>
      )}

      {gap.length === 0 && (
        <div className="text-center py-4">
          <CheckCircle2 className="w-8 h-8 text-emerald-300 mx-auto mb-2" />
          <p className="text-[13px] font-semibold text-emerald-600">You have all skills for this role!</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Try selecting a more advanced role.</p>
        </div>
      )}

      {/* CTA */}
      {gap.length > 0 && (
        <button
          onClick={onBrowseCourses}
          className="mt-4 w-full flex items-center justify-center gap-1.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-semibold rounded-xl transition-colors"
        >
          <BookOpen className="w-3.5 h-3.5" />
          Bridge gaps with courses
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

export default SkillGapChecklist;