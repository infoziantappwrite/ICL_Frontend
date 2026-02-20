// components/profile/components/StatCard.jsx
import { ChevronRight } from 'lucide-react';

const StatCard = ({ title, count, icon: Icon, color, onClick, suffix = '' }) => (
  <div
    onClick={onClick}
    className="bg-white/80 backdrop-blur-xl rounded-xl p-4 md:p-6 shadow-lg shadow-blue-500/10 border border-white/50 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer group"
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-600 mb-1">{title}</p>
        <p className="text-3xl font-bold text-gray-900">
          {count}
          {suffix}
        </p>
      </div>
      <div
        className={`w-12 h-12 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}
      >
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
    <div className="mt-3 flex items-center text-blue-600 text-sm font-medium group-hover:gap-2 transition-all">
      <span>View details</span>
      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
    </div>
  </div>
);

export default StatCard;