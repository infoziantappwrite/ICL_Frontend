const AuthLogo = () => {
  return (
    <div className="flex items-center space-x-3">
      <div className="w-12 h-12 bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/40">
        <span className="text-white font-bold text-2xl">I</span>
      </div>
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-cyan-600 bg-clip-text text-transparent">ICL</h1>
        <p className="text-sm text-blue-600 font-medium">Innovation & Career Launch</p>
      </div>
    </div>
  );
};

export default AuthLogo;
