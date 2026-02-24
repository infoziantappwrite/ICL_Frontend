// components/common/QuickActionCard.jsx
const QuickActionCard = ({ icon: Icon, title, description, color, onClick }) => {
  const colorClasses = {
    blue: 'from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700',
    green: 'from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700',
    purple: 'from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900',
    orange: 'from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800',
  };

  return (
    <button
      onClick={onClick}
      className={`bg-gradient-to-r ${colorClasses[color]} text-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] text-left group`}
    >
      <div className="mb-4">
        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center group-hover:bg-white/30 transition-colors">
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      <h4 className="font-bold text-lg mb-1">{title}</h4>
      <p className="text-sm text-white/80">{description}</p>
    </button>
  );
};

export default QuickActionCard;