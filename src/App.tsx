import React, { useState, useEffect, useCallback } from 'react';
import { 
  Headphones, 
  Trash2, 
  Layers,
  Volume2,
  VolumeX,
  Clock,
  CheckCircle2,
  Mic,
  Zap,
  Bluetooth,
  BluetoothSearching,
  Plus,
  ShieldCheck,
  Unplug,
  AlertTriangle,
  Monitor
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Device, AudioState } from './types';
import { isWebBluetoothSupported, requestBluetoothDevice } from './bluetooth';

export default function App() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [hasPermission, setHasPermission] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [btNotAvailable, setBtNotAvailable] = useState(false);
  const [status, setStatus] = useState<AudioState>({
    defaultSink: 'Web Audio',
    combinedStatus: 'inactive',
    latency: 0,
    syncStatus: 'synced'
  });

  const scanForDevice = useCallback(async () => {
    setScanning(true);
    setError(null);
    try {
      const device = await requestBluetoothDevice();
      if (device) {
        setDevices(prev => {
          const exists = prev.find(d => d.name === device.name);
          if (exists) {
            return prev.map(d => d.name === device.name ? { ...d, ...device, id: d.id } : d);
          }
          return [...prev, device];
        });
        setHasPermission(true);
      }
    } catch (err: any) {
      if (err.message === 'WEB_BLUETOOTH_NOT_AVAILABLE') {
        setBtNotAvailable(true);
      } else {
        setError(err.message || 'Bluetooth qurilma topishda xatolik yuz berdi');
      }
    } finally {
      setScanning(false);
    }
  }, []);

  const updateVolume = (id: string, volume: number) => {
    setDevices(prev => prev.map(d => d.id === id ? { ...d, volume } : d));
  };

  const updateLatency = (id: string, latency: number) => {
    setDevices(prev => prev.map(d => d.id === id ? { ...d, latency_ms: latency } : d));
  };

  const toggleMute = (id: string) => {
    setDevices(prev => prev.map(d => d.id === id ? { ...d, muted: !d.muted } : d));
  };

  const toggleSolo = (id: string) => {
    setDevices(prev => prev.map(d => {
      if (selectedIds.includes(d.id)) {
        return { ...d, muted: d.id !== id };
      }
      return d;
    }));
  };

  const toggleDevice = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleCombine = () => {
    setStatus(prev => ({ ...prev, combinedStatus: 'active' }));
  };

  const handleReset = () => {
    setStatus(prev => ({ ...prev, combinedStatus: 'inactive' }));
    setSelectedIds([]);
  };

  const removeDevice = (id: string) => {
    setDevices(prev => prev.filter(d => d.id !== id));
    setSelectedIds(prev => prev.filter(i => i !== id));
  };

  // ============= WELCOME / PERMISSION SCREEN =============
  if (!hasPermission) {
    return (
      <div className="flex h-screen w-full bg-[#0C0D10] text-[#E0E0E0] items-center justify-center p-6 font-sans">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="max-w-lg w-full flex flex-col items-center text-center gap-8"
        >
          {/* Logo */}
          <motion.div 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative"
          >
            <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-600/30">
              <Bluetooth className="w-12 h-12 text-white" />
            </div>
            <motion.div 
              animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 w-24 h-24 bg-blue-600/20 rounded-3xl"
            />
          </motion.div>

          {/* Title */}
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl font-black tracking-tight text-white">BlueSync</h1>
            <p className="text-sm text-neutral-500 font-medium leading-relaxed max-w-sm">
              Bluetooth audio qurilmalaringizni brauzer orqali boshqaring. Bir nechta qurilmani sinxronlashtiring va ovoz sozlamalarini real vaqtda o'zgartiring.
            </p>
          </div>

          {/* Permission Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="w-full bg-[#151619] border-2 border-[#2C2E33] rounded-3xl p-6 space-y-5"
          >
            <div className="flex items-center gap-3 text-left">
              <div className="p-3 bg-blue-600/10 rounded-2xl">
                <ShieldCheck className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Bluetooth ruxsati kerak</h3>
                <p className="text-xs text-neutral-500">
                  Qurilmalarni topish uchun brauzer sizdan ruxsat so'raydi
                </p>
              </div>
            </div>

            <div className="space-y-2 text-left">
              <div className="flex items-center gap-3 text-[11px] text-neutral-400">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Yaqin atrofdagi Bluetooth qurilmalarni qidirish</span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-neutral-400">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Qurilmalarga ulanish va ma'lumot olish</span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-neutral-400">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Ma'lumotlaringiz xavfsiz — faqat brauzeringizda ishlanadi</span>
              </div>
            </div>

            {/* Scan Button */}
            <button 
              onClick={scanForDevice}
              disabled={scanning}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-bold rounded-2xl shadow-xl shadow-blue-600/30 transition-all active:scale-[0.98] flex items-center justify-center gap-3 text-sm uppercase tracking-widest"
            >
              {scanning ? (
                <>
                  <BluetoothSearching className="w-5 h-5 animate-pulse" />
                  Qidirilmoqda...
                </>
              ) : (
                <>
                  <Bluetooth className="w-5 h-5" />
                  Bluetooth qurilma qidirish
                </>
              )}
            </button>

            {/* BT Not Available — VirtualBox xabari */}
            <AnimatePresence>
              {btNotAvailable && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4 space-y-3"
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                    <div className="text-left space-y-2">
                      <p className="text-xs text-orange-300 font-bold">Bluetooth mavjud emas</p>
                      <p className="text-[11px] text-orange-400/70 leading-relaxed">
                        Bu ilovani VirtualBox virtual mashinasida ishlatib bo'lmaydi, chunki virtual mashinada Bluetooth adapteri mavjud emas.
                      </p>
                      <p className="text-[11px] text-orange-400/70 leading-relaxed">
                        Iltimos, ilovani <span className="text-white font-bold">haqiqiy kompyuterda</span> Chrome yoki Edge brauzeridan oching. Bluetooth adapteri bo'lgan tizimda to'g'ri ishlaydi.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* General Error */}
            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-2xl p-4"
                >
                  <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-400 text-left">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <p className="text-[10px] text-neutral-600 uppercase tracking-widest">
            Chrome yoki Edge brauzerida ishlaydi • HTTPS kerak
          </p>
        </motion.div>
      </div>
    );
  }

  // ============= MAIN APP =============
  return (
    <div className="flex h-screen w-full bg-[#0C0D10] text-[#E0E0E0] overflow-hidden p-3 gap-3 font-sans">
      <main className="flex-1 flex flex-col gap-3 min-w-0">
        <>
          {/* Header */}
          <header className="flex items-center justify-between bg-[#151619] p-4 rounded-2xl border border-[#2C2E33] shadow-lg">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-black text-white shadow-lg shadow-blue-600/30 text-xl">B</div>
                <div className="flex flex-col">
                  <span className="text-lg font-black tracking-tighter text-white">BlueSync</span>
                  <span className="text-[10px] font-mono text-blue-500 font-bold uppercase tracking-[0.2em]">Web Bluetooth</span>
                </div>
              </div>
              <div className="h-8 w-px bg-[#2C2E33] mx-2 hidden sm:block" />
              <div className="hidden sm:flex gap-2">
                <button 
                  onClick={scanForDevice}
                  disabled={scanning}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white rounded-xl transition-all active:scale-95 text-xs font-bold uppercase tracking-wider"
                >
                  {scanning ? <BluetoothSearching className="w-4 h-4 animate-pulse" /> : <Plus className="w-4 h-4" />}
                  Qurilma qo'shish
                </button>
                <button 
                  onClick={handleReset}
                  className="p-2 bg-[#1A1B1E] hover:bg-red-500/10 text-neutral-500 hover:text-red-500 rounded-xl border border-[#2C2E33] transition-all active:scale-95"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-[#0C0D10] px-4 py-2 rounded-2xl border border-[#2C2E33]">
              <div className={`w-2 h-2 rounded-full ${status.combinedStatus === 'active' ? 'bg-blue-500 animate-pulse' : 'bg-emerald-500'}`}></div>
              <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">
                {devices.length} ta qurilma
              </span>
            </div>
          </header>

          {/* Error Banner */}
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  <span className="text-sm text-red-400">{error}</span>
                </div>
                <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300 text-xs font-bold uppercase">Yopish</button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Device Grid */}
          <div className="flex-1 flex flex-col gap-3 min-h-0">
            <section className="flex-1 flex flex-col gap-3 min-h-0 overflow-y-auto pr-1 select-none">
              <div className="flex items-center justify-between px-1 shrink-0">
                <h2 className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Audio Interfeyslar ({devices.length})</h2>
                {selectedIds.length > 0 && (
                  <span className="text-[10px] text-blue-400 font-mono font-bold animate-pulse">{selectedIds.length} TA TANLANDI</span>
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
                      onClick={() => toggleDevice(device.id)}
                      className={`bg-[#151619] p-5 rounded-2xl flex flex-col gap-4 relative overflow-hidden transition-all duration-300 group cursor-pointer border-2 ${
                        selectedIds.includes(device.id)
                          ? 'border-blue-600 bg-blue-600/5 shadow-[0_0_20px_rgba(37,99,235,0.1)]'
                          : 'border-[#2C2E33] hover:border-neutral-700'
                      }`}
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

                {/* Add Device Card */}
                <motion.div 
                  layout
                  onClick={scanForDevice}
                  className="border-2 border-dashed border-[#2C2E33] hover:border-blue-600/50 rounded-2xl p-5 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all hover:bg-blue-600/5 min-h-[150px] group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-[#151619] border border-[#2C2E33] group-hover:border-blue-600/30 flex items-center justify-center transition-all">
                    {scanning ? (
                      <BluetoothSearching className="w-6 h-6 text-blue-400 animate-pulse" />
                    ) : (
                      <Plus className="w-6 h-6 text-neutral-600 group-hover:text-blue-400 transition-colors" />
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold text-neutral-500 group-hover:text-blue-400 uppercase tracking-widest transition-colors">
                      {scanning ? 'Qidirilmoqda...' : 'Qurilma qo\'shish'}
                    </p>
                    <p className="text-[10px] text-neutral-600 mt-1">Bluetooth qurilmani ulash</p>
                  </div>
                </motion.div>
                
                {devices.length === 0 && (
                   <div className="col-span-full py-20 flex flex-col items-center justify-center text-neutral-600 border-2 border-dashed border-[#2C2E33] rounded-3xl">
                      <Zap className="w-12 h-12 mb-4 opacity-20" />
                      <p className="text-sm font-bold uppercase tracking-widest">Qurilmalar topilmadi</p>
                      <p className="text-[10px] uppercase tracking-tighter mt-1">"Qurilma qo'shish" tugmasini bosing</p>
                   </div>
                )}
              </div>
            </section>
          </div>

          {/* Floating Action */}
          {selectedIds.length > 0 && selectedIds.length < 2 && (
             <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50">
                <div className="bg-[#1A1B1E] border border-blue-500/30 px-6 py-3 rounded-full shadow-2xl flex items-center gap-4">
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
                   className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-full shadow-[0_10px_40px_rgba(37,99,235,0.4)] flex items-center gap-3 active:scale-95 transition-all"
                >
                   <Layers className="w-5 h-5" />
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
                             <span className="text-[10px] text-neutral-600 font-mono tracking-tighter uppercase">{device.profile || 'VIRTUAL_STREAM'}</span>
                           </div>
                        </div>
                        <button 
                          onClick={() => removeDevice(device.id)}
                          className="p-2 hover:bg-red-500/10 text-neutral-700 hover:text-red-500 transition-all rounded-xl"
                        >
                          <Unplug className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="space-y-6">
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
                              type="range" min="0" max="150" 
                              value={device.volume} 
                              onChange={(e) => updateVolume(device.id, parseInt(e.target.value))}
                              className={`w-full h-1.5 bg-neutral-900 rounded-full appearance-none cursor-pointer ${device.type === 'source' ? 'accent-orange-500' : 'accent-blue-600'}`} 
                            />
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

                        <div className="space-y-2.5">
                          <div className="flex justify-between text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-widest">
                            <span className="flex items-center gap-2"><Clock className="w-3.5 h-3.5" /> Alignment Offset</span>
                            <span className={device.latency_ms > 0 ? 'text-orange-400' : 'text-neutral-400'}>
                              {device.latency_ms > 0 ? `+${device.latency_ms}ms` : '0.00ms'}
                            </span>
                          </div>
                          <input 
                            type="range" min="0" max="500" 
                            value={device.latency_ms} 
                            onChange={(e) => updateLatency(device.id, parseInt(e.target.value))}
                            className="w-full h-1.5 bg-neutral-900 rounded-full appearance-none cursor-pointer accent-orange-600" 
                          />
                        </div>
                      </div>

                      <div className="flex gap-3 mt-2">
                         <button 
                          onClick={(e) => { e.stopPropagation(); toggleMute(device.id); }}
                          className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl border transition-all ${
                            device.muted 
                              ? 'bg-red-500/20 text-red-500 border-red-500/30' 
                              : 'bg-[#1A1B1E] text-neutral-500 border-[#2C2E33] hover:text-white hover:border-neutral-600'
                          }`}
                         >
                          {device.muted ? 'MUTED' : 'MUTE'}
                         </button>
                         <button 
                          onClick={(e) => { e.stopPropagation(); toggleSolo(device.id); }}
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
