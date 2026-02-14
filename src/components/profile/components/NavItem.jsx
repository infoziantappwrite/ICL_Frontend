// components/profile/components/NavItem.jsx
const NavItem = ({ icon: Icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
      active
        ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md'
        : 'text-gray-700 hover:bg-blue-50'
    }`}
  >
    <Icon className="w-5 h-5" />
    <span className="text-sm font-medium">{label}</span>
  </button>
);

export default NavItem;