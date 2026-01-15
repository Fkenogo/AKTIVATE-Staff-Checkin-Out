
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import EmployeeView from './components/EmployeeView';
import AdminDashboard from './components/AdminDashboard';
import PendingApproval from './components/PendingApproval';
import { User } from './types';
import { getActiveQR, generateWeeklyQR, getNextRotationSchedule } from './services/qrService';

const USER_STORAGE_KEY = 'aktivate_users_v2';

const INITIAL_USERS: User[] = [
  {
    id: 'hr-1',
    email: 'admin@aktivate.bi',
    full_name: 'Diane Uwimana',
    role: 'hr',
    is_active: true,
    is_approved: true,
    password: 'password',
    department: 'Human Resources'
  },
  {
    id: 'emp-1',
    email: 'creative@aktivate.bi',
    full_name: 'Fabrice Nkurunziza',
    role: 'employee',
    is_active: true,
    is_approved: true,
    password: 'password',
    department: 'Creative'
  },
  {
    id: 'emp-2',
    email: 'marketing@aktivate.bi',
    full_name: 'Alice Mugisha',
    role: 'employee',
    is_active: true,
    is_approved: true,
    password: 'password',
    department: 'Marketing'
  },
  {
    id: 'emp-3',
    email: 'ops@aktivate.bi',
    full_name: 'Jean-Paul Habimana',
    role: 'employee',
    is_active: true,
    is_approved: false,
    password: 'password',
    department: 'Operations'
  }
];

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [usersList, setUsersList] = useState<User[]>(() => {
    const saved = localStorage.getItem(USER_STORAGE_KEY);
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });
  
  const [isSignUp, setIsSignUp] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    dept: 'Creative'
  });

  useEffect(() => {
    const initQR = async () => {
      if (!getActiveQR()) {
        await generateWeeklyQR(getNextRotationSchedule());
      }
    };
    initQR();
  }, []);

  useEffect(() => {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(usersList));
  }, [usersList]);

  useEffect(() => {
    if (user && !user.is_approved) {
      const updated = usersList.find(u => u.id === user.id);
      if (updated?.is_approved) {
        setUser(updated);
      }
    }
  }, [usersList, user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setAuthError(null);
  };

  const performLogin = (email: string, pass: string) => {
    const foundUser = usersList.find(u => u.email === email && u.password === pass);
    if (foundUser) {
      setUser(foundUser);
    } else {
      setAuthError("Invalid credentials.");
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    performLogin(formData.email, formData.password);
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (usersList.some(u => u.email === formData.email)) {
      setAuthError("This email is already registered.");
      return;
    }

    const newUser: User = {
      id: `user-${Date.now()}`,
      email: formData.email,
      password: formData.password,
      full_name: formData.fullName,
      role: 'employee',
      department: formData.dept,
      is_active: true,
      is_approved: false
    };

    setUsersList(prev => [...prev, newUser]);
    setUser(newUser);
    setIsSignUp(false);
  };

  const handleApproveUser = (userId: string) => {
    setUsersList(prev => prev.map(u => u.id === userId ? { ...u, is_approved: true } : u));
  };

  const handleLogout = () => {
    setUser(null);
    setFormData({ email: '', password: '', fullName: '', dept: 'Creative' });
    setAuthError(null);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-indigo-700 flex items-center justify-center p-6 flex-col gap-8">
        <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 space-y-6 animate-in fade-in zoom-in-95 duration-500">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl mx-auto flex items-center justify-center text-white text-3xl shadow-lg">
              <i className="fas fa-bolt"></i>
            </div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight uppercase">AKTIVATE</h1>
            <p className="text-slate-500 text-sm font-medium">Bujumbura HQ Office Attendance</p>
          </div>

          <form onSubmit={isSignUp ? handleSignUp : handleLogin} className="space-y-4">
            {isSignUp && (
              <>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Full Name</label>
                  <input required name="fullName" type="text" className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Jean Marie N." value={formData.fullName} onChange={handleInputChange} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Department</label>
                  <select name="dept" className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500" value={formData.dept} onChange={handleInputChange}>
                    <option>Creative</option>
                    <option>Marketing</option>
                    <option>Operations</option>
                    <option>Administration</option>
                  </select>
                </div>
              </>
            )}
            
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Work Email</label>
              <input required name="email" type="email" className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="name@aktivate.bi" value={formData.email} onChange={handleInputChange} />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Password</label>
              <input required name="password" type="password" className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="••••••••" value={formData.password} onChange={handleInputChange} />
            </div>

            {authError && <p className="text-xs text-rose-500 font-bold text-center">{authError}</p>}

            <button type="submit" className="w-full bg-slate-900 hover:bg-black text-white py-4 rounded-2xl font-bold text-lg shadow-xl active:scale-[0.98] transition-all">
              {isSignUp ? 'Apply for Account' : 'Sign In'}
            </button>
          </form>

          <div className="pt-2 text-center">
            <button onClick={() => { setIsSignUp(!isSignUp); setAuthError(null); }} className="text-xs font-black text-indigo-600 uppercase tracking-widest hover:underline">
              {isSignUp ? 'Already registered? Sign In' : "New staff member? Sign Up"}
            </button>
          </div>
        </div>

        {/* Testing Quick Login Panel */}
        <div className="w-full max-w-sm bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-[2rem] space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <i className="fas fa-flask text-white/60 text-xs"></i>
            <h3 className="text-[10px] font-black text-white/60 uppercase tracking-widest">Testing Quick Login</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => performLogin('admin@aktivate.bi', 'password')}
              className="bg-white/10 hover:bg-white/20 text-white text-[10px] font-black py-3 px-4 rounded-xl border border-white/10 transition-all text-left flex flex-col gap-1"
            >
              <span>HR ADMIN</span>
              <span className="opacity-50 font-medium">D. Uwimana</span>
            </button>
            <button 
              onClick={() => performLogin('creative@aktivate.bi', 'password')}
              className="bg-white/10 hover:bg-white/20 text-white text-[10px] font-black py-3 px-4 rounded-xl border border-white/10 transition-all text-left flex flex-col gap-1"
            >
              <span>CREATIVE STAFF</span>
              <span className="opacity-50 font-medium">F. Nkurunziza</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Layout user={user} onLogout={handleLogout}>
      {user.role === 'hr' || user.role === 'manager' ? (
        <AdminDashboard users={usersList} onApproveUser={handleApproveUser} />
      ) : user.is_approved ? (
        <EmployeeView />
      ) : (
        <PendingApproval />
      )}
    </Layout>
  );
};

export default App;
