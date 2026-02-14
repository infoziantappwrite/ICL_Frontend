// components/profile/components/ProfileInfoCard.jsx
import { CheckCircle, AlertCircle, ChevronRight } from 'lucide-react';

const ProfileInfoCard = ({ title, icon: Icon, children, onClick, completed }) => (
  <div
    className="bg-white/80 backdrop-blur-xl rounded-xl p-6 shadow-lg shadow-blue-500/10 border border-white/50 hover:shadow-xl transition-all duration-300 cursor-pointer group"
    onClick={onClick}
  >
    <div className="flex justify-between items-start mb-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-lg flex items-center justify-center">
          <Icon className="w-5 h-5 text-blue-600" />
        </div>
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
      </div>
      {completed ? (
        <div className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="text-xs font-medium text-green-600">Completed</span>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-orange-500" />
          <span className="text-xs font-medium text-orange-600">Incomplete</span>
        </div>
      )}
    </div>
    <div className="min-h-[80px]">{children}</div>
    <div className="mt-4 pt-4 border-t border-gray-100">
      <button className="text-sm text-blue-600 font-medium flex items-center gap-1 hover:gap-2 transition-all">
        Edit
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  </div>
);

export default ProfileInfoCard;