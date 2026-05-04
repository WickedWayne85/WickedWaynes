import { Repair, Vehicle } from '../types';
import { Calendar, Clock, Wrench, Package, Car, Trash2, Hash } from 'lucide-react';
import { motion } from 'motion/react';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { handleFirestoreError } from '../utils/firestore';
import { OperationType } from '../types';

export default function RepairCard({ 
  repair, 
  vehicle 
}: { 
  repair: Repair, 
  vehicle?: Vehicle 
}) {
  const handleDelete = async () => {
    if (!window.confirm('Delete this repair log?')) return;
    const path = `repairs/${repair.id}`;
    try {
      await deleteDoc(doc(db, 'repairs', repair.id!));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow relative group"
    >
      <button 
        onClick={handleDelete}
        className="absolute top-4 right-4 p-2 text-stone-400 hover:text-red-500 transition-colors bg-stone-50 rounded-lg"
      >
        <Trash2 size={18} />
      </button>

      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-stone-100 rounded-lg text-stone-600">
            <Calendar size={18} />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-stone-500">Date</div>
            <div className="font-mono text-sm">{repair.date.toDate().toLocaleDateString()}</div>
          </div>
          
          {(repair.repairTime > 0 || repair.odometer !== undefined) && (
            <div className="flex items-center gap-6 ml-6 border-l border-stone-100 pl-6">
              {repair.repairTime > 0 && (
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1">
                    <Clock size={12} /> Duration
                  </div>
                  <div className="font-mono text-sm">{repair.repairTime}m</div>
                </div>
              )}
              {repair.odometer !== undefined && repair.odometer > 0 && (
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1">
                    <Hash size={12} /> Odometer
                  </div>
                  <div className="font-mono text-sm">{repair.odometer.toLocaleString()}</div>
                </div>
              )}
            </div>
          )}
        </div>

        {(vehicle || repair.vehicleInfo) && (
          <div className="flex items-center gap-3">
            <div className="p-2 bg-stone-100 rounded-lg text-stone-600">
              <Car size={18} />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-stone-500">Vehicle</div>
              <div className="font-medium text-sm">
                {vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}${vehicle.subModel ? ` ${vehicle.subModel}` : ''}` : repair.vehicleInfo}
              </div>
            </div>
          </div>
        )}

        <div className="mt-2">
          <div className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">Repair Description</div>
          <p className="text-stone-800 leading-relaxed font-sans">{repair.description}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          {repair.partNumbers.length > 0 && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-stone-400 mb-2 flex items-center gap-1">
                <Package size={12} /> Parts
              </div>
              <div className="flex flex-wrap gap-1.5">
                {repair.partNumbers.map((part, i) => (
                  <span key={`part-${part}-${i}`} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[11px] font-bold rounded-md border border-blue-100 uppercase tracking-tight">
                    {part}
                  </span>
                ))}
              </div>
            </div>
          )}

          {repair.tools.length > 0 && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-stone-400 mb-2 flex items-center gap-1">
                <Wrench size={12} /> Tools
              </div>
              <div className="flex flex-wrap gap-1.5">
                {repair.tools.map((tool, i) => (
                  <span key={`tool-${tool}-${i}`} className="px-2 py-0.5 bg-stone-100 text-stone-600 text-[11px] font-bold rounded-md border border-stone-200">
                    {tool}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
