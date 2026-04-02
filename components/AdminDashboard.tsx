
import React, { useState, useEffect, useMemo } from 'react';
import { User, AttendanceRecord, QRCodeData, RotationLog } from '../types';
import { generateWeeklyQR, getNextRotationSchedule, getActiveQR } from '../services/qrService';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area
} from 'recharts';
import { 
  Users, Clock, CheckCircle, AlertCircle, TrendingUp, 
  Calendar, Shield, RefreshCw, Filter, Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AdminDashboardProps {
  users: User[];
  attendanceRecords: AttendanceRecord[];
  onApproveUser: (userId: string) => void;
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const AdminDashboard: React.FC<AdminDashboardProps> = ({ users, attendanceRecords, onApproveUser }) => {
  const [filter, setFilter] = useState("all");
  const [activeQR, setActiveQR] = useState<QRCodeData | null>(getActiveQR());
  const [isRotating, setIsRotating] = useState(false);
  const [rotationLogs, setRotationLogs] = useState<RotationLog[]>([
    { timestamp: new Date().toISOString(), event: 'System: Automated rotation scheduler active', status: 'system' }
  ]);

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayRecords = attendanceRecords.filter(r => r.check_in_time.startsWith(today));
    
    const onTime = todayRecords.filter(r => !r.is_late).length;
    const late = todayRecords.filter(r => r.is_late).length;
    const manual = todayRecords.filter(r => r.check_in_method === 'manual').length;
    const totalEmployees = users.filter(u => u.role === 'employee' && u.is_approved).length;
    const missing = Math.max(0, totalEmployees - todayRecords.length);

    return { onTime, late, manual, missing, total: todayRecords.length, totalEmployees };
  }, [attendanceRecords, users]);

  const chartData = useMemo(() => {
    return [
      { name: 'On Time', value: stats.onTime, color: '#10b981' },
      { name: 'Late', value: stats.late, color: '#f59e0b' },
      { name: 'Missing', value: stats.missing, color: '#ef4444' },
    ];
  }, [stats]);

  const weeklyData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    return days.map(day => ({
      name: day,
      attendance: Math.floor(Math.random() * 10) + 15,
      late: Math.floor(Math.random() * 5),
    }));
  }, []);

  const deptData = useMemo(() => {
    const depts = ['Creative', 'Marketing', 'Operations', 'HR'];
    return depts.map(dept => {
      const deptUsers = users.filter(u => u.department === dept);
      const deptRecords = attendanceRecords.filter(r => 
        deptUsers.some(u => u.id === r.user_id)
      );
      return {
        name: dept,
        count: deptRecords.length,
        total: deptUsers.length
      };
    });
  }, [users, attendanceRecords]);

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

  const qrImageUrl = activeQR 
    ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(activeQR.qr_data)}` 
    : '';

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto py-6 px-4">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-200">
              <Shield size={24} strokeWidth={2.5} />
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">
              HR Control <span className="text-indigo-600">Central</span>
            </h2>
          </div>
          <p className="text-slate-500 text-sm font-medium ml-12">Enterprise Attendance Intelligence Dashboard</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl border border-slate-100 shadow-sm">
            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Real-time Sync Active</span>
          </div>
          <button className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-indigo-600 transition-all shadow-sm">
            <Download size={20} />
          </button>
        </div>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Present', value: stats.total, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'On Time', value: stats.onTime, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Late Arrivals', value: stats.late, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Missing Staff', value: stats.missing, icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
        ].map((stat, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={stat.label} 
            className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group"
          >
            <div className="flex justify-between items-start">
              <div className={`p-3 ${stat.bg} ${stat.color} rounded-2xl transition-transform group-hover:scale-110`}>
                <stat.icon size={24} />
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                <p className="text-3xl font-black text-slate-900 tracking-tight">{stat.value}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <TrendingUp size={14} className="text-emerald-500" />
              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">+12% from yesterday</span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Charts & Analytics */}
        <div className="lg:col-span-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Attendance Distribution */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest">Daily Distribution</h3>
                <Calendar size={16} className="text-slate-300" />
              </div>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={8}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Department Attendance */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest">Departmental Reach</h3>
                <Filter size={16} className="text-slate-300" />
              </div>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={deptData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                    <Tooltip 
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Weekly Trend Chart */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest">Weekly Attendance Trend</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Historical performance overview</p>
              </div>
              <TrendingUp size={16} className="text-indigo-500" />
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyData}>
                  <defs>
                    <linearGradient id="colorAttendance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="attendance" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorAttendance)" />
                  <Area type="monotone" dataKey="late" stroke="#f59e0b" strokeWidth={3} fill="transparent" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Attendance Feed */}
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden flex flex-col p-8 space-y-6">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest">Live Activity Feed</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Real-time check-in stream</p>
              </div>
              <div className="flex gap-2">
                <div className="h-2 w-2 bg-indigo-500 rounded-full animate-pulse"></div>
                <div className="h-2 w-2 bg-slate-200 rounded-full"></div>
              </div>
            </div>
            
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              <AnimatePresence mode="popLayout">
                {attendanceRecords.map((log, i) => {
                  const user = users.find(u => u.id === log.user_id);
                  return (
                    <motion.div 
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: i * 0.05 }}
                      key={log.id} 
                      className="p-5 bg-slate-50 rounded-3xl flex justify-between items-center border border-slate-100 hover:bg-white hover:shadow-lg hover:border-indigo-100 transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-100 text-indigo-600 flex items-center justify-center font-black rounded-2xl text-lg shadow-inner">
                          {user?.full_name[0] || 'U'}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900">{user?.full_name}</p>
                          <div className="flex items-center gap-2">
                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${log.check_in_method === 'qr_scan' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                              {log.check_in_method.replace('_', ' ')}
                            </span>
                            <span className="text-[9px] text-slate-400 font-bold">{user?.department}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-black text-slate-900">{new Date(log.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        <p className={`text-[9px] font-black uppercase tracking-widest mt-1 ${log.is_late ? 'text-rose-500' : 'text-emerald-500'}`}>
                          {log.is_late ? 'Late Arrival' : 'On Time'}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Right Column: QR & System Controls */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-slate-900 text-white rounded-[2.5rem] p-8 shadow-2xl space-y-8 overflow-hidden relative border border-slate-800">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl"></div>
            
            <div className="flex justify-between items-center relative z-10">
              <div className="space-y-1">
                <h3 className="font-black text-indigo-400 uppercase text-[10px] tracking-widest">Access Infrastructure</h3>
                <p className="text-white text-lg font-black tracking-tight">Active QR Manifest</p>
              </div>
              <div className="p-2 bg-white/5 rounded-xl border border-white/10">
                <RefreshCw size={18} className={`text-indigo-400 ${isRotating ? 'animate-spin' : ''}`} />
              </div>
            </div>

            {activeQR && (
              <div className="flex flex-col items-center gap-8 relative z-10">
                <div className="bg-white p-5 rounded-[2.5rem] shadow-2xl shadow-indigo-500/20 group relative overflow-hidden">
                  {isRotating && (
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] z-20 flex items-center justify-center">
                      <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                  <img src={qrImageUrl} alt="QR" className={`w-48 h-48 rounded-2xl transition-all duration-700 ${isRotating ? 'scale-90 opacity-50 blur-sm' : 'scale-100 opacity-100'}`} />
                </div>
                
                <div className="w-full space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-white/5 rounded-3xl border border-white/10 text-center">
                      <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest mb-1">Rotation Status</p>
                      <p className="text-xs font-black text-emerald-400">ACTIVE</p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-3xl border border-white/10 text-center">
                      <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest mb-1">Expiry Date</p>
                      <p className="text-xs font-black text-indigo-300">{new Date(activeQR.valid_until).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <button 
                    onClick={handleManualRotation}
                    disabled={isRotating}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white py-5 rounded-3xl text-xs font-black uppercase tracking-widest transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3"
                  >
                    <RefreshCw size={16} className={isRotating ? 'animate-spin' : ''} />
                    {isRotating ? 'Rotating Keys...' : 'Force Key Rotation'}
                  </button>
                </div>
              </div>
            )}

            <div className="pt-6 border-t border-white/5 space-y-4">
              <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest">System Audit Trail</h4>
              <div className="space-y-3 h-40 overflow-y-auto text-[10px] font-mono custom-scrollbar pr-2">
                {rotationLogs.map((log, i) => (
                  <div key={i} className="flex gap-3 p-2 bg-white/5 rounded-xl border border-white/5">
                    <span className="text-slate-600 shrink-0">{new Date(log.timestamp).toLocaleTimeString([], { hour12: false })}</span>
                    <span className={log.status === 'success' ? 'text-emerald-400' : 'text-indigo-400'}>{log.event}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .lg\\:col-span-8 .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; }
      `}</style>
    </div>
  );
};

export default AdminDashboard;
