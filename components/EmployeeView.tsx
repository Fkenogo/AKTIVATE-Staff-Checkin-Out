
import React, { useState, useEffect } from 'react';
import QRScanner from './QRScanner';
import { useAttendance } from '../hooks/useAttendance';
import { COLORS } from '../constants';
import { Notification } from '../types';

const EmployeeView: React.FC = () => {
  const [showScanner, setShowScanner] = useState(false);
  const [showManualForm, setShowManualForm] = useState<'checkin' | 'checkout' | null>(null);
  const [showLateForm, setShowLateForm] = useState(false);
  const [lateReason, setLateReason] = useState("");
  const [reason, setReason] = useState("");
  const { submitCheckIn, submitCheckOut, loading, error, isOnline, checkIfLate } = useAttendance();
  const [checkedIn, setCheckedIn] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  
  const [notifications, setNotifications] = useState<Notification[]>([
    { id: '1', user_id: 'u1', title: 'Check-in Approved', message: 'Your manual check-in for yesterday has been approved by HR.', is_read: false, type: 'success', created_at: new Date().toISOString() },
    { id: '2', user_id: 'u1', title: 'Late Arrival', message: 'You checked in after 08:30 AM today.', is_read: true, type: 'warning', created_at: new Date().toISOString() }
  ]);

  const handleQRScan = async (data: string) => {
    setShowScanner(false);
    const now = new Date();
    const isLate = checkIfLate(now);
    
    if (!checkedIn && isLate) {
      setShowLateForm(true);
      return;
    }

    try {
      if (!checkedIn) {
        await submitCheckIn('qr_scan');
        setCheckedIn(true);
      } else {
        await submitCheckOut('qr_scan');
        setCheckedIn(false);
      }
      alert("Scan success! Record updated.");
    } catch (err) {}
  };

  const handleLateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lateReason.trim().length < 10) {
      alert("Please provide a valid reason for being late (at least 10 chars).");
      return;
    }
    try {
      await submitCheckIn('qr_scan', undefined, lateReason);
      setCheckedIn(true);
      setShowLateForm(false);
      setLateReason("");
      alert("Late check-in recorded.");
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
        await submitCheckIn('manual', trimmedReason);
        alert("Manual check-in request sent for HR approval.");
        setCheckedIn(true); 
      } else {
        await submitCheckOut('manual', trimmedReason);
        alert("Manual check-out request sent for HR approval.");
        setCheckedIn(false);
      }
      setShowManualForm(null);
      setReason("");
    } catch (err) {}
  };

  const toggleNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: !n.is_read } : n));
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="space-y-6 max-w-md mx-auto px-1">
      {/* Header Stats */}
      <div className="flex justify-between items-center py-2">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500'} animate-pulse`}></div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            {isOnline ? 'AKTIVATE Cloud Online' : 'Offline Mode'}
          </span>
        </div>
        <button 
          onClick={() => setShowNotifications(!showNotifications)}
          className="relative p-2.5 bg-white border border-slate-100 rounded-xl shadow-sm hover:text-indigo-600 transition-all"
        >
          <i className="fas fa-bell text-lg"></i>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-white font-black">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Notifications */}
      {showNotifications && (
        <div className="bg-white border border-slate-100 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-4 z-50 relative">
          <div className="p-5 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
            <h4 className="font-black text-slate-800 text-xs uppercase tracking-widest">Alerts ({unreadCount})</h4>
            <button className="text-[10px] text-indigo-600 font-black uppercase hover:underline" onClick={markAllRead}>Mark all read</button>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-10 text-center text-slate-300 text-sm font-medium">No alerts today</div>
            ) : (
              notifications.map(n => (
                <div 
                  key={n.id} 
                  onClick={() => toggleNotificationRead(n.id)}
                  className={`p-5 border-b border-slate-50 flex gap-4 transition-colors cursor-pointer group ${n.is_read ? 'bg-white' : 'bg-indigo-50/20'}`}
                >
                  <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${n.type === 'success' ? 'bg-emerald-500' : n.type === 'warning' ? 'bg-amber-500' : 'bg-indigo-500'}`}></div>
                  <div className="space-y-1">
                    <p className={`text-sm ${n.is_read ? 'font-semibold text-slate-600' : 'font-black text-slate-900'}`}>{n.title}</p>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">{n.message}</p>
                  </div>
                  <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                    <i className={`fas ${n.is_read ? 'fa-envelope-open' : 'fa-envelope'} text-slate-300`}></i>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Main Actions */}
      <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-50 space-y-6">
        <div className="text-center space-y-1">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Work Status</p>
          <div className={`text-2xl font-black tracking-tight ${checkedIn ? 'text-emerald-600' : 'text-slate-300'}`}>
            {checkedIn ? 'ON THE CLOCK' : 'OFF DUTY'}
          </div>
        </div>

        <button 
          onClick={() => setShowScanner(true)}
          className={`w-full ${checkedIn ? 'bg-rose-500' : 'bg-indigo-600'} text-white py-6 rounded-3xl font-black text-xl shadow-lg flex flex-col items-center justify-center gap-2 active:scale-95 transition-all`}
          disabled={loading}
        >
          {loading ? (
            <i className="fas fa-circle-notch animate-spin text-2xl"></i>
          ) : (
            <>
              <i className={`fas ${checkedIn ? 'fa-sign-out-alt' : 'fa-qrcode'} text-3xl`}></i>
              <span className="text-sm uppercase tracking-widest">{checkedIn ? 'Check Out' : 'Check In'}</span>
            </>
          )}
        </button>

        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={() => setShowManualForm(checkedIn ? 'checkout' : 'checkin')}
            className="bg-slate-50 border border-slate-200 text-slate-600 py-4 rounded-2xl font-bold flex flex-col items-center gap-1 hover:bg-white transition-all text-xs uppercase tracking-wider"
          >
            <i className={`fas fa-keyboard text-lg mb-1 ${checkedIn ? 'text-rose-400' : 'text-indigo-400'}`}></i>
            Manual {checkedIn ? 'Out' : 'In'}
          </button>
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Efficiency</p>
            <p className="text-lg font-black text-slate-800">92%</p>
          </div>
        </div>
      </div>

      {/* Lateness Modal */}
      {showLateForm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-sm p-8 rounded-[2.5rem] shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl mx-auto flex items-center justify-center text-2xl">
                <i className="fas fa-clock"></i>
              </div>
              <h3 className="font-black text-slate-900 text-lg uppercase">Late Arrival</h3>
              <p className="text-xs text-slate-500 font-medium">It's after 08:30 AM. Please provide a reason for the delay.</p>
            </div>
            <form onSubmit={handleLateSubmit} className="space-y-4">
              <textarea
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-rose-500 focus:outline-none min-h-[100px] resize-none"
                placeholder="Reason for being late..."
                value={lateReason}
                onChange={(e) => setLateReason(e.target.value)}
              />
              <button 
                type="submit"
                className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase text-sm tracking-widest shadow-lg"
              >
                Submit & Clock In
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Manual Request Modal */}
      {showManualForm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-sm p-8 rounded-[2.5rem] shadow-2xl space-y-6">
            <div className="flex justify-between items-start">
              <h3 className="font-black text-slate-900 text-lg uppercase">{showManualForm === 'checkin' ? 'Manual Check-In' : 'Manual Check-Out'}</h3>
              <button onClick={() => setShowManualForm(null)} className="text-slate-300 hover:text-slate-600"><i className="fas fa-times text-xl"></i></button>
            </div>
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <textarea
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none min-h-[120px] resize-none"
                placeholder="Detailed reason (Min 20 characters)..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
              <button 
                type="submit"
                disabled={reason.trim().length < 20}
                className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase text-sm tracking-widest shadow-lg disabled:opacity-50"
              >
                Request Approval
              </button>
            </form>
          </div>
        </div>
      )}

      {showScanner && <QRScanner onScan={handleQRScan} onClose={() => setShowScanner(false)} />}
    </div>
  );
};

export default EmployeeView;
