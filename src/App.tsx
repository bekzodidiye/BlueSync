import React, { useState, useEffect } from 'react';
import { 
  Headphones, 
  RefreshCw, 
  Trash2, 
  Activity, 
  Layers,
  Volume2,
  VolumeX,
  Clock,
  CheckCircle2,
  AlertCircle,
  Terminal,
  Cpu,
  Unplug,
  Mic,
  Cloud,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Device, AudioState } from './types';

export default function App() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [mode, setMode] = useState<'hardware' | 'simulation' | 'cloud-preview' | 'error'>('hardware');
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<AudioState>({
    defaultSink: 'ALSA Output',
    combinedStatus: 'inactive',
    latency: 0,
    syncStatus: 'synced'
  });

  const fetchDevices = async () => {
    setLoading(true);
    setErrorDetails(null);
    try {
      const res = await fetch('/api/devices');
      const data = await res.json();
      if (data.devices) {
        setDevices(data.devices);
        setMode(data.mode);
        if (data.error) setErrorDetails(data.error);
      } else {
        setDevices(data);
      }
    } catch (err) {
      console.error('Failed to fetch devices', err);
      setMode('error');
    } finally {
      setLoading(false);
    }
  };

  const updateVolume = async (id: string, sink: string, volume: number) => {
    setDevices(prev => prev.map(d => d.id === id ? { ...d, volume } : d));
    try {
      await fetch('/api/devices/volume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sink, volume })
      });
    } catch (err) {
      console.error('Volume update failed', err);
    }
  };

  const updateLatency = async (id: string, sink: string, latency: number) => {
    setDevices(prev => prev.map(d => d.id === id ? { ...d, latency_ms: latency } : d));
    try {
      await fetch('/api/devices/latency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sink, latency })
      });
    } catch (err) {
      console.error('Latency update failed', err);
    }
  };

  const toggleMute = async (id: string, sink: string) => {
    const device = devices.find(d => d.id === id);
    if (!device) return;
    const newMuted = !device.muted;
    
    setDevices(prev => prev.map(d => d.id === id ? { ...d, muted: newMuted } : d));
    
    try {
      await fetch('/api/devices/mute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sink, muted: newMuted })
      });
    } catch (err) {
      console.error('Mute failed', err);
    }
  };

  const toggleSolo = async (id: string) => {
    setDevices(prev => prev.map(d => {
      if (selectedIds.includes(d.id)) {
        const shouldMute = d.id !== id;
        if (d.muted !== shouldMute && d.sink) {
          fetch('/api/devices/mute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sink: d.sink, muted: shouldMute })
          }).catch(console.error);
        }
        return { ...d, muted: shouldMute };
      }
      return d;
    }));
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const toggleDevice = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleCombine = async () => {
    try {
      const res = await fetch('/api/combine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceIds: selectedIds })
      });
      if (res.ok) {
        setStatus(prev => ({ ...prev, combinedStatus: 'active' }));
        fetchDevices();
      }
    } catch (err) {
      console.error('Combine failed', err);
    }
  };

  const handleReset = async () => {
    try {
      await fetch('/api/reset', { method: 'POST' });
      setStatus(prev => ({ ...prev, combinedStatus: 'inactive' }));
      setSelectedIds([]);
      fetchDevices();
    } catch (err) {
      console.error('Reset failed', err);
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#0C0D10] text-[#E0E0E0] overflow-hidden p-3 gap-3 font-sans">
      {/* Main Content Area */}
      <main className="flex-1 flex flex-col gap-3 min-w-0">
        <>
          {/* Header Controls */}
          <header className="flex items-center justify-between bg-[#151619] p-4 rounded-2xl border border-[#2C2E33] shadow-lg">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-black text-white shadow-lg shadow-blue-600/30 text-xl">B</div>
                <div className="flex flex-col">
                  <span className="text-lg font-black tracking-tighter text-white">BlueSync</span>
                  <span className="text-[10px] font-mono text-blue-500 font-bold uppercase tracking-[0.2em]">Hardware Monitor</span>
                </div>
              </div>
              <div className="h-8 w-px bg-[#2C2E33] mx-2 hidden sm:block" />
              <div className="hidden sm:flex gap-2">
                <button 
                  onClick={fetchDevices}
                  className="p-2 bg-[#1A1B1E] hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-xl border border-[#2C2E33] transition-all active:scale-95"
                  title="Yangilash"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
                <button 
                  onClick={handleReset}
                  className="p-2 bg-[#1A1B1E] hover:bg-red-500/10 text-neutral-500 hover:text-red-500 rounded-xl border border-[#2C2E33] transition-all active:scale-95"
                  title="Reset"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 bg-[#0C0D10] px-4 py-2 rounded-2xl border border-[#2C2E33]">
                <div className={`w-2 h-2 rounded-full ${status.combinedStatus === 'active' ? 'bg-blue-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">
                  {mode === 'cloud-preview' ? 'Cloud Sandbox (Demo)' : 'System Interface: Active'}
                </span>
              </div>
            </div>
          </header>

          {/* Cloud Sandbox Notice is removed since we auto-load demo data or show status */}
          {mode === 'cloud-preview' && devices.length === 0 && (
             <div className="bg-blue-600/10 border-2 border-blue-600/20 p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                   <div className="p-4 bg-blue-600/20 rounded-2xl">
                    <Cloud className="w-8 h-8 text-blue-400" />
                   </div>
                   <div className="flex flex-col">
                      <h3 className="text-lg font-bold text-white tracking-tight">Cloud Sandbox muhitidasiz</h3>
                      <p className="text-sm text-neutral-400 font-medium max-w-lg">
                        Brauzer xavfsizlik cheklovlari tufayli bulutda Bluetooth audio qurilmalariga to'g'ridan-to'g'g'ri ulanib bo'lmaydi. Demo rejimida interfeysni sinab ko'rishingiz mumkin.
                      </p>
                   </div>
                </div>
                <button 
                  onClick={() => {
                    setDevices([
                      { id: "bt_1", name: "Sony WH-1000XM4", status: "connected", profile: "A2DP (LDAC)", sink: "bluez_sink_1", active: true, volume: 85, latency_ms: 0, type: 'sink' },
                      { id: "bt_2", name: "Apple AirPods Pro", status: "connected", profile: "A2DP (AAC)", sink: "bluez_sink_2", active: false, volume: 85, latency_ms: 20, type: 'sink' },
                      { id: "bt_3", name: "Bose QuietComfort 45", status: "connected", profile: "A2DP (SBC)", sink: "bluez_sink_3", active: false, volume: 75, latency_ms: 45, type: 'sink' },
                      { id: "hw_1", name: "System Analog Output", status: "connected", profile: "Stereo", sink: "alsa_sink_1", active: false, volume: 100, latency_ms: 0, type: 'sink' }
                    ]);
                    setMode('simulation');
                  }}
                  className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-xl shadow-blue-600/30 transition-all active:scale-95 uppercase tracking-widest text-[11px]"
                >
                  Demo Ma'lumotlarni Yuklash
                </button>
             </div>
          )}

          {/* Main Grid */}
          <div className="flex-1 flex flex-col gap-3 min-h-0">
            {/* Device List */}
            <section className="flex-1 flex flex-col gap-3 min-h-0 overflow-y-auto pr-1 select-none">
              <div className="flex items-center justify-between px-1 shrink-0">
                <h2 className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Audio Interfeyslar ({devices.length})</h2>
                {selectedIds.length > 0 && (
                  <span className="text-[10px] text-blue-400 font-mono font-bold animate-pulse">
                    {selectedIds.length} TA TANLANDI
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-40">
                <AnimatePresence mode="popLayout">
                  {devices.map((device) => (
                    <motion.div
                      key={device.id}
                      layout
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      onClick={() => device.status === 'connected' && toggleDevice(device.id)}
                      className={`bg-[#151619] p-5 rounded-2xl flex flex-col gap-4 relative overflow-hidden transition-all duration-300 group cursor-pointer border-2 ${
                        selectedIds.includes(device.id)
                          ? 'border-blue-600 bg-blue-600/5 shadow-[0_0_20px_rgba(37,99,235,0.1)]'
                          : 'border-[#2C2E33] hover:border-neutral-700'
                      } ${device.status !== 'connected' ? 'opacity-40 grayscale pointer-events-none' : ''}`}
                    >
                      <div className="absolute top-0 right-0 w-12 h-12 bg-blue-600/5 rounded-bl-3xl flex items-center justify-center">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                          selectedIds.includes(device.id) ? 'bg-blue-600 border-blue-600 scale-110' : 'border-neutral-700'
                        }`}>
                          {selectedIds.includes(device.id) && <CheckCircle2 className="w-3 h-3 text-white" />}
                        </div>
                      </div>

                      <div className={`absolute top-0 right-10 w-12 h-12 rounded-bl-3xl flex items-center justify-center transition-all ${device.muted ? 'bg-red-500/10 opacity-100' : 'opacity-0'}`}>
                        <VolumeX className="w-3.5 h-3.5 text-red-500" />
                      </div>

                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-3">
                           <div className={`p-2.5 rounded-xl ${device.type === 'source' ? 'bg-orange-500/10 text-orange-400' : 'bg-blue-500/10 text-blue-400'}`}>
                             {device.type === 'source' ? <Mic className="w-4 h-4" /> : <Headphones className="w-4 h-4" />}
                           </div>
                           <div className="flex flex-col">
                             <span className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors uppercase tracking-tight">{device.name}</span>
                             <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-tighter">ID: {device.id.slice(-8).toUpperCase()}</span>
                           </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 bg-neutral-900 text-neutral-400 rounded text-[9px] font-bold border border-[#2C2E33] uppercase font-mono">
                          {device.profile || 'STREAM'}
                        </span>
                        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                          device.status === 'connected' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-neutral-800 text-neutral-500'
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${device.status === 'connected' ? 'bg-emerald-500' : 'bg-neutral-500'}`} />
                          {device.status}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {devices.length === 0 && !loading && (
                   <div className="col-span-full py-20 flex flex-col items-center justify-center text-neutral-600 border-2 border-dashed border-[#2C2E33] rounded-3xl">
                      <Zap className="w-12 h-12 mb-4 opacity-20" />
                      <p className="text-sm font-bold uppercase tracking-widest">Qurilmalar topilmadi</p>
                      <p className="text-[10px] uppercase tracking-tighter">Bluetooth yoqilganini va qurilma ulanganini tekshiring</p>
                   </div>
                )}
              </div>
            </section>
          </div>

          {/* Action Button Floating */}
          {selectedIds.length > 0 && selectedIds.length < 2 && (
             <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50">
                <div className="bg-[#1A1B1E] border border-blue-500/30 px-6 py-3 rounded-full shadow-2xl flex items-center gap-4 animate-in fade-in zoom-in slide-in-from-bottom-5">
                   <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-white uppercase">Sync tayyor emas</span>
                      <span className="text-[8px] text-neutral-500 uppercase">Kamida 2 ta qurilma tanlang</span>
                   </div>
                   <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center">
                      <Layers className="w-4 h-4 text-neutral-600" />
                   </div>
                </div>
             </div>
          )}

          {selectedIds.length >= 2 && (
             <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50">
                <button 
                   onClick={handleCombine}
                   className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-full shadow-[0_10px_40px_rgba(37,99,235,0.4)] flex items-center gap-3 active:scale-95 transition-all animate-in fade-in zoom-in slide-in-from-bottom-5"
                >
                   <Layers className="w-5 h-5 shadow-inner" />
                   <span className="text-xs font-black uppercase tracking-[0.2em]">Sinxronlash</span>
                </button>
             </div>
          )}

          {/* Bottom Mixer Panel */}
          <AnimatePresence>
            {selectedIds.length > 0 && (
              <motion.section 
                initial={{ y: 200, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 200, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed bottom-6 left-6 right-6 bg-[#1A1B1E] border-2 border-blue-600/30 rounded-3xl p-6 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] backdrop-blur-xl"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-600 shadow-lg shadow-blue-600/40 rounded-2xl">
                      <Volume2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white">Advanced Hardware Mixer</h3>
                      <div className="flex items-center gap-2 mt-1">
                         <span className="text-[10px] font-mono text-neutral-500 uppercase">Master Path:</span>
                         <span className="text-[10px] font-mono text-blue-400 font-bold uppercase tracking-widest">Combined Virtual Output</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-[10px] font-mono bg-[#0C0D10] px-5 py-2.5 rounded-2xl border border-[#2C2E33]">
                     <span className="text-neutral-500 uppercase">Clock: <span className="text-emerald-400 font-bold">CRYSTAL_LOCKED</span></span>
                     <div className="w-px h-3 bg-neutral-800" />
                     <span className="text-neutral-500 uppercase">Jitter: <span className="text-blue-400 font-bold">0.05ms</span></span>
                  </div>
                </div>

                <div className="flex gap-4 overflow-x-auto pb-2 scroller">
                  {devices.filter(d => selectedIds.includes(d.id)).map(device => (
                    <div key={device.id} className="flex-1 min-w-[320px] bg-[#0C0D10] border border-[#2C2E33] p-5 rounded-2xl flex flex-col gap-5 hover:border-blue-500/30 transition-all group">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                           <div className={`p-2.5 rounded-xl ${device.type === 'source' ? 'bg-orange-500/10 text-orange-400' : 'bg-blue-500/10 text-blue-400'}`}>
                              {device.type === 'source' ? <Mic className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                           </div>
                           <div className="flex flex-col">
                             <span className="text-xs font-bold text-white uppercase truncate max-w-[180px]">{device.name}</span>
                             <span className="text-[10px] text-neutral-600 font-mono tracking-tighter uppercase">{device.sink || 'VIRTUAL_STREAM'}</span>
                           </div>
                        </div>
                        <button className="p-2 hover:bg-red-500/10 text-neutral-700 hover:text-red-500 transition-all rounded-xl">
                          <Unplug className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="space-y-6">
                        {/* Volume Control */}
                        <div className="space-y-2.5">
                          <div className="flex justify-between text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-widest">
                            <span className="flex items-center gap-2">
                              {device.type === 'source' ? <Mic className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />} 
                              {device.type === 'source' ? 'Gain' : 'Internal Vol'}
                            </span>
                            <span className={device.type === 'source' ? 'text-orange-400' : 'text-blue-400'}>{device.volume}%</span>
                          </div>
                          <div className="relative pt-1 pb-4">
                             <input 
                              type="range" 
                              min="0" 
                              max="150" 
                              value={device.volume} 
                              onChange={(e) => updateVolume(device.id, device.sink!, parseInt(e.target.value))}
                              className={`w-full h-1.5 bg-neutral-900 rounded-full appearance-none cursor-pointer ${device.type === 'source' ? 'accent-orange-500' : 'accent-blue-600'}`} 
                            />
                            {/* Simulated Signal Meter */}
                            <div className="absolute bottom-0 left-0 w-full flex gap-1 opacity-60">
                              {[...Array(24)].map((_, i) => (
                                <motion.div 
                                  key={i}
                                  animate={{ 
                                    height: Math.random() * 6 + 2,
                                    backgroundColor: i > 20 ? '#ef4444' : i > 16 ? '#f59e0b' : i > 12 ? '#3b82f6' : '#2C2E33'
                                  }}
                                  transition={{ duration: 0.15, repeat: Infinity, repeatType: 'reverse', delay: i * 0.04 }}
                                  className="w-[3px] rounded-full"
                                />
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Latency Control */}
                        <div className="space-y-2.5">
                          <div className="flex justify-between text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-widest">
                            <span className="flex items-center gap-2"><Clock className="w-3.5 h-3.5" /> Alignment Offset</span>
                            <span className={device.latency_ms > 0 ? 'text-orange-400' : 'text-neutral-400'}>
                              {device.latency_ms > 0 ? `+${device.latency_ms}ms` : '0.00ms'}
                            </span>
                          </div>
                          <input 
                            type="range" 
                            min="0" 
                            max="500" 
                            value={device.latency_ms} 
                            onChange={(e) => updateLatency(device.id, device.sink!, parseInt(e.target.value))}
                            className="w-full h-1.5 bg-neutral-900 rounded-full appearance-none cursor-pointer accent-orange-600" 
                          />
                        </div>
                      </div>

                      <div className="flex gap-3 mt-2">
                         <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleMute(device.id, device.sink!)
                          }}
                          className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl border transition-all ${
                            device.muted 
                              ? 'bg-red-500/20 text-red-500 border-red-500/30' 
                              : 'bg-[#1A1B1E] text-neutral-500 border-[#2C2E33] hover:text-white hover:border-neutral-600'
                          }`}
                         >
                          {device.muted ? 'MUTED' : 'MUTE'}
                         </button>
                         <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSolo(device.id)
                          }}
                          className="flex-1 py-2.5 bg-[#1A1B1E] text-neutral-500 text-[10px] font-black uppercase tracking-widest rounded-xl border border-[#2C2E33] hover:text-blue-500 hover:border-blue-600/30 transition-all"
                         >
                          SOLO
                         </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.section>
            )}
          </AnimatePresence>
        </>
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        .scroller::-webkit-scrollbar { width: 4px; height: 4px; }
        .scroller::-webkit-scrollbar-track { background: transparent; }
        .scroller::-webkit-scrollbar-thumb { background: #2C2E33; border-radius: 20px; }
        .scroller::-webkit-scrollbar-thumb:hover { background: #3B82F6; }
        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          border: 3px solid currentColor;
          box-shadow: 0 0 10px rgba(0,0,0,0.5);
        }
      `}} />
    </div>
  );
}
