const SectionNavigation = ({ sections, activeSection, onSectionChange }) => {
  return (
    <div className="lg:w-64 flex-shrink-0">
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 shadow-xl border border-white/50 sticky top-8">
        <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">Sections</h3>
        <nav className="space-y-2">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => onSectionChange(section.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  activeSection === section.id
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm font-medium">{section.name}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default SectionNavigation;