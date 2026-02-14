// components/common/QuickActionCard.jsx
const QuickActionCard = ({ icon: Icon, title, description, color, onClick }) => {
  const colorClasses = {
    blue: 'from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700',
    green: 'from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700',
    purple: 'from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700',
    orange: 'from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600',
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