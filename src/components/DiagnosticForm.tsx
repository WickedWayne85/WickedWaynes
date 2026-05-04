import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { OperationType, Vehicle } from '../types';
import { handleFirestoreError } from '../utils/firestore';
import { Activity, Plus, X, Calendar, Clock, Car } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function DiagnosticForm({ 
  vehicles, 
  onComplete 
}: { 
  vehicles: Vehicle[], 
  onComplete: () => void 
}) {
  const [selectedVehicleId, setSelectedVehicleId] = useState(vehicles[0]?.id || '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [odometer, setOdometer] = useState('');
  const [notes, setNotes] = useState('');
  
  const [codeInput, setCodeInput] = useState('');
  const [codes, setCodes] = useState<string[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addCode = () => {
    if (codeInput.trim()) {
      setCodes([...codes, codeInput.trim().toUpperCase()]);
      setCodeInput('');
    }
  };

  const removeCode = (index: number) => {
    setCodes(codes.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || codes.length === 0) return;
    if (!selectedVehicleId) {
      setError('Please select a vehicle first.');
      return;
    }

    setLoading(true);
    setError(null);
    const path = 'diagnostics';
    try {
      await addDoc(collection(db, path), {
        userId: auth.currentUser.uid,
        vehicleId: selectedVehicleId,
        dateDiscovered: Timestamp.fromDate(new Date(date)),
        codes,
        notes,
        odometer: parseInt(odometer) || 0,
        createdAt: serverTimestamp(),
      });
      onComplete();
    } catch (err) {
      console.error(err);
      setError('Failed to log scan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="bg-white p-6 rounded-2xl shadow-xl border border-stone-200 space-y-6"
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 bg-red-600 text-white rounded-lg flex items-center justify-center">
          <Activity size={18} />
        </div>
        <h2 className="text-xl font-semibold tracking-tight">Log OBDII Codes</h2>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl font-medium">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1">
            <Car size={14} /> Vehicle
          </label>
          <select
            value={selectedVehicleId}
            onChange={(e) => setSelectedVehicleId(e.target.value)}
            className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-black outline-none transition-all"
          >
            {vehicles.map(v => (
              <option key={v.id} value={v.id}>{v.year} {v.make} {v.model}{v.subModel ? ` ${v.subModel}` : ''} {v.nickname && `(${v.nickname})`}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1">
            <Calendar size={14} /> Date Discovered
          </label>
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-black outline-none transition-all"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1">
            <Clock size={14} /> Odometer
          </label>
          <input
            type="number"
            placeholder="e.g. 120500"
            value={odometer}
            onChange={(e) => setOdometer(e.target.value)}
            className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-black outline-none transition-all"
          />
        </div>

        <div className="md:col-span-2 space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1">
            <Activity size={14} /> Scan Codes (OBDII)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. P0301"
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCode())}
              className="flex-1 p-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-black outline-none transition-all"
            />
            <button
              type="button"
              onClick={addCode}
              className="p-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg transition-colors"
            >
              <Plus size={20} />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            <AnimatePresence>
              {codes.map((code, i) => (
                <motion.span
                  key={`code-${code}-${i}`}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-red-50 text-red-700 text-sm font-bold rounded-lg border border-red-100"
                >
                  {code}
                  <button type="button" onClick={() => removeCode(i)} className="hover:text-red-900">
                    <X size={14} />
                  </button>
                </motion.span>
              ))}
            </AnimatePresence>
          </div>
        </div>

        <div className="md:col-span-2 space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-stone-500">Diagnostic Notes</label>
          <textarea
            placeholder="Symptoms, freeze frame data, or potential causes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-black outline-none transition-all min-h-[80px]"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || codes.length === 0}
        className="w-full py-4 bg-red-600 text-white font-bold uppercase tracking-widest rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50"
      >
        {loading ? 'Saving Scan...' : 'Log Diagnostic Scan'}
      </button>
    </motion.form>
  );
}
