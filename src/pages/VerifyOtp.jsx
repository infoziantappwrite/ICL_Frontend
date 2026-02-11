import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authAPI } from '../api/Api';
import { Loader2, AlertCircle } from 'lucide-react';

const VerifyOtp = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email;

  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!email) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Email not found. Please signup again.</p>
      </div>
    );
  }

  const handleVerify = async (e) => {
    e.preventDefault();

    if (otp.length !== 6) {
      setError('Enter valid 6-digit OTP');
      return;
    }

    setIsLoading(true);

    try {
      const response = await authAPI.verifyOtp(email, otp);

      if (response.success) {
        // 🔥 After verification, redirect to login
        navigate('/login');
      } else {
        setError(response.message || 'Invalid OTP');
      }

    } catch (err) {
      setError('Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg">

        <h2 className="text-2xl font-bold text-center mb-4">
          Verify Email
        </h2>

        <p className="text-sm text-gray-600 text-center mb-6">
          Enter OTP sent to <strong>{email}</strong>
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg mb-4 text-sm flex items-center gap-2">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-4">
          <input
            type="text"
            value={otp}
            onChange={(e) =>
              setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))
            }
            placeholder="Enter 6-digit OTP"
            className="w-full p-3 border rounded-xl text-center text-lg tracking-widest"
          />

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 transition"
          >
            {isLoading ? (
              <Loader2 className="animate-spin mx-auto" />
            ) : (
              "Verify OTP"
            )}
          </button>
        </form>

      </div>
    </div>
  );
};

export default VerifyOtp;
