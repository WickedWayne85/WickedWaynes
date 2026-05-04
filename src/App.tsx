/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { onSnapshot, collection, query, where, orderBy } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db, signInWithGoogle, logout } from './firebase';
import { Repair, Vehicle, Diagnostic, OperationType } from './types';
import { handleFirestoreError } from './utils/firestore';
import RepairForm from './components/RepairForm';
import RepairCard from './components/RepairCard';
import VehicleForm from './components/VehicleForm';
import DiagnosticForm from './components/DiagnosticForm';
import DiagnosticCard from './components/DiagnosticCard';
import { Wrench, LogOut, Plus, X, Search, LayoutGrid, Car, Activity, ChevronRight, Hash } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type Tab = 'repairs' | 'diagnostics' | 'vehicles';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([]);
  
  const [activeTab, setActiveTab] = useState<Tab>('repairs');
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<'repair' | 'diagnostic' | 'vehicle'>('repair');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Data Fetching
  useEffect(() => {
    if (!user) {
      setRepairs([]);
      setVehicles([]);
      setDiagnostics([]);
      return;
    }

    const unsubRepairs = onSnapshot(
      query(collection(db, 'repairs'), where('userId', '==', user.uid), orderBy('date', 'desc')),
      (s) => setRepairs(s.docs.map(d => ({ id: d.id, ...d.data() }) as Repair)),
      (e) => handleFirestoreError(e, OperationType.GET, 'repairs')
    );

    const unsubVehicles = onSnapshot(
      query(collection(db, 'vehicles'), where('userId', '==', user.uid), orderBy('year', 'desc')),
      (s) => setVehicles(s.docs.map(d => ({ id: d.id, ...d.data() }) as Vehicle)),
      (e) => handleFirestoreError(e, OperationType.GET, 'vehicles')
    );

    const unsubDiagnostics = onSnapshot(
      query(collection(db, 'diagnostics'), where('userId', '==', user.uid), orderBy('dateDiscovered', 'desc')),
      (s) => setDiagnostics(s.docs.map(d => ({ id: d.id, ...d.data() }) as Diagnostic)),
      (e) => handleFirestoreError(e, OperationType.GET, 'diagnostics')
    );

    return () => {
      unsubRepairs();
      unsubVehicles();
      unsubDiagnostics();
    };
  }, [user]);

  const filteredRepairs = repairs.filter(r => 
    r.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.partNumbers.some(p => p.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredDiagnostics = diagnostics.filter(d => 
    d.codes.some(c => c.toLowerCase().includes(searchTerm.toLowerCase())) ||
    d.notes?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredVehicles = vehicles.filter(v => 
    v.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.year.toString().includes(searchTerm) ||
    v.nickname?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center font-sans">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
          <Wrench className="text-stone-400" size={32} />
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6 font-sans">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-stone-200 text-center">
          <div className="w-20 h-20 bg-black rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-stone-200">
            <Wrench className="text-white" size={40} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-stone-900 mb-2">Repair Tracker</h1>
          <p className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-6">Pocket Companion</p>
          <p className="text-stone-500 mb-8 leading-relaxed">Everything you need to maintain your personal garage. Maintenance, OBDII scans, and tools.</p>
          <button onClick={signInWithGoogle} className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-black text-white rounded-2xl font-bold hover:bg-stone-800 transition-all shadow-lg">
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5 rounded-full" />
            Continue with Google
          </button>
        </motion.div>
      </div>
    );
  }

  const openForm = (type: 'repair' | 'diagnostic' | 'vehicle') => {
    setFormType(type);
    setShowForm(true);
  };

  return (
    <div className="min-h-screen bg-stone-50 font-sans text-stone-900 selection:bg-stone-200">
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-stone-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-white shadow-soft">
              <Wrench size={20} />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight leading-none">Repair Tracker</h1>
              <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Pocket Companion</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center bg-stone-100 rounded-full px-4 py-2 border border-stone-200">
              <Search className="text-stone-400 mr-2" size={16} />
              <input 
                type="text" 
                placeholder="Search garage..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent border-none outline-none text-sm w-48 lg:w-64"
              />
            </div>
            <div className="flex items-center gap-3 pl-4 border-l border-stone-200">
              <img src={user.photoURL || ''} alt="User" className="w-8 h-8 rounded-full border border-stone-200" />
              <button onClick={logout} className="p-2 text-stone-500 hover:text-red-600 transition-colors bg-stone-50 rounded-lg">
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Sidebar Navigation */}
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-white border border-stone-200 rounded-3xl p-3 shadow-sm flex flex-col gap-1">
              <button 
                onClick={() => setActiveTab('repairs')}
                className={`flex items-center justify-between p-4 rounded-2xl transition-all ${activeTab === 'repairs' ? 'bg-black text-white' : 'hover:bg-stone-50 text-stone-600'}`}
              >
                <div className="flex items-center gap-3 font-semibold">
                  <Wrench size={18} /> Repairs
                </div>
                {activeTab === 'repairs' && <ChevronRight size={16} />}
              </button>
              <button 
                onClick={() => setActiveTab('diagnostics')}
                className={`flex items-center justify-between p-4 rounded-2xl transition-all ${activeTab === 'diagnostics' ? 'bg-red-600 text-white' : 'hover:bg-red-50 text-red-600'}`}
              >
                <div className="flex items-center gap-3 font-semibold">
                  <Activity size={18} /> Diagnostics
                </div>
                {activeTab === 'diagnostics' && <ChevronRight size={16} />}
              </button>
              <button 
                onClick={() => setActiveTab('vehicles')}
                className={`flex items-center justify-between p-4 rounded-2xl transition-all ${activeTab === 'vehicles' ? 'bg-stone-900 text-white' : 'hover:bg-stone-50 text-stone-600'}`}
              >
                <div className="flex items-center gap-3 font-semibold">
                  <Car size={18} /> Family Vehicles
                </div>
                {activeTab === 'vehicles' && <ChevronRight size={16} />}
              </button>
            </div>

            <div className="bg-stone-900 text-white p-6 rounded-3xl shadow-xl overflow-hidden relative">
              <div className="relative z-10">
                <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Personal Records</span>
                <div className="text-3xl font-black mt-1">{repairs.length + diagnostics.length}</div>
                <div className="mt-4 flex items-center gap-4 text-sm font-medium text-stone-300">
                  <div className="flex items-center gap-1"><Hash size={12}/> {repairs.reduce((a,r)=>a+(r.odometer||0),0).toLocaleString()}mi total logs</div>
                </div>
              </div>
              <Activity className="absolute -bottom-6 -right-6 text-white/5" size={140} />
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-9 space-y-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-3xl font-black uppercase tracking-tight">
                {activeTab === 'repairs' && 'Maintenance Log'}
                {activeTab === 'diagnostics' && 'OBDII Scans'}
                {activeTab === 'vehicles' && 'My Vehicles'}
              </h2>
              {activeTab === 'repairs' && (
                <button onClick={() => openForm('repair')} className="flex items-center gap-2 px-6 py-2.5 bg-black text-white rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-stone-800 transition-all shadow-md">
                  <Plus size={16} /> New Repair
                </button>
              )}
              {activeTab === 'diagnostics' && (
                <button onClick={() => openForm('diagnostic')} className="flex items-center gap-2 px-6 py-2.5 bg-red-600 text-white rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-red-700 transition-all shadow-md">
                  <Plus size={16} /> New Scan
                </button>
              )}
              {activeTab === 'vehicles' && (
                <button onClick={() => openForm('vehicle')} className="flex items-center gap-2 px-6 py-2.5 bg-stone-900 text-white rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-stone-800 transition-all shadow-md">
                  <Plus size={16} /> Add Vehicle
                </button>
              )}
            </div>

            {activeTab === 'vehicles' && (
              <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                <input
                  type="text"
                  placeholder="Filter vehicles by year, make, or model..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 bg-white border border-stone-200 rounded-3xl shadow-sm focus:ring-2 focus:ring-stone-900 outline-none font-medium transition-all"
                />
              </div>
            )}

            <div className="space-y-6">
              <AnimatePresence mode="popLayout">
                {activeTab === 'repairs' && (
                  <div key="repairs-container" className="space-y-6">
                    {filteredRepairs.length === 0 ? (
                      <motion.div 
                        key="repairs-empty"
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                        className="bg-white border border-dashed border-stone-300 rounded-3xl p-16 text-center"
                      >
                        <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-4 text-stone-300">
                          <LayoutGrid size={32} />
                        </div>
                        <h3 className="text-lg font-bold">No repairs found</h3>
                        <p className="text-stone-500 max-w-xs mx-auto mt-2">
                          {searchTerm ? `No records match "${searchTerm}"` : "Start documenting your garage by adding a repair log."}
                        </p>
                      </motion.div>
                    ) : (
                      filteredRepairs.map((r) => (
                        <RepairCard key={`repair-${r.id}`} repair={r} vehicle={vehicles.find(v => v.id === r.vehicleId)} />
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'diagnostics' && (
                  <div key="diagnostics-container" className="space-y-6">
                    {filteredDiagnostics.length === 0 ? (
                      <motion.div 
                        key="diagnostics-empty"
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                        className="bg-white border border-dashed border-stone-300 rounded-3xl p-16 text-center"
                      >
                        <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-4 text-stone-300">
                          <Activity size={32} />
                        </div>
                        <h3 className="text-lg font-bold">No scans found</h3>
                        <p className="text-stone-500 max-w-xs mx-auto mt-2">
                          {searchTerm ? `No scans match "${searchTerm}"` : "Keep track of OBDII codes and diagnostic scans."}
                        </p>
                      </motion.div>
                    ) : (
                      filteredDiagnostics.map((d) => (
                        <DiagnosticCard key={`diag-${d.id}`} diagnostic={d} vehicle={vehicles.find(v => v.id === d.vehicleId)} />
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'vehicles' && (
                  <div key="vehicles-container" className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredVehicles.length === 0 ? (
                      <motion.div 
                        key="vehicles-empty"
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                        className="md:col-span-2 py-16 text-center text-stone-400 bg-white border border-dashed border-stone-300 rounded-3xl"
                      >
                        <Car className="mx-auto mb-4 opacity-20" size={48} />
                        <h3 className="text-lg font-bold text-stone-900">No vehicles found</h3>
                        <p className="text-stone-500 max-w-xs mx-auto mt-2">
                          {searchTerm ? `No vehicles match "${searchTerm}"` : "Add your personal and family vehicles to get started."}
                        </p>
                      </motion.div>
                    ) : (
                      filteredVehicles.map(v => (
                        <motion.div key={`vehicle-${v.id}`} layout className="bg-white border border-stone-200 p-6 rounded-2xl shadow-sm flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-stone-100 rounded-xl text-stone-600"><Car size={24}/></div>
                            <div>
                              <div className="text-lg font-bold">{v.year} {v.make} {v.model}{v.subModel ? ` ${v.subModel}` : ''}</div>
                              <div className="flex flex-col text-sm text-stone-500 font-medium">
                                {v.nickname && <span>{v.nickname}</span>}
                                {v.vin && <span className="font-mono text-[10px] text-stone-400 mt-0.5">VIN: {v.vin}</span>}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Status</div>
                            <div className="text-green-600 font-bold text-sm">Healthy</div>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>

      {/* Overlays */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowForm(false)} className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm" />
            <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
              {formType === 'repair' && <RepairForm vehicles={vehicles} onComplete={() => setShowForm(false)} />}
              {formType === 'diagnostic' && <DiagnosticForm vehicles={vehicles} onComplete={() => setShowForm(false)} />}
              {formType === 'vehicle' && <VehicleForm onComplete={() => setShowForm(false)} />}
              <button onClick={() => setShowForm(false)} className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-lg hover:bg-stone-100"><X size={20}/></button>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
