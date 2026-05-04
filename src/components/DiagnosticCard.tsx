import React from 'react';
import { Diagnostic, Vehicle } from '../types';
import { Calendar, Activity, Hash, Trash2, Info } from 'lucide-react';
import { motion } from 'motion/react';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { handleFirestoreError } from '../utils/firestore';
import { OperationType } from '../types';

export default function DiagnosticCard({ 
  diagnostic, 
  vehicle 
}: { 
  diagnostic: Diagnostic, 
  vehicle?: Vehicle 
}) {
  const handleDelete = async () => {
    if (!window.confirm('Delete this diagnostic log?')) return;
    const path = `diagnostics/${diagnostic.id}`;
    try {
      await deleteDoc(doc(db, 'diagnostics', diagnostic.id!));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border-l-4 border-l-red-500 border border-stone-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow relative"
    >
      <button 
        onClick={handleDelete}
        className="absolute top-4 right-4 p-2 text-stone-300 hover:text-red-500 transition-colors rounded-lg bg-stone-50"
      >
        <Trash2 size={16} />
      </button>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-50 text-red-600 rounded-lg">
              <Activity size={18} />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Scan Log</div>
              <div className="font-bold text-stone-900">
                {vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}${vehicle.subModel ? ` ${vehicle.subModel}` : ''}` : 'Generic Scan'}
              </div>
            </div>
          </div>
          <div className="text-right mr-10">
            <div className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Date</div>
            <div className="text-sm font-mono text-stone-600">{diagnostic.dateDiscovered.toDate().toLocaleDateString()}</div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {diagnostic.codes.map((code, i) => (
            <div key={`code-${code}-${i}`} className="flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-700 border border-red-100 rounded-lg shadow-sm">
              <Activity size={12} />
              <span className="font-mono font-bold text-sm tracking-tighter">{code}</span>
            </div>
          ))}
        </div>

        {diagnostic.notes && (
          <div className="bg-stone-50 p-3 rounded-xl border border-stone-100">
            <div className="flex items-start gap-2">
              <Info size={14} className="text-stone-400 mt-0.5 shrink-0" />
              <p className="text-sm text-stone-600 leading-relaxed italic">{diagnostic.notes}</p>
            </div>
          </div>
        )}

        {diagnostic.odometer !== undefined && diagnostic.odometer > 0 && (
          <div className="flex items-center gap-2 text-stone-400">
            <Hash size={14} />
            <span className="text-xs font-mono">{diagnostic.odometer.toLocaleString()} miles</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
