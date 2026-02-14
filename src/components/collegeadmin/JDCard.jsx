// components/collegeadmin/JDCard.jsx
import { Eye, Users } from 'lucide-react';

const JDCard = ({ jd }) => {
  const statusClasses = {
    Active: 'bg-green-100 text-green-700',
    Closed: 'bg-gray-100 text-gray-700',
    Draft: 'bg-yellow-100 text-yellow-700',
  };

  return (
    <div className="border border-gray-100 rounded-xl p-4 hover:bg-green-50/40 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 truncate">{jd.jobTitle}</h4>
          <p className="text-sm text-gray-500 truncate">{jd.companyId?.name}</p>
        </div>
        <span
          className={`ml-2 px-2.5 py-0.5 text-xs font-semibold rounded-full flex-shrink-0 ${
            statusClasses[jd.status] || statusClasses.Draft
          }`}
        >
          {jd.status}
        </span>
      </div>
      <div className="flex items-center gap-4 text-xs text-gray-400 mt-2">
        <span className="flex items-center gap-1">
          <Eye className="w-3.5 h-3.5" />
          {jd.stats?.totalViews ?? 0} views
        </span>
        <span className="flex items-center gap-1">
          <Users className="w-3.5 h-3.5" />
          {jd.stats?.totalApplications ?? 0} applied
        </span>
      </div>
    </div>
  );
};

export default JDCard;