
import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { ArrowLeft, Scale, Ruler } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Evolution: React.FC = () => {
  const { biometricsLogs, userProfile } = useStore();
  const [activeChart, setActiveChart] = useState<'weight' | 'measurements'>('weight');

  const data = [...biometricsLogs].reverse().map(log => ({
    date: new Date(log.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    weight: log.basics.weight_kg,
    bmi: log.basics.bmi,
    abdomen: log.circumferences_cm.abdomen || 0,
    waist: log.circumferences_cm.waist || 0,
    hips: log.circumferences_cm.hips || 0
  }));

  const startWeight = data.length > 0 ? data[0].weight : userProfile.current_weight_kg;
  const currentWeight = userProfile.current_weight_kg;
  const diff = (currentWeight - startWeight).toFixed(1);
  const diffNum = parseFloat(diff);

  return (
    <div className="space-y-6 pb-10">
      
      {/* Header */}
      <div className="flex items-center gap-3">
          <Link to="/body" className="p-2 bg-white rounded-full text-gray-600 shadow-sm border border-gray-100">
              <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-bold text-gray-800">Evolução Detalhada</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
              <span className="text-xs text-gray-500 font-medium">Variação Total</span>
              <div className={`text-2xl font-bold mt-1 ${diffNum < 0 ? 'text-green-500' : 'text-gray-800'}`}>
                  {diffNum > 0 ? '+' : ''}{diff} kg
              </div>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
              <span className="text-xs text-gray-500 font-medium">Meta</span>
              <div className="text-2xl font-bold mt-1 text-emerald-600">
                  {userProfile.target_weight_kg} kg
              </div>
          </div>
      </div>

      {/* Chart Selector */}
      <div className="flex bg-gray-100 p-1 rounded-xl">
          <button 
            onClick={() => setActiveChart('weight')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeChart === 'weight' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400'}`}
          >
              <Scale size={16} /> Peso
          </button>
          <button 
            onClick={() => setActiveChart('measurements')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeChart === 'measurements' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400'}`}
          >
              <Ruler size={16} /> Medidas
          </button>
      </div>

      {/* Chart Container */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 h-80">
          {data.length < 2 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 text-center">
                  <Scale size={40} className="mb-2 opacity-50" />
                  <p className="text-sm">Registre suas medidas em dias diferentes para ver o gráfico.</p>
              </div>
          ) : (
             <ResponsiveContainer width="100%" height="100%">
                 {activeChart === 'weight' ? (
                     <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis dataKey="date" tick={{fontSize: 10}} stroke="#9ca3af" />
                        <YAxis domain={['auto', 'auto']} tick={{fontSize: 10}} stroke="#9ca3af" width={30} />
                        <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'}} />
                        <Area type="monotone" dataKey="weight" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorWeight)" name="Peso (kg)" />
                     </AreaChart>
                 ) : (
                     <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis dataKey="date" tick={{fontSize: 10}} stroke="#9ca3af" />
                        <YAxis tick={{fontSize: 10}} stroke="#9ca3af" width={30} />
                        <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'}} />
                        <Line type="monotone" dataKey="abdomen" stroke="#ef4444" strokeWidth={2} dot={false} name="Abdômen" />
                        <Line type="monotone" dataKey="waist" stroke="#f59e0b" strokeWidth={2} dot={false} name="Cintura" />
                        <Line type="monotone" dataKey="hips" stroke="#3b82f6" strokeWidth={2} dot={false} name="Quadril" />
                     </LineChart>
                 )}
             </ResponsiveContainer>
          )}
      </div>

      <div className="bg-blue-50 p-4 rounded-xl text-xs text-blue-700 leading-relaxed">
          <p><strong>Dica:</strong> Para maior precisão nos gráficos, tente realizar suas medições sempre no mesmo horário e condições (preferencialmente em jejum pela manhã).</p>
      </div>
    </div>
  );
};
