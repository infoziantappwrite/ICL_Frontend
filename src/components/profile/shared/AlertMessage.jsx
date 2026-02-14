import { CheckCircle, AlertCircle } from 'lucide-react';

const AlertMessage = ({ type = "success", message }) => {
  if (!message) return null;

  const isSuccess = type === "success";
  const bgColor = isSuccess ? "bg-green-50" : "bg-red-50";
  const borderColor = isSuccess ? "border-green-200" : "border-red-200";
  const textColor = isSuccess ? "text-green-800" : "text-red-800";
  const iconColor = isSuccess ? "text-green-600" : "text-red-600";
  const Icon = isSuccess ? CheckCircle : AlertCircle;

  return (
    <div className={`mb-6 p-4 ${bgColor} border ${borderColor} rounded-lg flex items-center gap-3`}>
      <Icon className={`w-5 h-5 ${iconColor}`} />
      <p className={textColor}>{message}</p>
    </div>
  );
};

export default AlertMessage;