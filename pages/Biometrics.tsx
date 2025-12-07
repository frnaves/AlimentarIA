import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { calculateBMI, formatDateISO } from '../utils/calculations';
import { BiometricsLog } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Plus, Ruler } from 'lucide-react';

const generateId = () => Math.random().toString(36).substr(2, 9);

export const Biometrics: React.FC = () => {
  const { biometricsLogs, addBiometricLog, userProfile, currentDate } = useStore();
  const [showForm, setShowForm] = useState(false);
  
  // Form State
  const [weight, setWeight] = useState(userProfile.current_weight_kg.toString());
  const [waist, setWaist] = useState('');
  const [hips, setHips] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseFloat(weight);
    const bmi = calculateBMI(w, userProfile.height_cm);
    
    const newLog: BiometricsLog = {
      id: generateId(),
      date: currentDate, // Uses Time Machine date
      basics: {
        weight_kg: w,
        bmi: bmi
      },
      circumferences_cm: {
        waist: waist ? parseFloat(waist) : undefined,
        hips: hips ? parseFloat(hips) : undefined,
      },
      ratios: {
        waist_hip_ratio: (waist && hips) ? parseFloat((parseFloat(waist)/parseFloat(hips)).toFixed(2)) : undefined
      }
    };

    addBiometricLog(newLog);
    setShowForm(false);
    // Reset optional fields
    setWaist('');
    setHips('');
  };

  const chartData = [...biometricsLogs].reverse().map(log => ({
    date: new Date(log.date).toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'}),
    weight: log.basics.weight_kg
  }));

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Evolução Corporal</h2>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-indigo-700"
        >
          <Plus size={16} />
          Novo Registro
        </button>
      </div>

      {/* Form Area */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 animate-fade-in-down">
          <h3 className="font-bold text-gray-700 mb-4 border-b pb-2">Registrar para {new Date(currentDate).toLocaleDateString()}</h3>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Peso (kg)*</label>
              <input 
                type="number" step="0.1" required
                value={weight} onChange={e => setWeight(e.target.value)}
                className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            {/* Can add more fields here based on PDF */}
             <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Cintura (cm)</label>
              <input 
                type="number" step="0.1"
                value={waist} onChange={e => setWaist(e.target.value)}
                className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Opcional"
              />
            </div>
             <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Quadril (cm)</label>
              <input 
                type="number" step="0.1"
                value={hips} onChange={e => setHips(e.target.value)}
                className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Opcional"
              />
            </div>
          </div>
          
          <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700">
            Salvar Registro
          </button>
        </form>
      )}

      {/* Chart */}
      {chartData.length > 1 ? (
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 h-64">
          <h3 className="text-sm font-semibold text-gray-500 mb-4">Histórico de Peso</h3>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{fontSize: 10}} stroke="#9ca3af" />
              <YAxis domain={['dataMin - 2', 'dataMax + 2']} tick={{fontSize: 10}} stroke="#9ca3af" width={30} />
              <Tooltip 
                contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}}
                itemStyle={{color: '#4f46e5', fontWeight: 'bold'}}
              />
              <Line type="monotone" dataKey="weight" stroke="#4f46e5" strokeWidth={3} dot={{r: 4, fill: '#4f46e5'}} activeDot={{r: 6}} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="bg-indigo-50 p-6 rounded-2xl text-center text-indigo-400">
          <Ruler className="mx-auto mb-2 opacity-50" size={32} />
          <p className="text-sm">Adicione pelo menos 2 registros para ver o gráfico.</p>
        </div>
      )}

      {/* History List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
         <table className="w-full text-sm text-left">
             <thead className="bg-gray-50 text-gray-500 font-medium">
                 <tr>
                     <th className="p-4">Data</th>
                     <th className="p-4">Peso</th>
                     <th className="p-4">IMC</th>
                     <th className="p-4">RCQ</th>
                 </tr>
             </thead>
             <tbody className="divide-y divide-gray-100">
                 {biometricsLogs.map(log => (
                     <tr key={log.id}>
                         <td className="p-4 text-gray-800">{new Date(log.date).toLocaleDateString()}</td>
                         <td className="p-4 font-bold">{log.basics.weight_kg} kg</td>
                         <td className="p-4">
                             <span className={`px-2 py-1 rounded text-xs ${log.basics.bmi > 25 ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                                 {log.basics.bmi}
                             </span>
                         </td>
                         <td className="p-4 text-gray-500">{log.ratios.waist_hip_ratio || '-'}</td>
                     </tr>
                 ))}
             </tbody>
         </table>
      </div>
    </div>
  );
};
