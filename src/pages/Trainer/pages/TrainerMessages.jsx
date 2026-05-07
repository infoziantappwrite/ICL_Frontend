import { MessageSquare } from 'lucide-react';
import TrainerDashboardLayout from '../../../components/layout/Trainerdashboardlayout';

const TrainerMessages = () => (
  <TrainerDashboardLayout>
    <div className="max-w-screen-xl mx-auto space-y-5 py-2">
      <div>
        <h1 className="text-xl font-black text-slate-800">Messages</h1>
        <p className="text-xs text-slate-400 mt-0.5">Communicate with your students</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: 'linear-gradient(135deg, #00A9CE, #003399)' }}
        >
          <MessageSquare className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-lg font-black text-slate-800 mb-2">Messaging Coming Soon</h2>
        <p className="text-sm text-slate-500 max-w-sm mx-auto">
          Real-time messaging between trainers and students is under development. You'll be able to answer questions and provide feedback directly here.
        </p>
      </div>
    </div>
  </TrainerDashboardLayout>
);

export default TrainerMessages;