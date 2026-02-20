import { Save, Loader2 } from 'lucide-react';

const NavigationButtons = ({
  currentIndex,
  totalSections,
  onPrevious,
  onNext,
  saving = false
}) => {
  const showPrevious = currentIndex > 0;
  const isLastSection = currentIndex >= totalSections - 1;

  return (
    <div className="flex gap-4">
      {showPrevious && (
        <button
          type="button"
          onClick={onPrevious}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Previous
        </button>
      )}

      {isLastSection ? (
        <button
          type="submit"
          disabled={saving}
          className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Saving Profile...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Complete Profile
            </>
          )}
        </button>
      ) : (
        <button
          type="button"
          onClick={onNext}
          className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:shadow-lg transition-all duration-200"
        >
          Next Section
        </button>
      )}
    </div>
  );
};

export default NavigationButtons;