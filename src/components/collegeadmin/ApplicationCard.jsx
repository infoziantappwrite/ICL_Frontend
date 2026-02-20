// components/collegeadmin/ApplicationCard.jsx
import { CheckCircle, XCircle, Clock } from 'lucide-react';

const ApplicationCard = ({ application }) => {
  const statusConfig = {
    Selected: {
      icon: <CheckCircle className="w-4 h-4 text-green-600" />,
      color: 'text-green-700',
    },
    Rejected: {
      icon: <XCircle className="w-4 h-4 text-red-600" />,
      color: 'text-red-700',
    },
  };

  const config = statusConfig[application.status] || {
    icon: <Clock className="w-4 h-4 text-yellow-500" />,
    color: 'text-yellow-700',
  };

  return (
    <div className="border border-gray-100 rounded-xl p-4 hover:bg-blue-50/40 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 truncate">
            {application.studentId?.fullName}
          </h4>
          <p className="text-sm text-gray-500 truncate">
            {application.jobId?.jobTitle} · {application.companyId?.name}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {new Date(application.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className={`flex items-center gap-1.5 ml-2 flex-shrink-0 ${config.color}`}>
          {config.icon}
          <span className="text-xs font-medium">{application.status}</span>
        </div>
      </div>
    </div>
  );
};

export default ApplicationCard;