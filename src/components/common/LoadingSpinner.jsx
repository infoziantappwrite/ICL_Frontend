import { User, Loader2 } from 'lucide-react';

const LoadingSpinner = ({
  message = 'Loading...',
  submessage = 'Please wait a moment',
  icon: Icon = User,
  fullScreen = true
}) => {
  const content = (
    <div className="text-center">
      {/* Spinner with icon overlay */}
      <div className="relative w-20 h-20 mx-auto">
        <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
            <Icon className="w-5 h-5 text-blue-600" />
          </div>
        </div>
      </div>

      <p className="mt-6 text-gray-800 font-semibold text-lg">{message}</p>
      {submessage && (
        <p className="mt-1 text-sm text-gray-500">{submessage}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50">
        {content}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-12">
      {content}
    </div>
  );
};

// Inline loading spinner for buttons
export const ButtonSpinner = ({ text = 'Loading...' }) => {
  return (
    <span className="flex items-center justify-center gap-2">
      <Loader2 className="h-5 w-5 animate-spin" />
      {text}
    </span>
  );
};

export default LoadingSpinner;