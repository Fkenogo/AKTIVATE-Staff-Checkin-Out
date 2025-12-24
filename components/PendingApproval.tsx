
import React from 'react';

const PendingApproval: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 space-y-6">
      <div className="w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center text-amber-500 animate-pulse">
        <i className="fas fa-user-clock text-4xl"></i>
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Registration Pending</h2>
        <p className="text-slate-500 font-medium">Your AKTIVATE account has been created successfully.</p>
      </div>
      <div className="bg-slate-50 border border-slate-100 p-6 rounded-[2rem] max-w-sm">
        <p className="text-sm text-slate-600 leading-relaxed">
          To maintain security, an HR Manager must verify your identity before you can access the attendance system. 
          Please notify your supervisor if you need immediate access.
        </p>
      </div>
      <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
        System verified • Bujumbura HQ
      </div>
    </div>
  );
};

export default PendingApproval;
