
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import EmployeeView from './components/EmployeeView';
import AdminDashboard from './components/AdminDashboard';
import PendingApproval from './components/PendingApproval';
import { User, UserRole } from './types';

const USER_STORAGE_KEY = 'aktivate_users_v2';

const INITIAL_USERS: User[] = [
  {
    id: 'hr-1',
    email: 'admin@aktivate.bi',
    full_name: 'HR Manager',
    role: 'hr',
    is_active: true,
    is_approved: true,
    password: 'password',
    department: 'Human Resources'
  },
  {
    id: 'emp-1',
    email: 'staff@aktivate.bi',
    full_name: 'Creative Designer',
    role: 'employee',
    is_active: true,
    is_approved: true,
    password: 'password',
    department: 'Creative'
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

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const foundUser = usersList.find(u => u.email === formData.email && u.password === formData.password);
    if (foundUser) {
      setUser(foundUser);
    } else {
      setAuthError("Invalid credentials. Try: admin@aktivate.bi / password");
    }
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
      <div className="min-h-screen bg-indigo-700 flex items-center justify-center p-6">
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
