const AuthFooter = () => {
  return (
    <div className="mt-8 text-center">
      <div className="flex justify-center space-x-6 text-sm text-gray-600">
        <a href="/terms" className="hover:text-blue-600 transition-colors">
          Terms
        </a>
        <span>•</span>
        <a href="/privacy" className="hover:text-blue-600 transition-colors">
          Privacy
        </a>
        <span>•</span>
        <a href="/help" className="hover:text-blue-600 transition-colors">
          Help
        </a>
      </div>
    </div>
  );
};

export default AuthFooter;