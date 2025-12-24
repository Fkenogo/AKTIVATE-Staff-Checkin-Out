
import React, { useState, useEffect } from 'react';
import { User, AttendanceRecord } from '../types';
import { generateWeeklyQR, getNextRotationSchedule } from '../services/qrService';

interface AdminDashboardProps {
  users: User[];
  onApproveUser: (userId: string) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ users, onApproveUser }) => {
  const [filter, setFilter] = useState("");
  const [currentQR, setCurrentQR] = useState<string | null>(null);
  const [nextRotation, setNextRotation] = useState<Date>(getNextRotationSchedule());
  
  const [roster, setRoster] = useState<User[]>([]);

  const [logs, setLogs] = useState<AttendanceRecord[]>([
    { id: 'r1', user_id: '1', check_in_time: '2024-05-20T08:15:00Z', check_in_method: 'qr_scan', is_late: false, status: 'approved', location_gps: { lat: -3.38, lng: 29.36 } },
    { id: 'r2', user_id: '2', check_in_time: '2024-05-20T08:45:00Z', check_in_method: 'qr_scan', is_late: true, late_reason: 'Heavy traffic on Boulevard de l\'Uprona', status: 'approved', location_gps: { lat: -3.38, lng: 29.36 } },
    { id: 'r3', user_id: '3', check_in_time: '2024-05-20T08:10:00Z', check_in_method: 'manual', is_late: false, status: 'pending', manual_reason: 'Scanner camera focused blurry', location_gps: { lat: -3.38, lng: 29.36 } },
    { id: 'r4', user_id: 'emp-1', check_in_time: '2024-05-20T08:12:00Z', check_out_time: '2024-05-20T17:05:00Z', check_in_method: 'qr_scan', check_out_method: 'manual', is_late: false, status: 'approved', checkout_status: 'pending', manual_checkout_reason: 'Emergency home repair needed', location_gps: { lat: -3.38, lng: 29.36 } },
  ]);

  const pendingUsers = users.filter(u => !u.is_approved);

  useEffect(() => {
    setRoster(users.filter(u => u.is_approved).slice(0, 3));
  }, [users]);

  const handleCycleQR = () => {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 7);
    setCurrentQR(generateWeeklyQR(expiry));
    setNextRotation(getNextRotationSchedule());
    alert("QR rotated.");
  };

  const handleLogApproval = (logId: string, type: 'checkin' | 'checkout', action: 'approved' | 'rejected') => {
    setLogs(prev => prev.map(l => {
      if (l.id === logId) {
        if (type === 'checkin') return { ...l, status: action };
        return { ...l, checkout_status: action };
      }
      return l;
    }));
  };

  const stats = [
    { label: 'Present Now', value: roster.length.toString(), icon: 'fa-user-check', color: 'text-emerald-600' },
    { label: 'Pending Users', value: pendingUsers.length.toString(), icon: 'fa-user-plus', color: 'text-indigo-600' },
    { label: 'Manual Flags', value: logs.filter(l => l.status === 'pending' || l.checkout_status === 'pending').length.toString(), icon: 'fa-flag', color: 'text-rose-600' },
  ];

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto py-6 px-4">
      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-slate-900">HR CONTROL <span className="text-indigo-600">CENTRAL</span></h2>
          <p className="text-slate-500 text-sm font-medium">Managing 5 staff • Bujumbura HQ</p>
        </div>
        <button onClick={handleCycleQR} className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-3 shadow-lg">
          <i className="fas fa-sync-alt"></i> Rotate Office QR
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-6">
            <div className={`p-4 rounded-2xl bg-slate-50 ${stat.color}`}><i className={`fas ${stat.icon} text-xl`}></i></div>
            <div>
              <span className="block text-2xl font-black text-slate-900">{stat.value}</span>
              <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-widest">{stat.label}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* User Approval Panel */}
        <div className="lg:col-span-4 bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-6">
          <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest">User Registration Approval</h3>
          <div className="space-y-4">
            {pendingUsers.length === 0 ? (
              <p className="text-center text-slate-300 py-8 text-sm font-medium italic">No pending registrations</p>
            ) : (
              pendingUsers.map(user => (
                <div key={user.id} className="p-4 bg-slate-50 rounded-2xl space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">{user.full_name[0]}</div>
                    <div>
                      <p className="text-sm font-black text-slate-800">{user.full_name}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{user.department}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => onApproveUser(user.id)}
                    className="w-full bg-indigo-600 text-white py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-colors"
                  >
                    Verify & Approve
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Access Log */}
        <div className="lg:col-span-8 bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex justify-between items-center">
            <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest">Verification & Access Log</h3>
            <input 
              type="text" 
              placeholder="Filter log..." 
              className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 text-[10px] text-slate-400 font-black uppercase tracking-widest border-b border-slate-50">
                  <th className="px-8 py-4">Staff Member</th>
                  <th className="px-8 py-4">Session Detail</th>
                  <th className="px-8 py-4">Status & Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {logs.map((log) => {
                  const user = users.find(u => u.id === log.user_id);
                  const inPending = log.status === 'pending';
                  const outPending = log.checkout_status === 'pending';
                  
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/20 transition-all">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-slate-400 text-xs">{user?.full_name[0]}</div>
                          <div>
                            <p className="text-sm font-black text-slate-800">{user?.full_name}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">{user?.department}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 space-y-2">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-black text-indigo-500 uppercase">IN:</span>
                          <span className="text-xs font-bold text-slate-600">{new Date(log.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          <span className={`text-[9px] px-2 py-0.5 rounded font-black uppercase ${log.check_in_method === 'qr_scan' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>{log.check_in_method}</span>
                        </div>
                        {log.check_out_time && (
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black text-rose-500 uppercase">OUT:</span>
                            <span className="text-xs font-bold text-slate-600">{new Date(log.check_out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            <span className={`text-[9px] px-2 py-0.5 rounded font-black uppercase ${log.check_out_method === 'qr_scan' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{log.check_out_method}</span>
                          </div>
                        )}
                        {log.is_late && <p className="text-[10px] text-rose-400 font-bold italic">"Late: {log.late_reason}"</p>}
                      </td>
                      <td className="px-8 py-6">
                        {(inPending || outPending) ? (
                          <div className="space-y-2">
                            <p className="text-[10px] text-slate-500 italic max-w-[150px] truncate">"{log.manual_reason || log.manual_checkout_reason}"</p>
                            <div className="flex gap-2">
                              <button onClick={() => handleLogApproval(log.id, inPending ? 'checkin' : 'checkout', 'approved')} className="bg-emerald-500 text-white text-[9px] font-black uppercase px-3 py-1.5 rounded-lg shadow-sm">Accept</button>
                              <button onClick={() => handleLogApproval(log.id, inPending ? 'checkin' : 'checkout', 'rejected')} className="bg-white border border-slate-200 text-rose-500 text-[9px] font-black uppercase px-3 py-1.5 rounded-lg">Deny</button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                            <span className="text-[10px] text-emerald-600 font-black uppercase tracking-widest">Verified</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
