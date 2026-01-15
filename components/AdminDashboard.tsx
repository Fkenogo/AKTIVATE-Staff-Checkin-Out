
import React, { useState, useEffect, useMemo } from 'react';
import { User, AttendanceRecord, QRCodeData, RotationLog } from '../types';
import { generateWeeklyQR, getNextRotationSchedule, getActiveQR } from '../services/qrService';

interface AdminDashboardProps {
  users: User[];
  onApproveUser: (userId: string) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ users, onApproveUser }) => {
  const [filter, setFilter] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeQR, setActiveQR] = useState<QRCodeData | null>(getActiveQR());
  const [isRotating, setIsRotating] = useState(false);
  const [rotationLogs, setRotationLogs] = useState<RotationLog[]>([
    { timestamp: new Date().toISOString(), event: 'System: Automated rotation scheduler active', status: 'system' }
  ]);
  
  const [logs, setLogs] = useState<AttendanceRecord[]>([
    { id: 'r1', user_id: 'hr-1', check_in_time: new Date(new Date().setHours(8, 15)).toISOString(), check_out_time: new Date(new Date().setHours(17, 30)).toISOString(), check_in_method: 'qr_scan', check_out_method: 'qr_scan', is_late: false, status: 'approved', location_gps: { lat: -3.38, lng: 29.36 } },
    { id: 'r2', user_id: 'emp-1', check_in_time: new Date(new Date().setHours(8, 45)).toISOString(), check_in_method: 'qr_scan', is_late: true, late_reason: 'Traffic', status: 'approved', location_gps: { lat: -3.38, lng: 29.36 } },
  ]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  const handleManualRotation = async () => {
    setIsRotating(true);
    try {
      const nextExp = getNextRotationSchedule();
      const newQR = await generateWeeklyQR(nextExp);
      setActiveQR(newQR);
      setRotationLogs(prev => [
        { timestamp: new Date().toISOString(), event: `Manual Rotation: ${newQR.rotation_id}`, status: 'success' },
        ...prev
      ]);
    } catch (err) {
      setRotationLogs(prev => [{ timestamp: new Date().toISOString(), event: `Rotation Error`, status: 'system' }, ...prev]);
    } finally {
      setIsRotating(false);
    }
  };

  const calculateShiftDuration = (start: string, end: string) => {
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    const diff = endTime - startTime;
    return `${Math.floor(diff / 3600000)}h ${Math.floor((diff % 3600000) / 60000)}m`;
  };

  const qrImageUrl = activeQR 
    ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(activeQR.qr_data)}` 
    : '';

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto py-6 px-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">HR CONTROL <span className="text-indigo-600">CENTRAL</span></h2>
          <p className="text-slate-500 text-sm font-medium">Enterprise Access Infrastructure</p>
        </div>
        <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Backend Systems: Connected</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-slate-900 text-white rounded-[2.5rem] p-8 shadow-2xl space-y-6 overflow-hidden relative border border-slate-800">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl"></div>
            
            <div className="flex justify-between items-center relative z-10">
              <h3 className="font-black text-indigo-400 uppercase text-xs tracking-widest">Live QR Manifest</h3>
              <div className="flex items-center gap-2">
                <i className="fas fa-calendar-check text-indigo-500 text-[10px]"></i>
                <span className="text-[9px] font-bold text-indigo-300 uppercase">Weekly Cron Active</span>
              </div>
            </div>

            {activeQR && (
              <div className="flex flex-col items-center gap-6 relative z-10">
                <div className="bg-white p-4 rounded-3xl shadow-2xl shadow-indigo-500/20 group relative overflow-hidden">
                  {isRotating && (
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] z-20 flex items-center justify-center">
                      <i className="fas fa-spinner fa-spin text-white text-3xl"></i>
                    </div>
                  )}
                  <img src={qrImageUrl} alt="QR" className={`w-44 h-44 rounded-xl transition-all duration-700 ${isRotating ? 'scale-90 opacity-50 blur-sm' : 'scale-100 opacity-100'}`} />
                </div>
                
                <div className="w-full space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-white/5 rounded-2xl border border-white/10 text-center">
                      <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest mb-1">Status</p>
                      <p className="text-[11px] font-black text-emerald-400">ACTIVE</p>
                    </div>
                    <div className="p-3 bg-white/5 rounded-2xl border border-white/10 text-center">
                      <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest mb-1">Expires</p>
                      <p className="text-[11px] font-black text-indigo-300">{new Date(activeQR.valid_until).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <button 
                    onClick={handleManualRotation}
                    disabled={isRotating}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3"
                  >
                    <i className={`fas fa-sync-alt ${isRotating ? 'fa-spin' : ''}`}></i>
                    {isRotating ? 'Updating...' : 'Force Key Rotation'}
                  </button>
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-white/5">
              <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">Backend Audit Trail</h4>
              <div className="space-y-2 h-32 overflow-y-auto text-[10px] font-mono">
                {rotationLogs.map((log, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="text-slate-600">[{new Date(log.timestamp).toLocaleTimeString([], { hour12: false })}]</span>
                    <span className={log.status === 'success' ? 'text-emerald-400' : 'text-indigo-400'}>{log.event}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden flex flex-col p-8">
           <div className="flex justify-between items-center mb-6">
              <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest">Attendance Feed</h3>
              <div className="flex gap-2">
                <div className="h-2 w-2 bg-indigo-500 rounded-full"></div>
                <div className="h-2 w-2 bg-slate-200 rounded-full"></div>
              </div>
           </div>
           
           <div className="space-y-4">
              {logs.map(log => (
                <div key={log.id} className="p-5 bg-slate-50 rounded-3xl flex justify-between items-center border border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-100 text-indigo-600 flex items-center justify-center font-black rounded-xl">
                      {users.find(u => u.id === log.user_id)?.full_name[0] || 'U'}
                    </div>
                    <div>
                      <p className="text-sm font-black">{users.find(u => u.id === log.user_id)?.full_name}</p>
                      <p className="text-[10px] text-slate-400 uppercase font-black">{log.check_in_method}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-slate-900">{new Date(log.check_in_time).toLocaleTimeString()}</p>
                    <p className={`text-[9px] font-black uppercase ${log.status === 'approved' ? 'text-emerald-500' : 'text-amber-500'}`}>{log.status}</p>
                  </div>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
