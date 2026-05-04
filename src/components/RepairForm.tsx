import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { OperationType, Vehicle } from '../types';
import { handleFirestoreError } from '../utils/firestore';
import { Plus, X, Wrench, Package, Clock, Calendar, Car, Hash } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function RepairForm({ 
  vehicles, 
  onComplete 
}: { 
  vehicles: Vehicle[], 
  onComplete: () => void 
}) {
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [repairTime, setRepairTime] = useState('');
  const [odometer, setOdometer] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState(vehicles[0]?.id || '');
  
  const [partInput, setPartInput] = useState('');
  const [partNumbers, setPartNumbers] = useState<string[]>([]);
  
  const [toolInput, setToolInput] = useState('');
  const [tools, setTools] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addPart = () => {
    if (partInput.trim()) {
      setPartNumbers([...partNumbers, partInput.trim()]);
      setPartInput('');
    }
  };

  const removePart = (index: number) => {
    setPartNumbers(partNumbers.filter((_, i) => i !== index));
  };

  const addTool = () => {
    if (toolInput.trim()) {
      setTools([...tools, toolInput.trim()]);
      setToolInput('');
    }
  };

  const removeTool = (index: number) => {
    setTools(tools.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    if (!selectedVehicleId) {
      setError('Please select a vehicle first.');
      return;
    }

    setLoading(true);
    setError(null);
    const path = 'repairs';
    try {
      const repairData = {
        userId: auth.currentUser.uid,
        vehicleId: selectedVehicleId,
        date: Timestamp.fromDate(new Date(date)),
        description,
        partNumbers,
        repairTime: parseInt(repairTime) || 0,
        odometer: parseInt(odometer) || 0,
        tools,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await addDoc(collection(db, path), repairData);
      onComplete();
    } catch (err) {
      console.error(err);
      setError('Failed to save repair log. Please try again.');
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
        <div className="w-8 h-8 bg-black text-white rounded-lg flex items-center justify-center">
          <Wrench size={18} />
        </div>
        <h2 className="text-xl font-semibold tracking-tight">New Repair Log</h2>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl font-medium">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1">
            <Car size={14} /> Select Vehicle
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
            <Calendar size={14} /> Date of Repair
          </label>
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-black outline-none transition-all"
          />
        </div>

        <div className="md:col-span-2 space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-stone-500">
            Description of Repair
          </label>
          <textarea
            required
            placeholder="What was fixed?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-black outline-none transition-all min-h-[100px]"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1">
            <Clock size={14} /> Time Taken (mins)
          </label>
          <input
            type="number"
            placeholder="e.g. 60"
            value={repairTime}
            onChange={(e) => setRepairTime(e.target.value)}
            className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-black outline-none transition-all"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1">
            <Hash size={14} /> Odometer Reading
          </label>
          <input
            type="number"
            placeholder="e.g. 120000"
            value={odometer}
            onChange={(e) => setOdometer(e.target.value)}
            className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-black outline-none transition-all"
          />
        </div>
      </div>

      <div className="space-y-4 pt-2 border-t border-stone-100">
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1">
            <Package size={14} /> Part Numbers
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add part number"
              value={partInput}
              onChange={(e) => setPartInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addPart())}
              className="flex-1 p-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-black outline-none transition-all"
            />
            <button
              type="button"
              onClick={addPart}
              className="p-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg transition-colors"
            >
              <Plus size={20} />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            <AnimatePresence>
              {partNumbers.map((part, i) => (
                <motion.span
                  key={`part-${part}-${i}`}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 text-sm font-medium rounded-full border border-blue-100"
                >
                  {part}
                  <button type="button" onClick={() => removePart(i)} className="hover:text-blue-900">
                    <X size={14} />
                  </button>
                </motion.span>
              ))}
            </AnimatePresence>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1">
            <Wrench size={14} /> Tools Used
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add tool"
              value={toolInput}
              onChange={(e) => setToolInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTool())}
              className="flex-1 p-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-black outline-none transition-all"
            />
            <button
              type="button"
              onClick={addTool}
              className="p-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg transition-colors"
            >
              <Plus size={20} />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            <AnimatePresence>
              {tools.map((tool, i) => (
                <motion.span
                  key={`tool-${tool}-${i}`}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-stone-100 text-stone-700 text-sm font-medium rounded-full border border-stone-200"
                >
                  {tool}
                  <button type="button" onClick={() => removeTool(i)} className="hover:text-stone-900">
                    <X size={14} />
                  </button>
                </motion.span>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-4 bg-black text-white font-bold uppercase tracking-widest rounded-xl hover:bg-stone-800 transition-colors disabled:opacity-50"
      >
        {loading ? 'Logging...' : 'Save Repair Log'}
      </button>
    </motion.form>
  );
}
