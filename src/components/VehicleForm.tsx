import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { OperationType } from '../types';
import { handleFirestoreError } from '../utils/firestore';
import { Car, Plus, X } from 'lucide-react';
import { motion } from 'motion/react';

export default function VehicleForm({ onComplete }: { onComplete: () => void }) {
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [subModel, setSubModel] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [nickname, setNickname] = useState('');
  const [vin, setVin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    setLoading(true);
    setError(null);
    const path = 'vehicles';
    try {
      await addDoc(collection(db, path), {
        userId: auth.currentUser.uid,
        make,
        model,
        subModel: subModel || null,
        year: Number(year),
        nickname: nickname || null,
        vin: vin || null,
        createdAt: serverTimestamp(),
      });
      onComplete();
    } catch (err) {
      console.error(err);
      setError('Failed to add vehicle. Please check your connection and try again.');
      // handleFirestoreError(err, OperationType.WRITE, path); // removed to prevent crash, replaced with UI error
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-black text-white rounded-lg flex items-center justify-center">
            <Car size={18} />
          </div>
          <h2 className="text-xl font-semibold tracking-tight">Add Vehicle</h2>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl font-medium">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-stone-500">Year</label>
          <input
            required
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-black outline-none transition-all"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-stone-500">Make</label>
          <input
            required
            placeholder="e.g. Toyota"
            value={make}
            onChange={(e) => setMake(e.target.value)}
            className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-black outline-none transition-all"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-stone-500">Model</label>
          <input
            required
            placeholder="e.g. Camry"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-black outline-none transition-all"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-stone-500">Sub Model (Trim)</label>
          <input
            placeholder="e.g. SE, Limited, etc."
            value={subModel}
            onChange={(e) => setSubModel(e.target.value)}
            className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-black outline-none transition-all"
          />
        </div>
        <div className="md:col-span-2 space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-stone-500">VIN (17 characters)</label>
          <input
            placeholder="Vehicle Identification Number"
            value={vin}
            onChange={(e) => setVin(e.target.value.toUpperCase())}
            maxLength={17}
            className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-black outline-none transition-all font-mono tracking-wider"
          />
        </div>
        <div className="md:col-span-2 space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-stone-500">Nickname (optional)</label>
          <input
            placeholder="e.g. Mom's RAV4, My Project Truck"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-black outline-none transition-all"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-4 bg-black text-white font-bold uppercase tracking-widest rounded-xl hover:bg-stone-800 transition-colors disabled:opacity-50"
      >
        {loading ? 'Adding...' : 'Add Vehicle'}
      </button>
    </motion.form>
  );
}
