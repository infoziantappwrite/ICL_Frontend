// src/pages/CollegeAdmin/Assessments/wizard/AssessmentStep4.jsx
import { useState, useEffect } from 'react';
import { useAssessmentWizard } from '../../../../hooks/useAssessmentWizard.jsx';
import { assessmentAPI } from '../../../../api/Api';
import { groupAPI } from '../../../../api/groupAPI';
import {
  Users, Layers, GraduationCap, Search, X,
  ChevronLeft, ChevronRight, CheckCircle2, Info,
} from 'lucide-react';

const AssessmentStep4 = ({ onNext, onBack }) => {
  const { state, setField } = useAssessmentWizard();
  const e = state.errors;

  const [students,    setStudents]    = useState([]);
  const [groups,      setGroups]      = useState([]);
  const [searchQ,     setSearchQ]     = useState('');
  const [loadingS,    setLoadingS]    = useState(false);
  const [loadingG,    setLoadingG]    = useState(false);

  // Load students
  useEffect(() => {
    if (state.assignment_mode !== 'individual') return;
    setLoadingS(true);
    assessmentAPI.getEligibleStudents(state.assessmentId || 'preview', { limit: 200 })
      .then(res => {
        if (res.success) setStudents(res.students || res.eligibleStudents || []);
      })
      .catch(() => {})
      .finally(() => setLoadingS(false));
  }, [state.assignment_mode, state.assessmentId]);

  // Load groups
  useEffect(() => {
    if (state.assignment_mode !== 'group') return;
    setLoadingG(true);
    groupAPI.getGroups()
      .then(res => {
        if (res.success) setGroups(res.groups || res.data || []);
      })
      .catch(() => {})
      .finally(() => setLoadingG(false));
  }, [state.assignment_mode]);

  const toggleStudent = (student) => {
    const already = state.selectedStudents.some(s => s._id === student._id);
    setField('selectedStudents',
      already
        ? state.selectedStudents.filter(s => s._id !== student._id)
        : [...state.selectedStudents, student]
    );
  };

  const filteredStudents = students.filter(s => {
    if (!searchQ.trim()) return true;
    const q = searchQ.toLowerCase();
    return (s.fullName || s.name || '').toLowerCase().includes(q) ||
           (s.email || '').toLowerCase().includes(q);
  });

  const MODES = [
    { value: 'class',      label: 'All Students in Class', icon: GraduationCap, desc: 'Auto-assign every student enrolled in this class/section' },
    { value: 'group',      label: 'By Group',              icon: Layers,        desc: 'Select a pre-configured student group' },
    { value: 'individual', label: 'Select Individually',   icon: Users,         desc: 'Hand-pick specific students from the list' },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-black text-slate-900">Assign Students</h2>
        <p className="text-sm text-slate-500 mt-0.5">Choose who can take this assessment.</p>
      </div>

      {/* Mode selector */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {MODES.map(m => {
          const active = state.assignment_mode === m.value;
          return (
            <button key={m.value}
              onClick={() => setField('assignment_mode', m.value)}
              className={`flex flex-col items-start gap-2 p-4 rounded-2xl border-2 text-left transition-all ${
                active
                  ? 'border-[#003399] bg-[#003399]/5 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                active ? 'text-white' : 'text-slate-500 bg-slate-100'
              }`}
              style={active ? { background: '#003399' } : {}}>
                <m.icon className="w-5 h-5" />
              </div>
              <div>
                <p className={`text-sm font-black ${active ? 'text-[#003399]' : 'text-slate-700'}`}>{m.label}</p>
                <p className="text-xs text-slate-400 mt-0.5 leading-snug">{m.desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Mode: class */}
      {state.assignment_mode === 'class' && (
        <div className="flex items-start gap-3 bg-[#003399]/5 border border-[#003399]/20 rounded-2xl p-4 text-sm text-[#003399]">
          <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>
            All students enrolled in <strong>{state.classSection || 'this class'}</strong> will automatically be assigned when the assessment is published.
          </span>
        </div>
      )}

      {/* Mode: group */}
      {state.assignment_mode === 'group' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3">
          <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
            Select Group <span className="text-rose-500">*</span>
          </label>
          {loadingG ? (
            <div className="h-11 bg-slate-100 rounded-xl animate-pulse" />
          ) : (
            <select
              value={state.selectedGroup}
              onChange={ev => setField('selectedGroup', ev.target.value)}
              className={`w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#003399]/30 focus:border-[#003399] bg-white ${e.selectedGroup ? 'border-rose-300' : ''}`}
            >
              <option value="">— Choose a group —</option>
              {groups.map(g => (
                <option key={g._id} value={g._id}>{g.name}</option>
              ))}
            </select>
          )}
          {e.selectedGroup && <p className="text-xs text-rose-500 font-semibold">{e.selectedGroup}</p>}
          {groups.length === 0 && !loadingG && (
            <p className="text-xs text-slate-400">No groups found. Create groups in the Groups section first.</p>
          )}
        </div>
      )}

      {/* Mode: individual */}
      {state.assignment_mode === 'individual' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
            <p className="text-sm font-black text-slate-700">
              {state.selectedStudents.length} selected
            </p>
            <div className="relative flex-1 min-w-48 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search students…"
                value={searchQ}
                onChange={ev => setSearchQ(ev.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#003399]/30 focus:border-[#003399] bg-white"
              />
            </div>
          </div>

          {/* Selected chips */}
          {state.selectedStudents.length > 0 && (
            <div className="px-4 py-3 flex flex-wrap gap-2 border-b border-slate-100 bg-slate-50/50">
              {state.selectedStudents.map(s => (
                <span key={s._id}
                  className="flex items-center gap-1.5 bg-white border border-[#003399]/30 text-[#003399] text-xs font-bold px-2.5 py-1 rounded-full">
                  {s.fullName || s.name || s.email}
                  <button onClick={() => toggleStudent(s)}
                    className="text-[#003399]/60 hover:text-[#003399] transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {loadingS ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              {searchQ ? 'No matching students found.' : 'No students available.'}
            </div>
          ) : (
            <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
              {filteredStudents.map(s => {
                const selected = state.selectedStudents.some(x => x._id === s._id);
                return (
                  <button key={s._id}
                    onClick={() => toggleStudent(s)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                      selected ? 'bg-[#003399]/5' : 'hover:bg-slate-50'
                    }`}>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0 ${
                      selected ? 'text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                    style={selected ? { background: '#003399' } : {}}>
                      {selected
                        ? <CheckCircle2 className="w-4 h-4" />
                        : (s.fullName || s.name || '?')[0].toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-800 truncate">{s.fullName || s.name}</p>
                      <p className="text-xs text-slate-400 truncate">{s.email}</p>
                    </div>
                    {selected && (
                      <span className="text-[10px] font-black text-[#003399] uppercase tracking-wider flex-shrink-0">Selected</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
          {e.selectedStudents && (
            <div className="px-4 py-3 border-t border-slate-100">
              <p className="text-xs text-rose-500 font-semibold">{e.selectedStudents}</p>
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-2">
        <button onClick={onBack}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-bold hover:bg-slate-50 transition-all">
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>
        <button onClick={onNext}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm font-black shadow-sm transition-all hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #003399, #00A9CE)' }}>
          Review & Publish
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default AssessmentStep4;
