import React, { useState } from 'react';
import { useSalesStore } from '../../store/useSalesStore';
import { Lock, Mail, ShieldAlert, ArrowRight, CheckCircle2 } from 'lucide-react';

interface AdminLoginFormProps {
  onSuccess?: () => void;
}

export const AdminLoginForm: React.FC<AdminLoginFormProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { loginAdmin } = useSalesStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const success = loginAdmin(email, password);
    if (success) {
      if (onSuccess) onSuccess();
    } else {
      setError('Invalid Admin Credentials. Please check your Email ID and Password.');
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 p-6 sm:p-8 bg-white rounded-3xl border border-slate-200 shadow-xl space-y-6">
      
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 to-emerald-600 flex items-center justify-center text-white mx-auto shadow-md">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Admin Portal Access</h2>
        <p className="text-xs text-slate-500 max-w-xs mx-auto">
          Sign in to manage sales report uploads, data ingestion, and audit batch history.
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start space-x-2.5">
          <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Email Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 block">Admin Email / ID</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Mail className="w-4 h-4" />
            </div>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="manannegi17@gmail.com"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all font-medium placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Password Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 block">Password</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all font-medium placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 active:scale-98 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-2"
        >
          <span>Sign In to Admin Portal</span>
          <ArrowRight className="w-4 h-4" />
        </button>

      </form>

      {/* Info Badge */}
      <div className="pt-2 border-t border-slate-100 text-center">
        <div className="inline-flex items-center space-x-1 text-[11px] text-slate-500">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Restricted for authorized data management</span>
        </div>
      </div>

    </div>
  );
};
