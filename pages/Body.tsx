
import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { calculateBMI, calculateExerciseCalories } from '../utils/calculations';
import { BiometricsLog, Exercise } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Plus, Ruler, Dumbbell, Clock, Flame, ChevronRight, TrendingUp, AlertTriangle, X, Edit2, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const generateId = () => Math.random().toString(36).substr(2, 9);

export const Body: React.FC = () => {
  const { biometricsLogs, addBiometricLog, updateBiometricLog, deleteBiometricLog, userProfile, currentDate, addExercise, nutritionLogs } = useStore();
  const [activeTab, setActiveTab] = useState<'measures' | 'exercises'>('measures');
  
  const currentExercises = nutritionLogs[currentDate]?.exercises || [];

  return (
    <div className="space-y-6">
      
      {/* Tab Switcher */}
      <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-100">
          <button 
            onClick={() => setActiveTab('measures')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'measures' ? 'bg-emerald-50 text-emerald-700 shadow-sm' : 'text-gray-500'}`}
          >
            Medidas
          </button>
          <button 
            onClick={() => setActiveTab('exercises')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'exercises' ? 'bg-emerald-50 text-emerald-700 shadow-sm' : 'text-gray-500'}`}
          >
            Exercícios
          </button>
      </div>

      {activeTab === 'measures' ? <MeasuresSection /> : <ExercisesSection />}
      
    </div>
  );

  function MeasuresSection() {
      const [showForm, setShowForm] = useState(false);
      const [editingLogId, setEditingLogId] = useState<string | null>(null);
      
      // Form State
      const [weight, setWeight] = useState(userProfile.current_weight_kg.toString());
      const [waist, setWaist] = useState('');
      const [abdomen, setAbdomen] = useState('');
      const [hips, setHips] = useState('');

      // Security Modal State
      const [showSafetyModal, setShowSafetyModal] = useState(false);
      const [pendingSubmission, setPendingSubmission] = useState(false);

      const resetForm = () => {
          setWeight(userProfile.current_weight_kg.toString());
          setWaist('');
          setAbdomen('');
          setHips('');
          setEditingLogId(null);
      };

      const handleEditClick = (log: BiometricsLog) => {
          setEditingLogId(log.id);
          setWeight(log.basics.weight_kg.toString());
          setWaist(log.circumferences_cm.waist?.toString() || '');
          setAbdomen(log.circumferences_cm.abdomen?.toString() || '');
          setHips(log.circumferences_cm.hips?.toString() || '');
          setShowForm(true);
      };

      const handleDeleteClick = (id: string) => {
          if (window.confirm("Tem certeza que deseja apagar este registro?")) {
              deleteBiometricLog(id);
          }
      };

      const executeSave = () => {
        const w = parseFloat(weight);
        const bmi = calculateBMI(w, userProfile.height_cm);
        
        const logData: BiometricsLog = {
          id: editingLogId || generateId(),
          date: editingLogId ? biometricsLogs.find(l => l.id === editingLogId)?.date || currentDate : currentDate,
          basics: { weight_kg: w, bmi: bmi },
          circumferences_cm: {
            waist: waist ? parseFloat(waist) : undefined,
            abdomen: abdomen ? parseFloat(abdomen) : undefined,
            hips: hips ? parseFloat(hips) : undefined,
          },
          ratios: {
            waist_hip_ratio: (waist && hips) ? parseFloat((parseFloat(waist)/parseFloat(hips)).toFixed(2)) : undefined
          }
        };

        if (editingLogId) {
            updateBiometricLog(logData);
        } else {
            addBiometricLog(logData);
        }

        setShowForm(false);
        setShowSafetyModal(false);
        setPendingSubmission(false);
        resetForm();
      };

      const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const w = parseFloat(weight);
        
        // 1. Min/Max Validation
        if (isNaN(w) || w < 30 || w > 300) {
            alert("O peso deve estar entre 30kg e 300kg.");
            return;
        }

        // 2. Variation Check (Only if we are not confirming a pending submission)
        if (!pendingSubmission) {
            // Find the closest previous log (not including the one we might be editing)
            const sortedLogs = [...biometricsLogs]
                .filter(l => l.id !== editingLogId)
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            
            // Assuming sorted logs are newest first, we look for the first one.
            const previousLog = sortedLogs[0];

            if (previousLog) {
                const prevWeight = previousLog.basics.weight_kg;
                const diff = Math.abs(w - prevWeight);
                const percentage = (diff / prevWeight) * 100;

                if (percentage > 20) {
                    setShowSafetyModal(true);
                    setPendingSubmission(true);
                    return; // Stop here and wait for modal confirmation
                }
            }
        }

        executeSave();
      };

      const chartData = [...biometricsLogs].reverse().map(log => ({
        date: new Date(log.date).toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'}),
        weight: log.basics.weight_kg
      }));

      return (
          <div className="space-y-6 animate-fade-in pb-20 relative">
              
              {/* Safety Modal */}
              {showSafetyModal && (
                  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                      <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl animate-in zoom-in-95">
                          <div className="flex flex-col items-center text-center">
                              <div className="bg-orange-100 p-3 rounded-full mb-3">
                                  <AlertTriangle size={32} className="text-orange-500" />
                              </div>
                              <h3 className="text-lg font-bold text-gray-800 mb-2">Variação de Peso Alta</h3>
                              <p className="text-sm text-gray-600 mb-6">
                                  Detectamos uma diferença superior a 20% em relação ao seu último registro. Isso é incomum. Tem certeza que o valor <strong>{weight}kg</strong> está correto?
                              </p>
                              <div className="flex gap-3 w-full">
                                  <button 
                                    onClick={() => { setShowSafetyModal(false); setPendingSubmission(false); }}
                                    className="flex-1 py-3 text-gray-600 font-bold bg-gray-100 rounded-xl hover:bg-gray-200"
                                  >
                                      Corrigir
                                  </button>
                                  <button 
                                    onClick={executeSave}
                                    className="flex-1 py-3 text-white font-bold bg-orange-500 rounded-xl hover:bg-orange-600"
                                  >
                                      Confirmar
                                  </button>
                              </div>
                          </div>
                      </div>
                  </div>
              )}

              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-800">Histórico Físico</h2>
                <button 
                    onClick={() => { resetForm(); setShowForm(!showForm); }} 
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 hover:bg-indigo-700"
                >
                  <Plus size={14} /> {showForm && !editingLogId ? 'Cancelar' : 'Novo'}
                </button>
              </div>

              {/* Evolution Link Banner */}
              <Link to="/evolution" className="block bg-gradient-to-r from-indigo-500 to-blue-500 p-4 rounded-xl text-white shadow-lg shadow-indigo-200 group">
                  <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                          <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm">
                              <TrendingUp size={20} className="text-white" />
                          </div>
                          <div>
                              <h4 className="font-bold text-sm">Ver Evolução Detalhada</h4>
                              <p className="text-xs text-indigo-100">Gráficos completos de peso e medidas</p>
                          </div>
                      </div>
                      <ChevronRight className="group-hover:translate-x-1 transition-transform" />
                  </div>
              </Link>

              {showForm && (
                <form onSubmit={handleSubmit} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 animate-fade-in-down relative">
                  {editingLogId && (
                      <div className="absolute top-4 right-4 text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                          Editando Registro
                      </div>
                  )}
                  <h3 className="font-bold text-gray-700 mb-4">{editingLogId ? 'Editar Medidas' : `Registrar: ${new Date(currentDate).toLocaleDateString()}`}</h3>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Peso (kg)*</label>
                      <input type="number" step="0.1" required value={weight} onChange={e => setWeight(e.target.value)} className="w-full border rounded-lg p-2 outline-none focus:border-indigo-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Abdômen (cm)</label>
                      <input type="number" step="0.1" value={abdomen} onChange={e => setAbdomen(e.target.value)} className="w-full border rounded-lg p-2 outline-none focus:border-indigo-500" placeholder="Umbilical" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Cintura (cm)</label>
                      <input type="number" step="0.1" value={waist} onChange={e => setWaist(e.target.value)} className="w-full border rounded-lg p-2 outline-none focus:border-indigo-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Quadril (cm)</label>
                      <input type="number" step="0.1" value={hips} onChange={e => setHips(e.target.value)} className="w-full border rounded-lg p-2 outline-none focus:border-indigo-500" />
                    </div>
                  </div>
                  <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold text-sm">
                      {editingLogId ? 'Atualizar Dados' : 'Salvar Registro'}
                  </button>
                </form>
              )}

              {/* Small Chart Preview */}
              {chartData.length > 1 && (
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="date" hide />
                      <YAxis domain={['dataMin - 2', 'dataMax + 2']} hide />
                      <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}} />
                      <Line type="monotone" dataKey="weight" stroke="#4f46e5" strokeWidth={3} dot={{r: 3}} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* TABLE LIST SECTION */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                 <div className="px-4 py-3 border-b border-gray-50 bg-gray-50">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide">Últimos Registros</h3>
                 </div>
                 {biometricsLogs.length === 0 ? (
                     <div className="p-6 text-center text-gray-400 text-sm">Nenhum registro encontrado.</div>
                 ) : (
                     <table className="w-full text-sm text-left">
                         <thead className="text-gray-400 font-medium border-b border-gray-100">
                             <tr>
                                 <th className="p-3 font-medium">Data</th>
                                 <th className="p-3 font-medium">Peso</th>
                                 <th className="p-3 font-medium">IMC</th>
                                 <th className="p-3 font-medium text-right">Ações</th>
                             </tr>
                         </thead>
                         <tbody className="divide-y divide-gray-100">
                             {biometricsLogs.map(log => (
                                 <tr key={log.id} className="group hover:bg-gray-50 transition-colors">
                                     <td className="p-3 text-gray-800">{new Date(log.date).toLocaleDateString()}</td>
                                     <td className="p-3 font-bold">{log.basics.weight_kg} kg</td>
                                     <td className="p-3">
                                         <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${log.basics.bmi > 25 ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                                             {log.basics.bmi}
                                         </span>
                                     </td>
                                     <td className="p-3 text-right">
                                         <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                             <button 
                                                onClick={() => handleEditClick(log)}
                                                className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                                             >
                                                 <Edit2 size={16} />
                                             </button>
                                             <button 
                                                onClick={() => handleDeleteClick(log.id)}
                                                className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                                             >
                                                 <Trash2 size={16} />
                                             </button>
                                         </div>
                                     </td>
                                 </tr>
                             ))}
                         </tbody>
                     </table>
                 )}
              </div>
          </div>
      );
  }

  function ExercisesSection() {
      const [showAdd, setShowAdd] = useState(false);
      const [activity, setActivity] = useState('');
      const [duration, setDuration] = useState('');
      const [met, setMet] = useState(5.0); // Default moderate

      const handleAddExercise = (e: React.FormEvent) => {
          e.preventDefault();
          const mins = parseInt(duration);
          const calories = calculateExerciseCalories(met, userProfile.current_weight_kg, mins);
          
          addExercise(currentDate, {
              id: generateId(),
              name: activity,
              duration_minutes: mins,
              met: met,
              calories_burned: calories
          });
          setShowAdd(false);
          setActivity('');
          setDuration('');
      };

      const EXERCISE_PRESETS = [
          { name: "Caminhada Leve", met: 3.5 },
          { name: "Musculação", met: 5.0 },
          { name: "Corrida (8km/h)", met: 8.0 },
          { name: "Ciclismo", met: 7.5 },
          { name: "Natação", met: 6.0 },
      ];

      return (
          <div className="space-y-6 animate-fade-in">
               <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-800">Atividades do Dia</h2>
                <button onClick={() => setShowAdd(!showAdd)} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 hover:bg-emerald-700">
                  <Plus size={14} /> Registrar
                </button>
              </div>

              {showAdd && (
                  <form onSubmit={handleAddExercise} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 animate-fade-in-down">
                      <div className="mb-4">
                          <label className="block text-xs font-semibold text-gray-500 mb-2">Atividade Rápida</label>
                          <div className="flex flex-wrap gap-2">
                              {EXERCISE_PRESETS.map(pre => (
                                  <button type="button" key={pre.name} 
                                    onClick={() => { setActivity(pre.name); setMet(pre.met); }}
                                    className={`text-xs px-3 py-1.5 rounded-full border ${activity === pre.name ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-gray-50 text-gray-600 border-gray-200'}`}
                                  >
                                      {pre.name}
                                  </button>
                              ))}
                          </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                              <label className="block text-xs font-semibold text-gray-500 mb-1">Nome</label>
                              <input required value={activity} onChange={e => setActivity(e.target.value)} className="w-full border rounded-lg p-2 outline-none" placeholder="Ex: Yoga" />
                          </div>
                          <div>
                              <label className="block text-xs font-semibold text-gray-500 mb-1">Duração (min)</label>
                              <input required type="number" value={duration} onChange={e => setDuration(e.target.value)} className="w-full border rounded-lg p-2 outline-none" placeholder="30" />
                          </div>
                      </div>
                      <button type="submit" className="w-full bg-emerald-600 text-white py-3 rounded-lg font-bold text-sm">Adicionar Atividade</button>
                  </form>
              )}

              <div className="space-y-3">
                  {currentExercises.length === 0 ? (
                      <div className="text-center py-10 text-gray-400 bg-white rounded-xl border border-dashed border-gray-200">
                          Nenhuma atividade registrada hoje.
                      </div>
                  ) : (
                      currentExercises.map(ex => (
                          <div key={ex.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center">
                              <div className="flex items-center gap-3">
                                  <div className="bg-orange-100 p-2 rounded-full text-orange-500">
                                      <Dumbbell size={20} />
                                  </div>
                                  <div>
                                      <h4 className="font-bold text-gray-800 text-sm">{ex.name}</h4>
                                      <div className="flex items-center gap-1 text-xs text-gray-500">
                                          <Clock size={12} /> {ex.duration_minutes} min
                                      </div>
                                  </div>
                              </div>
                              <div className="text-right">
                                  <div className="font-bold text-orange-500 text-sm flex items-center gap-1 justify-end">
                                      <Flame size={12} /> {ex.calories_burned}
                                  </div>
                                  <span className="text-[10px] text-gray-400">kcal</span>
                              </div>
                          </div>
                      ))
                  )}
              </div>
          </div>
      );
  }
};
