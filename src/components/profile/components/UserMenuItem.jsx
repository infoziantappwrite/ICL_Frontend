// components/profile/components/UserMenuItem.jsx
import { ChevronRight } from 'lucide-react';

const UserMenuItem = ({ icon: Icon, label, onClick, variant = 'default', showArrow = false }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
      variant === 'danger'
        ? 'text-red-600 hover:bg-red-50'
        : 'text-gray-700 hover:bg-gray-50'
    }`}
  >
    <div className="flex items-center gap-3">
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </div>
    {showArrow && <ChevronRight className="w-4 h-4" />}
  </button>
);

export default UserMenuItem;