
import React, { useState, useEffect, useMemo } from 'react';
import QRScanner from './QRScanner';
import { useAttendance } from '../hooks/useAttendance';
import { COLORS, OFFICE_COORDS } from '../constants';
import { Notification, AttendanceRecord, User } from '../types';

interface EmployeeViewProps {
  user: User;
  attendanceRecords: AttendanceRecord[];
  onAddAttendance: (record: AttendanceRecord) => void;
  onUpdateAttendance: (record: AttendanceRecord) => void;
}

const EmployeeView: React.FC<EmployeeViewProps> = ({ 
  user, 
  attendanceRecords, 
  onAddAttendance, 
  onUpdateAttendance 
}) => {
  const [activeTab, setActiveTab] = useState<'status' | 'history'>('status');
  const [showScanner, setShowScanner] = useState(false);
  const [showManualForm, setShowManualForm] = useState<'checkin' | 'checkout' | null>(null);
  const [showLateForm, setShowLateForm] = useState(false);
  const [lateReason, setLateReason] = useState("");
  const [reason, setReason] = useState("");
  const { submitCheckIn, submitCheckOut, loading, error, isOnline, checkIfLate } = useAttendance();
  const [showNotifications, setShowNotifications] = useState(false);
  const [testMode, setTestMode] = useState(false);

  const currentRecord = useMemo(() => {
    return attendanceRecords.find(r => r.user_id === user.id && !r.check_out_time);
  }, [attendanceRecords, user.id]);

  const checkedIn = !!currentRecord;

  const history = useMemo(() => {
    return attendanceRecords.filter(r => r.user_id === user.id);
  }, [attendanceRecords, user.id]);

  const [notifications, setNotifications] = useState<Notification[]>([
    { id: '1', user_id: user.id, title: 'Check-in Approved', message: 'Your manual check-in for yesterday has been approved by HR.', is_read: false, type: 'success', created_at: new Date().toISOString() },
    { id: '2', user_id: user.id, title: 'Late Arrival', message: 'You checked in after 08:30 AM today.', is_read: true, type: 'warning', created_at: new Date().toISOString() },
    { id: '3', user_id: user.id, title: 'System Update', message: 'Bujumbura HQ office hours updated to 08:00 AM - 05:00 PM.', is_read: false, type: 'info', created_at: new Date().toISOString() }
  ]);

  const isCurrentTimeLate = useMemo(() => checkIfLate(new Date()), [checkIfLate]);

  const handleQRScan = async (data: string) => {
    setShowScanner(false);
    
    if (testMode) {
      if (!checkedIn) {
        const mockRecord: AttendanceRecord = {
          id: `r-${Date.now()}`,
          user_id: user.id,
          check_in_time: new Date().toISOString(),
          check_in_method: 'qr_scan',
          location_gps: { lat: -3.38, lng: 29.36 },
          is_late: checkIfLate(new Date()),
          status: 'approved'
        };
        onAddAttendance(mockRecord);
      } else if (currentRecord) {
        onUpdateAttendance({
          ...currentRecord,
          check_out_time: new Date().toISOString(),
          check_out_method: 'qr_scan'
        });
      }
      return;
    }

    const now = new Date();
    const isLate = checkIfLate(now);
    
    if (!checkedIn && isLate) {
      setShowLateForm(true);
      return;
    }

    try {
      if (!checkedIn) {
        const payload = await submitCheckIn('qr_scan');
        const newRecord: AttendanceRecord = {
          id: `r-${Date.now()}`,
          user_id: user.id,
          ...payload,
          status: payload.status as any
        };
        onAddAttendance(newRecord);
      } else if (currentRecord) {
        const payload = await submitCheckOut('qr_scan');
        onUpdateAttendance({
          ...currentRecord,
          ...payload,
          status: payload.status as any
        });
      }
    } catch (err) {
      alert(err.message || "Attendance failed. Are you at the office?");
    }
  };

  const handleLateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lateReason.trim().length < 10) {
      alert("Please provide a valid reason for being late (at least 10 chars).");
      return;
    }
    try {
      const payload = await submitCheckIn('qr_scan', undefined, lateReason);
      const newRecord: AttendanceRecord = {
        id: `r-${Date.now()}`,
        user_id: user.id,
        ...payload,
        status: payload.status as any
      };
      onAddAttendance(newRecord);
      setShowLateForm(false);
      setLateReason("");
    } catch (err) {}
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedReason = reason.trim();
    if (trimmedReason.length < 20) {
      alert("Please provide a more detailed reason (at least 20 characters).");
      return;
    }

    try {
      if (showManualForm === 'checkin') {
        const payload = await submitCheckIn('manual', trimmedReason, isCurrentTimeLate ? lateReason : undefined);
        const newRecord: AttendanceRecord = {
          id: `r-${Date.now()}`,
          user_id: user.id,
          ...payload,
          status: payload.status as any
        };
        onAddAttendance(newRecord);
      } else if (currentRecord) {
        const payload = await submitCheckOut('manual', trimmedReason); 
        onUpdateAttendance({
          ...currentRecord,
          ...payload,
          status: payload.status as any
        });
      }
      setShowManualForm(null);
      setReason("");
      setLateReason("");
    } catch (err) {}
  };

  const toggleNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, is_read: !n.is_read } : n
    ));
  };

  const unreadCount = useMemo(() => notifications.filter(n => !n.is_read).length, [notifications]);

  // Calendar Logic
  const daysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
  const currentMonth = 4; // May
  const currentYear = 2024;
  const calendarDays = Array.from({ length: daysInMonth(currentMonth, currentYear) }, (_, i) => i + 1);

  const getDayStatus = (day: number) => {
    const dateStr = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    const record = history.find(h => h.check_in_time?.startsWith(dateStr));
    if (!record) return null;
    if (record.check_in_method === 'manual') return 'manual';
    if (record.is_late) return 'late';
    return 'on-time';
  };

  return (
    <div className="space-y-6 max-w-md mx-auto px-1 relative pb-10">
      {/* Top Bar with Alerts */}
      <div className="flex justify-between items-center py-2 px-1">
        <div className="flex flex-col gap-1">
           <div className="flex items-center gap-3">
            <div className="relative">
              <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
              <div className={`absolute -inset-1 rounded-full ${isOnline ? 'bg-emerald-500/30' : 'bg-rose-500/30'} animate-ping`}></div>
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {isOnline ? 'Network Live' : 'Offline Mode'}
            </span>
          </div>
          {/* Test Mode Toggle */}
          <button 
            onClick={() => setTestMode(!testMode)}
            className={`text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${testMode ? 'text-indigo-600' : 'text-slate-300'}`}
          >
            <i className={`fas ${testMode ? 'fa-toggle-on' : 'fa-toggle-off'} text-sm`}></i>
            Bypass GPS
          </button>
        </div>
        
        <button 
          onClick={() => setShowNotifications(!showNotifications)}
          className={`relative w-10 h-10 flex items-center justify-center rounded-2xl transition-all duration-300 ${showNotifications ? 'bg-slate-900 text-white shadow-xl' : 'bg-white border border-slate-100 text-slate-500'}`}
        >
          <i className={`fas ${showNotifications ? 'fa-times' : 'fa-bell'} text-lg`}></i>
          {unreadCount > 0 && !showNotifications && (
            <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-white font-black animate-bounce">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Modern Notification Panel */}
      {showNotifications && (
        <div className="absolute top-16 right-0 left-0 z-[100] bg-white/95 backdrop-blur-xl border border-slate-200/50 rounded-[2.5rem] shadow-2xl shadow-indigo-200/50 overflow-hidden animate-in fade-in slide-in-from-top-6 duration-300 ease-out">
          <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
            <h4 className="font-black text-slate-900 text-[11px] uppercase tracking-[0.2em]">Activity Feed</h4>
            <button 
              onClick={() => setNotifications([])}
              className="text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-rose-500 transition-colors"
            >
              Clear All
            </button>
          </div>
          <div className="max-h-[380px] overflow-y-auto custom-scrollbar p-2">
            {notifications.length === 0 ? (
              <div className="p-12 text-center opacity-40">
                <i className="fas fa-wind text-3xl mb-3"></i>
                <p className="text-[10px] font-bold uppercase tracking-widest">Quiet for now</p>
              </div>
            ) : (
              notifications.map((n, i) => (
                <div 
                  key={n.id} 
                  onClick={() => toggleNotificationRead(n.id)}
                  style={{ animationDelay: `${i * 100}ms` }}
                  className={`p-4 mb-2 rounded-3xl flex gap-4 transition-all cursor-pointer group hover:bg-slate-50 animate-in slide-in-from-right-4 fade-in duration-500 fill-mode-both ${n.is_read ? 'opacity-60' : 'bg-white shadow-sm border border-slate-50'}`}
                >
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${n.type === 'success' ? 'bg-emerald-50 text-emerald-600' : n.type === 'warning' ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'}`}>
                    <i className={`fas ${n.type === 'success' ? 'fa-check-circle' : n.type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle'} text-sm`}></i>
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="flex justify-between items-start">
                      <p className={`text-xs leading-tight ${n.is_read ? 'font-semibold text-slate-600' : 'font-black text-slate-900'}`}>{n.title}</p>
                      <span className="text-[8px] font-black text-slate-300 uppercase shrink-0">Now</span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-relaxed font-medium line-clamp-2">{n.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Segmented Control */}
      <div className="bg-slate-100 p-1.5 rounded-[1.8rem] flex gap-1">
        <button 
          onClick={() => setActiveTab('status')}
          className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'status' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
        >
          Check-In Status
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
        >
          Attendance History
        </button>
      </div>

      {activeTab === 'status' ? (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
          <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-50 flex flex-col items-center gap-6">
            <div className="text-center space-y-1">
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.25em]">Bujumbura HQ</p>
              <h2 className={`text-3xl font-black tracking-tight ${checkedIn ? 'text-emerald-600' : 'text-slate-200'}`}>
                {checkedIn ? 'Shift Active' : 'Standby'}
              </h2>
            </div>

            <button 
              onClick={() => setShowScanner(true)}
              className={`w-full h-56 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 transition-all active:scale-[0.97] shadow-2xl relative overflow-hidden group ${checkedIn ? 'bg-rose-500 text-white' : 'bg-indigo-600 text-white'}`}
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              {testMode && (
                <div className="absolute top-4 right-4 bg-white/20 text-white text-[8px] font-black px-2 py-1 rounded-full border border-white/20 uppercase tracking-widest">Test Mode</div>
              )}
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md mb-2">
                <i className={`fas ${checkedIn ? 'fa-power-off' : 'fa-expand'} text-3xl`}></i>
              </div>
              <div className="text-center">
                <p className="text-xl font-black uppercase tracking-widest">{checkedIn ? 'Clock Out' : 'Scan QR'}</p>
                <p className="text-[10px] opacity-70 font-bold uppercase tracking-widest mt-1">
                  {testMode ? 'GPS Bypassed' : 'GPS Verification Required'}
                </p>
              </div>
            </button>

            <div className="w-full grid grid-cols-2 gap-4">
              <button 
                onClick={() => setShowManualForm(checkedIn ? 'checkout' : 'checkin')}
                className="bg-slate-50 border border-slate-100 py-5 rounded-3xl flex flex-col items-center gap-2 hover:bg-white hover:shadow-lg hover:border-indigo-100 transition-all"
              >
                <i className={`fas fa-fingerprint text-xl ${checkedIn ? 'text-rose-400' : 'text-indigo-400'}`}></i>
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Manual Assist</span>
              </button>
              <div className="bg-slate-900 text-white p-5 rounded-3xl flex flex-col items-center justify-center">
                <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1">Weekly Score</span>
                <span className="text-2xl font-black">4.8</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 bg-white p-8 rounded-[3rem] shadow-xl border border-slate-50 space-y-6">
          <div className="flex justify-between items-center px-1">
            <h3 className="font-black text-slate-900 text-sm uppercase tracking-widest">May 2024</h3>
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
              <div className="w-2 h-2 rounded-full bg-amber-400"></div>
              <div className="w-2 h-2 rounded-full bg-sky-400"></div>
            </div>
          </div>
          
          <div className="grid grid-cols-7 gap-2 text-center">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(d => (
              <span key={d} className="text-[9px] font-black text-slate-300 uppercase mb-2">{d}</span>
            ))}
            {calendarDays.map(day => {
              const status = getDayStatus(day);
              return (
                <div key={day} className="flex flex-col items-center justify-center p-1">
                  <span className={`text-[11px] font-bold mb-1 ${day === new Date().getDate() ? 'text-indigo-600 underline decoration-2 underline-offset-4' : 'text-slate-600'}`}>{day}</span>
                  <div className={`w-3 h-3 rounded-full transition-all duration-500 ${
                    status === 'on-time' ? 'bg-emerald-400 shadow-sm shadow-emerald-200' : 
                    status === 'late' ? 'bg-amber-400 shadow-sm shadow-amber-200' : 
                    status === 'manual' ? 'bg-sky-400 shadow-sm shadow-sky-200' : 
                    'bg-slate-100'
                  }`}></div>
                </div>
              );
            })}
          </div>

          <div className="pt-6 border-t border-slate-50 grid grid-cols-2 gap-y-3">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">On Time</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Late Arrival</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-sky-400"></div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Manual Log</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-100"></div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">No Record</span>
            </div>
          </div>
        </div>
      )}

      {showLateForm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-6">
          <div className="bg-white w-full max-w-sm p-8 rounded-[3rem] shadow-2xl space-y-6">
            <h3 className="font-black text-slate-900 text-lg uppercase text-center">Late Entry Log</h3>
            <textarea
              required
              className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-rose-500 focus:outline-none min-h-[120px] resize-none"
              placeholder="Reason for late arrival..."
              value={lateReason}
              onChange={(e) => setLateReason(e.target.value)}
            />
            <button onClick={handleLateSubmit} className="w-full bg-rose-500 text-white py-5 rounded-3xl font-black uppercase text-xs tracking-widest shadow-xl shadow-rose-200">Submit Arrival</button>
          </div>
        </div>
      )}

      {showManualForm && (
        <div className="fixed inset-0 z-[190] flex items-center justify-center bg-slate-900/30 backdrop-blur-md p-6">
          <div className="bg-white w-full max-w-sm p-8 rounded-[3rem] shadow-2xl space-y-6">
             <div className="flex justify-between items-center">
              <h3 className="font-black text-slate-900 text-sm uppercase">Manual Justification</h3>
              <button onClick={() => setShowManualForm(null)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors"><i className="fas fa-times"></i></button>
            </div>
            <textarea
              required
              className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none min-h-[120px] resize-none"
              placeholder="Detailed explanation (min 20 chars)..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <button 
              onClick={handleManualSubmit} 
              disabled={reason.length < 20}
              className="w-full bg-slate-900 text-white py-5 rounded-3xl font-black uppercase text-xs tracking-widest disabled:opacity-30 shadow-xl"
            >
              Request Manual Auth
            </button>
          </div>
        </div>
      )}

      {showScanner && <QRScanner onScan={handleQRScan} onClose={() => setShowScanner(false)} />}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default EmployeeView;
