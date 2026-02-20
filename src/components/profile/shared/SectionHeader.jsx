const SectionHeader = ({ icon: Icon, title, iconBgColor = "from-blue-100 to-cyan-100", iconColor = "text-blue-600" }) => {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className={`w-10 h-10 bg-gradient-to-br ${iconBgColor} rounded-lg flex items-center justify-center`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <h2 className="text-xl font-bold text-gray-900">{title}</h2>
    </div>
  );
};

export default SectionHeader;