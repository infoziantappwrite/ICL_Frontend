// components/profile/components/EmptyState.jsx
import { Plus } from 'lucide-react';

const EmptyState = ({ icon: Icon, text }) => (
  <div className="flex flex-col items-center justify-center py-6 text-center">
    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
      <Icon className="w-6 h-6 text-gray-400" />
    </div>
    <p className="text-sm text-gray-500">{text}</p>
    <button className="mt-3 text-sm text-blue-600 font-medium flex items-center gap-1 hover:gap-2 transition-all">
      Add now
      <Plus className="w-4 h-4" />
    </button>
  </div>
);

export default EmptyState;