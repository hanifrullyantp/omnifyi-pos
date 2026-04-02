import { useState, useEffect, useCallback } from 'react';
import { 
  Clock, 
  CheckCircle2, 
  MapPin,
  MapPinOff,
  Navigation,
  Loader2,
  Crosshair,
  ShieldCheck,
  ShieldAlert, 
  LayoutDashboard, 
  Calendar,
  AlertCircle,
  ChevronRight, 
  Timer,
  CheckCircle,
  PlayCircle,
  LogOut,
  Image as ImageIcon,
  FileText,
  Bell,
  Target,
  Heart,
  Shield,
  TrendingUp,
  Wallet,
  Building2,
  Award,
  CalendarDays,
  History,
  Download,
  ChevronDown,
  Sparkles,
  BookOpen,
  Info,
  Plus,
  Send,
  Hourglass,
  Coffee,
  Briefcase,
  X,
  Camera,
  Paperclip
} from 'lucide-react';
import { useData, type Task } from '../store/dataStore';
import { cn } from '../lib/utils';
import { TaskDetailModal } from './ProjectDetail';

type DashboardTab = 'home' | 'tasks' | 'attendance' | 'salary' | 'company';

export function EmployeeDashboard() {
  const { 
    currentUser, 
    attendance, 
    checkIn, 
    checkOut, 
    projects, 
    updateTask,
    addWorkLog,
    employees,
    companyInfo,
    policies,
    announcements,
    employeeDocuments,
    getMyPayroll,
    getMyAttendanceHistory,
    getCurrentMonthSalaryEstimate,
    getWorkHoursSummary,
    getMyLeaveRequests,
    getLeaveBalance,
    submitLeave,
  } = useData();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskUpdate, setShowTaskUpdate] = useState<string | null>(null);
  const [updateText, setUpdateText] = useState('');
  const [updatePhotos, setUpdatePhotos] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<DashboardTab>('home');
  const [expandedPolicy, setExpandedPolicy] = useState<string | null>(null);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    type: 'Annual' as 'Annual' | 'Sick' | 'Emergency' | 'Unpaid' | 'Izin',
    startDate: '',
    endDate: '',
    reason: '',
  });
  const [workHoursPeriod, setWorkHoursPeriod] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  
  // GPS & Location State
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'requesting' | 'success' | 'error' | 'denied'>('idle');
  const [currentLocation, setCurrentLocation] = useState<{
    lat: number;
    long: number;
    accuracy: number;
    address?: string;
    isInWorkArea?: boolean;
    timestamp?: Date;
  } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [showSelfieCapture, setShowSelfieCapture] = useState(false);
  const [capturedSelfie, setCapturedSelfie] = useState<string | null>(null);

  // Work areas (configurable by admin)
  const WORK_AREAS = [
    { name: 'Kantor Pusat', lat: -6.2088, long: 106.8456, radius: 500 }, // 500m radius
    { name: 'Site Project A', lat: -6.2200, long: 106.8500, radius: 1000 },
    { name: 'Gudang Material', lat: -6.1900, long: 106.8200, radius: 300 },
  ];

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }, []);

  // Check if location is within any work area
  const checkWorkArea = useCallback((lat: number, long: number): { isInArea: boolean; nearestArea?: string; distance?: number } => {
    for (const area of WORK_AREAS) {
      const distance = calculateDistance(lat, long, area.lat, area.long);
      if (distance <= area.radius) {
        return { isInArea: true, nearestArea: area.name, distance: Math.round(distance) };
      }
    }
    // Find nearest area
    const nearest = WORK_AREAS.reduce((prev, curr) => {
      const prevDist = calculateDistance(lat, long, prev.lat, prev.long);
      const currDist = calculateDistance(lat, long, curr.lat, curr.long);
      return currDist < prevDist ? curr : prev;
    });
    const nearestDist = calculateDistance(lat, long, nearest.lat, nearest.long);
    return { isInArea: false, nearestArea: nearest.name, distance: Math.round(nearestDist) };
  }, [calculateDistance]);

  // Request GPS location
  const requestLocation = useCallback(() => {
    setGpsStatus('requesting');
    setLocationError(null);

    if (!navigator.geolocation) {
      setGpsStatus('error');
      setLocationError('GPS tidak didukung di perangkat ini');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const workAreaCheck = checkWorkArea(latitude, longitude);
        
        setCurrentLocation({
          lat: latitude,
          long: longitude,
          accuracy: Math.round(accuracy),
          isInWorkArea: workAreaCheck.isInArea,
          address: workAreaCheck.nearestArea,
          timestamp: new Date(),
        });
        setGpsStatus('success');
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setGpsStatus('denied');
            setLocationError('Izin lokasi ditolak. Silakan aktifkan GPS.');
            break;
          case error.POSITION_UNAVAILABLE:
            setGpsStatus('error');
            setLocationError('Lokasi tidak tersedia. Periksa koneksi GPS.');
            break;
          case error.TIMEOUT:
            setGpsStatus('error');
            setLocationError('Waktu permintaan habis. Coba lagi.');
            break;
          default:
            setGpsStatus('error');
            setLocationError('Gagal mendapatkan lokasi.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  }, [checkWorkArea]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!currentUser) return null;

  const today = new Date().toISOString().split('T')[0];
  const todayAttendance = attendance.find(a => a.userId === currentUser.id && a.date === today);

  // Mapping assignee name to userId for initial demo data
  const myTasks = projects.flatMap(p => 
    p.tasks.filter(t => {
      const firstName = currentUser.name.split(' ')[0];
      return t.assignee === currentUser.id || t.assignee === currentUser.name || t.assignee === firstName;
    })
      .map(t => ({ ...t, projectName: p.name }))
  ).sort((a, b) => {
    const priorityMap = { Urgent: 0, High: 1, Medium: 2, Low: 3 };
    return (priorityMap[a.priority as keyof typeof priorityMap] || 0) - (priorityMap[b.priority as keyof typeof priorityMap] || 0);
  });

  // Enhanced check-in with real GPS
  const handleCheckIn = useCallback(() => {
    setIsCheckingIn(true);
    setGpsStatus('requesting');
    setLocationError(null);

    if (!navigator.geolocation) {
      // Fallback for devices without GPS
      setTimeout(() => {
        checkIn(
          { lat: -6.2088, long: 106.8456 }, 
          capturedSelfie || "https://api.dicebear.com/7.x/avataaars/svg?seed=selfie", 
          "Check-in (GPS tidak tersedia)"
        );
        setIsCheckingIn(false);
        setGpsStatus('error');
      }, 1500);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const workAreaCheck = checkWorkArea(latitude, longitude);
        
        setCurrentLocation({
          lat: latitude,
          long: longitude,
          accuracy: Math.round(accuracy),
          isInWorkArea: workAreaCheck.isInArea,
          address: workAreaCheck.nearestArea,
          timestamp: new Date(),
        });
        setGpsStatus('success');

        // Perform check-in
        const locationNote = workAreaCheck.isInArea 
          ? `Check-in di ${workAreaCheck.nearestArea} (${workAreaCheck.distance}m)`
          : `Check-in di luar area kerja (${workAreaCheck.distance}m dari ${workAreaCheck.nearestArea})`;
        
        checkIn(
          { lat: latitude, long: longitude },
          capturedSelfie || "https://api.dicebear.com/7.x/avataaars/svg?seed=selfie",
          locationNote
        );
        setIsCheckingIn(false);
        setCapturedSelfie(null);
      },
      (error) => {
        // Fallback on GPS error - still allow check-in but mark it
        console.warn('GPS Error:', error.message);
        setGpsStatus('error');
        setLocationError(error.message);
        
        // Still allow check-in with approximate location
        setTimeout(() => {
          checkIn(
            { lat: -6.2088, long: 106.8456 }, 
            capturedSelfie || "https://api.dicebear.com/7.x/avataaars/svg?seed=selfie", 
            "Check-in (lokasi tidak akurat)"
          );
          setIsCheckingIn(false);
        }, 1000);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  }, [checkIn, capturedSelfie, checkWorkArea]);

  // Handle selfie capture simulation
  const handleCaptureSelfie = useCallback(() => {
    setShowSelfieCapture(true);
    // Simulate camera capture
    setTimeout(() => {
      setCapturedSelfie(`https://api.dicebear.com/7.x/avataaars/svg?seed=${Date.now()}`);
      setShowSelfieCapture(false);
    }, 2000);
  }, []);

  const handleUpdateTask = (taskId: string, status: any) => {
    if (!updateText.trim()) return;
    
    addWorkLog({
      taskId,
      description: updateText,
      photos: updatePhotos,
      statusUpdate: status
    });

    setUpdateText('');
    setUpdatePhotos([]);
    setShowTaskUpdate(null);
  };

  const handleAddPhoto = () => {
    if (updatePhotos.length >= 3) return;
    const newPhoto = `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 1000000000)}?w=400&h=400&fit=crop`;
    setUpdatePhotos(prev => [...prev, newPhoto]);
  };

  const calculateWorkHours = (start?: string, end?: string) => {
    if (!start) return '--:--';
    const startTime = new Date(`${today} ${start.replace(/\./g, ':')}`);
    const endTime = end ? new Date(`${today} ${end.replace(/\./g, ':')}`) : new Date();
    const diff = Math.max(0, endTime.getTime() - startTime.getTime());
    const hours = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    return `${hours}j ${mins}m`;
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto pb-24">
      {/* Header Greeting */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Selamat {currentTime.getHours() < 12 ? 'Pagi' : currentTime.getHours() < 15 ? 'Siang' : currentTime.getHours() < 18 ? 'Sore' : 'Malam'}, {currentUser.name.split(' ')[0]}!</h1>
          <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5" />
            {new Intl.DateTimeFormat('id-ID', { dateStyle: 'full' }).format(currentTime)}
          </p>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 bg-brand-50 rounded-xl border border-brand-100">
          <Clock className="w-5 h-5 text-brand-600 animate-pulse" />
          <div className="font-mono text-xl font-bold text-brand-700">
            {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
        </div>
      </div>

      {/* Attendance Widget */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-50 flex items-center justify-between">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <Timer className="w-5 h-5 text-brand-600" />
              Absensi Hari Ini
            </h2>
            {todayAttendance && (
              <span className={cn(
                "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                todayAttendance.status === 'Present' ? "bg-emerald-100 text-emerald-700" : 
                todayAttendance.status === 'Late' ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
              )}>
                {todayAttendance.status}
              </span>
            )}
          </div>
          <div className="p-6">
            {!todayAttendance ? (
              <div className="flex flex-col items-center justify-center py-4 space-y-4">
                <div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center">
                  <MapPin className="w-8 h-8 text-brand-500" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-gray-900">Belum Absen</p>
                  <p className="text-xs text-gray-500 mt-1">Silakan check-in untuk mulai bekerja</p>
                </div>
                <button 
                  onClick={handleCheckIn}
                  disabled={isCheckingIn}
                  className="w-full max-w-xs py-3.5 bg-brand-600 text-white rounded-xl font-bold shadow-lg shadow-brand-500/30 flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {isCheckingIn ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <PlayCircle className="w-5 h-5" />
                      Check-In Sekarang
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Check-In</p>
                    <p className="text-lg font-bold text-gray-900">{todayAttendance.checkInTime || '--:--'}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Check-Out</p>
                    <p className="text-lg font-bold text-gray-900">{todayAttendance.checkOutTime || '--:--'}</p>
                  </div>
                </div>

                {!todayAttendance.checkOutTime ? (
                  <button 
                    onClick={() => checkOut("Selesai kerja")}
                    className="w-full py-3.5 bg-rose-500 text-white rounded-xl font-bold shadow-lg shadow-rose-500/30 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                  >
                    <LogOut className="w-5 h-5" />
                    Check-Out
                  </button>
                ) : (
                  <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                    <div>
                      <p className="text-sm font-bold text-emerald-800">Kerja Selesai!</p>
                      <p className="text-xs text-emerald-600">Sampai jumpa besok.</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Work Hours Stats */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col justify-center items-center text-center space-y-3">
          <div className="w-20 h-20 rounded-full border-4 border-brand-500/20 border-t-brand-500 flex items-center justify-center animate-spin-slow">
            <span className="animate-none font-bold text-gray-900 text-xl">
              {todayAttendance ? calculateWorkHours(todayAttendance.checkInTime, todayAttendance.checkOutTime) : '0j'}
            </span>
          </div>
          <div>
            <h3 className="font-bold text-gray-900 uppercase text-xs tracking-widest">Waktu Kerja</h3>
            <p className="text-gray-500 text-[10px] mt-1">Total jam kerja anda hari ini</p>
          </div>
          <div className="w-full pt-4 grid grid-cols-2 gap-2">
            <div className="flex flex-col p-2 bg-gray-50 rounded-lg">
              <span className="text-[9px] font-bold text-gray-400 uppercase">Lembur</span>
              <span className="text-sm font-bold text-gray-900">0j 0m</span>
            </div>
            <div className="flex flex-col p-2 bg-gray-50 rounded-lg">
              <span className="text-[9px] font-bold text-gray-400 uppercase">Break</span>
              <span className="text-sm font-bold text-gray-900">1j 0m</span>
            </div>
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-brand-600" />
            Tugas Saya
          </h2>
          <span className="text-xs font-medium text-gray-500">{myTasks.length} Tugas Total</span>
        </div>

        <div className="space-y-3">
          {myTasks.length > 0 ? myTasks.map(task => (
            <div key={task.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:border-brand-300 transition-all group">
              <div className="p-5 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                      task.priority === 'Urgent' ? "bg-rose-100 text-rose-700" :
                      task.priority === 'High' ? "bg-amber-100 text-amber-700" :
                      "bg-blue-100 text-blue-700"
                    )}>
                      {task.priority}
                    </span>
                    <span className="text-[10px] font-bold text-brand-600 uppercase tracking-widest">{task.projectName}</span>
                  </div>
                  <h3 className="font-bold text-gray-900 truncate">{task.title}</h3>
                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Calendar className="w-3.5 h-3.5" />
                      {task.dueDate}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <LayoutDashboard className="w-3.5 h-3.5" />
                      {task.status}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <button 
                    onClick={() => setSelectedTask(task as any)}
                    className="p-2 bg-gray-50 text-gray-400 hover:bg-brand-50 hover:text-brand-600 rounded-xl transition-all"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Quick Actions for Task */}
              <div className="px-5 pb-5 pt-0 flex gap-2">
                <button 
                  onClick={() => setShowTaskUpdate(task.id)}
                  className={cn(
                    "flex-1 py-2 text-xs font-bold rounded-lg border transition-all",
                    showTaskUpdate === task.id ? "bg-brand-50 border-brand-100 text-brand-600" : "bg-white border-gray-100 text-gray-500 hover:border-brand-200 hover:text-brand-600"
                  )}
                >
                  Update Progres
                </button>
                <button 
                  onClick={() => updateTask(task.projectId, task.id, { status: 'Done' })}
                  disabled={task.status === 'Done'}
                  className={cn(
                    "flex-1 py-2 text-xs font-bold rounded-lg border transition-all",
                    task.status === 'Done' ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-white border-gray-100 text-gray-500 hover:border-emerald-200 hover:text-emerald-600"
                  )}
                >
                  Selesai
                </button>
              </div>

              {/* Task Update Modal-like Inline */}
              {showTaskUpdate === task.id && (
                <div className="bg-gray-50 p-5 border-t border-gray-100 space-y-4 animate-slide-in-top">
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Laporan Pekerjaan</label>
                    <textarea 
                      value={updateText}
                      onChange={(e) => setUpdateText(e.target.value)}
                      placeholder="Apa yang telah anda lakukan hari ini? Tambahkan catatan progres..."
                      className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all resize-none h-24"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Foto Bukti (Maks 3)</label>
                    <div className="flex gap-2">
                      {updatePhotos.map((p, i) => (
                        <div key={i} className="relative w-14 h-14 rounded-lg overflow-hidden border border-gray-200">
                          <img src={p} alt="" className="w-full h-full object-cover" />
                          <button 
                            onClick={() => setUpdatePhotos(prev => prev.filter((_, idx) => idx !== i))}
                            className="absolute top-0 right-0 p-0.5 bg-black/50 text-white rounded-bl"
                          >
                            <LogOut className="w-2.5 h-2.5 rotate-45" />
                          </button>
                        </div>
                      ))}
                      {updatePhotos.length < 3 && (
                        <button 
                          onClick={handleAddPhoto}
                          className="w-14 h-14 rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 hover:border-brand-300 hover:text-brand-500 transition-all"
                        >
                          <ImageIcon className="w-4 h-4" />
                          <span className="text-[8px] font-bold mt-1">Upload</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => setShowTaskUpdate(null)}
                      className="flex-1 py-2.5 bg-white text-gray-500 font-bold rounded-xl border border-gray-200 text-sm active:scale-95 transition-all"
                    >
                      Batal
                    </button>
                    <button 
                      onClick={() => handleUpdateTask(task.id, task.status)}
                      className="flex-1 py-2.5 bg-brand-600 text-white font-bold rounded-xl shadow-lg shadow-brand-500/20 text-sm active:scale-95 transition-all"
                    >
                      Kirim Laporan
                    </button>
                  </div>
                </div>
              )}
            </div>
          )) : (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 py-12 flex flex-col items-center justify-center space-y-3">
              <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-gray-300" />
              </div>
              <div className="text-center">
                <p className="font-bold text-gray-900">Semua Tugas Beres!</p>
                <p className="text-xs text-gray-500">Belum ada tugas baru yang di-assign untuk anda.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl overflow-x-auto scrollbar-hide">
        {[
          { id: 'home', label: 'Beranda', icon: LayoutDashboard },
          { id: 'attendance', label: 'Absensi', icon: CalendarDays },
          { id: 'salary', label: 'Gaji', icon: Wallet },
          { id: 'company', label: 'Perusahaan', icon: Building2 },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as DashboardTab)}
            className={cn(
              "flex-1 min-w-[80px] flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all whitespace-nowrap",
              activeTab === tab.id 
                ? "bg-white text-brand-600 shadow-sm" 
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            <tab.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* HOME TAB — Quick Access & Announcements */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'home' && (
        <div className="space-y-6">
          {/* Quick Access Grid */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Absensi', icon: CalendarDays, color: 'bg-brand-50 text-brand-600', onClick: () => setActiveTab('attendance') },
              { label: 'Slip Gaji', icon: Wallet, color: 'bg-amber-50 text-amber-600', onClick: () => setActiveTab('salary') },
              { label: 'Kebijakan', icon: BookOpen, color: 'bg-indigo-50 text-indigo-600', onClick: () => setActiveTab('company') },
              { label: 'Dokumen', icon: FileText, color: 'bg-emerald-50 text-emerald-600', onClick: () => setActiveTab('company') },
            ].map(item => (
              <button
                key={item.label}
                onClick={item.onClick}
                className="p-3 bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col items-center justify-center space-y-1.5 hover:border-brand-300 transition-all active:scale-95"
              >
                <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", item.color)}>
                  <item.icon className="w-4.5 h-4.5" />
                </div>
                <span className="text-[10px] font-bold text-gray-700">{item.label}</span>
              </button>
            ))}
          </div>

          {/* Announcements */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-50 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Bell className="w-4 h-4 text-brand-600" />
                Pengumuman Perusahaan
              </h3>
              <span className="text-[10px] font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">
                {announcements.length} Baru
              </span>
            </div>
            <div className="divide-y divide-gray-50">
              {announcements.slice(0, 3).map(ann => (
                <div key={ann.id} className="p-4 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0",
                      ann.type === 'Celebration' ? "bg-emerald-100 text-emerald-600" :
                      ann.type === 'Warning' ? "bg-amber-100 text-amber-600" :
                      ann.type === 'Urgent' ? "bg-rose-100 text-rose-600" :
                      "bg-blue-100 text-blue-600"
                    )}>
                      {ann.type === 'Celebration' ? <Sparkles className="w-4 h-4" /> :
                       ann.type === 'Warning' ? <AlertCircle className="w-4 h-4" /> :
                       ann.type === 'Urgent' ? <AlertCircle className="w-4 h-4" /> :
                       <Info className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-gray-900 text-sm truncate">{ann.title}</h4>
                        {ann.pinned && <span className="text-[8px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">PINNED</span>}
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-2">{ann.content.split('\n')[0]}</p>
                      <p className="text-[10px] text-gray-400 mt-1">
                        {ann.authorName} · {new Date(ann.publishedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* My Profile Card */}
          {(() => {
            const emp = employees.find(e => e.userId === currentUser?.id);
            return emp ? (
              <div className="bg-gradient-to-br from-brand-500 to-brand-600 rounded-2xl p-5 text-white">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center text-xl font-bold">
                    {currentUser?.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">{currentUser?.name}</h3>
                    <p className="text-brand-100 text-sm">{emp.position}</p>
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-brand-200">
                      <span className="flex items-center gap-1">
                        <Award className="w-3 h-3" />
                        Bergabung {new Date(emp.joinDate).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}
                      </span>
                      <span className={cn(
                        "px-1.5 py-0.5 rounded-full font-bold",
                        emp.status === 'Active' ? "bg-emerald-500/30 text-emerald-100" : "bg-rose-500/30 text-rose-100"
                      )}>
                        {emp.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : null;
          })()}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* ATTENDANCE TAB — Enhanced Attendance Module with GPS */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'attendance' && (
        <div className="space-y-4">
          {/* Today's Check-in Hero Card */}
          <div className="bg-gradient-to-br from-brand-600 via-brand-500 to-emerald-500 rounded-2xl overflow-hidden shadow-lg shadow-brand-500/20">
            {/* Time & Date Header */}
            <div className="px-5 pt-5 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-brand-100 text-xs font-medium">
                    {currentTime.toLocaleDateString('id-ID', { weekday: 'long' })}
                  </p>
                  <p className="text-white text-lg font-bold">
                    {currentTime.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <div className="text-right">
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
                    <p className="text-3xl font-bold font-mono text-white tracking-tight">
                      {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-[10px] text-brand-100 font-medium">
                      {currentTime.toLocaleTimeString('id-ID', { second: '2-digit' }).slice(-2)} detik
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Status Indicator */}
            <div className="px-5 pb-3">
              {(() => {
                const getStatusConfig = () => {
                  if (!todayAttendance) {
                    return { 
                      label: 'Belum Absen', 
                      sublabel: 'Silakan check-in untuk mulai bekerja', 
                      icon: Clock, 
                      bg: 'bg-white/10',
                      pulse: true 
                    };
                  }
                  if (todayAttendance.checkOutTime) {
                    return { 
                      label: 'Selesai Bekerja', 
                      sublabel: `Kerja ${calculateWorkHours(todayAttendance.checkInTime, todayAttendance.checkOutTime)}`,
                      icon: CheckCircle2, 
                      bg: 'bg-emerald-500/30',
                      pulse: false 
                    };
                  }
                  if (todayAttendance.status === 'Late') {
                    return { 
                      label: 'Sedang Bekerja (Telat)', 
                      sublabel: `Check-in: ${todayAttendance.checkInTime} • ${calculateWorkHours(todayAttendance.checkInTime, undefined)} berjalan`,
                      icon: AlertCircle, 
                      bg: 'bg-amber-500/30',
                      pulse: true 
                    };
                  }
                  return { 
                    label: 'Sedang Bekerja', 
                    sublabel: `Check-in: ${todayAttendance.checkInTime} • ${calculateWorkHours(todayAttendance.checkInTime, undefined)} berjalan`,
                    icon: PlayCircle, 
                    bg: 'bg-emerald-500/30',
                    pulse: true 
                  };
                };
                const status = getStatusConfig();
                const StatusIcon = status.icon;
                return (
                  <div className={cn("rounded-xl p-3 flex items-center gap-3", status.bg)}>
                    <div className={cn("w-10 h-10 rounded-full bg-white/20 flex items-center justify-center", status.pulse && "animate-pulse")}>
                      <StatusIcon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-bold text-sm">{status.label}</p>
                      <p className="text-brand-100 text-xs">{status.sublabel}</p>
                    </div>
                    {todayAttendance?.status === 'Late' && (
                      <span className="px-2 py-1 bg-amber-500 text-white text-[9px] font-bold rounded-full uppercase">Telat</span>
                    )}
                    {todayAttendance && !todayAttendance.checkOutTime && todayAttendance.status !== 'Late' && (
                      <span className="px-2 py-1 bg-emerald-500 text-white text-[9px] font-bold rounded-full uppercase">Hadir</span>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Check-in/out Times */}
            {todayAttendance && (
              <div className="px-5 pb-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/10 rounded-xl p-3 text-center">
                    <p className="text-[10px] text-brand-200 uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
                      <PlayCircle className="w-3 h-3" /> Masuk
                    </p>
                    <p className="text-xl font-bold text-white">{todayAttendance.checkInTime || '--:--'}</p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-3 text-center">
                    <p className="text-[10px] text-brand-200 uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
                      <LogOut className="w-3 h-3" /> Keluar
                    </p>
                    <p className="text-xl font-bold text-white">{todayAttendance.checkOutTime || '--:--'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* GPS & Location Status */}
            <div className="px-5 pb-4">
              <div className={cn(
                "rounded-xl p-3 border",
                gpsStatus === 'success' && currentLocation?.isInWorkArea 
                  ? "bg-emerald-500/20 border-emerald-400/30" 
                  : gpsStatus === 'success' && !currentLocation?.isInWorkArea
                  ? "bg-amber-500/20 border-amber-400/30"
                  : gpsStatus === 'denied' || gpsStatus === 'error'
                  ? "bg-rose-500/20 border-rose-400/30"
                  : "bg-white/10 border-white/20"
              )}>
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center",
                    gpsStatus === 'requesting' && "animate-pulse",
                    gpsStatus === 'success' && currentLocation?.isInWorkArea ? "bg-emerald-500/30" :
                    gpsStatus === 'success' ? "bg-amber-500/30" :
                    gpsStatus === 'denied' || gpsStatus === 'error' ? "bg-rose-500/30" :
                    "bg-white/20"
                  )}>
                    {gpsStatus === 'requesting' ? (
                      <Loader2 className="w-4 h-4 text-white animate-spin" />
                    ) : gpsStatus === 'success' && currentLocation?.isInWorkArea ? (
                      <ShieldCheck className="w-4 h-4 text-emerald-200" />
                    ) : gpsStatus === 'success' ? (
                      <ShieldAlert className="w-4 h-4 text-amber-200" />
                    ) : gpsStatus === 'denied' || gpsStatus === 'error' ? (
                      <MapPinOff className="w-4 h-4 text-rose-200" />
                    ) : (
                      <Crosshair className="w-4 h-4 text-white/70" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-bold">
                      {gpsStatus === 'requesting' ? 'Mendeteksi lokasi...' :
                       gpsStatus === 'success' && currentLocation?.isInWorkArea ? `✓ ${currentLocation.address}` :
                       gpsStatus === 'success' ? `⚠ Di luar area kerja` :
                       gpsStatus === 'denied' ? 'Izin lokasi ditolak' :
                       gpsStatus === 'error' ? 'GPS tidak tersedia' :
                       'Lokasi belum terdeteksi'}
                    </p>
                    <p className="text-brand-100 text-[10px] truncate">
                      {gpsStatus === 'success' && currentLocation ? (
                        <>
                          {currentLocation.lat.toFixed(5)}, {currentLocation.long.toFixed(5)} 
                          {!currentLocation.isInWorkArea && currentLocation.address && ` • ${Math.round((calculateDistance(currentLocation.lat, currentLocation.long, -6.2088, 106.8456) - 500))}m dari area kerja`}
                          {currentLocation.accuracy && ` • Akurasi: ${currentLocation.accuracy}m`}
                        </>
                      ) : gpsStatus === 'denied' ? (
                        'Aktifkan GPS di pengaturan'
                      ) : gpsStatus === 'idle' ? (
                        'Klik tombol di bawah untuk check-in'
                      ) : locationError || 'Mencoba menghubungi GPS...'}
                    </p>
                  </div>
                  {gpsStatus === 'idle' && !todayAttendance && (
                    <button 
                      onClick={requestLocation}
                      className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                    >
                      <Navigation className="w-4 h-4 text-white" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Selfie Preview (if captured) */}
            {capturedSelfie && !todayAttendance && (
              <div className="px-5 pb-4">
                <div className="bg-white/10 rounded-xl p-3 flex items-center gap-3">
                  <img src={capturedSelfie} alt="Selfie" className="w-12 h-12 rounded-lg object-cover border-2 border-white/30" />
                  <div className="flex-1">
                    <p className="text-white text-xs font-bold">Foto Selfie</p>
                    <p className="text-brand-100 text-[10px]">Siap untuk check-in</p>
                  </div>
                  <button onClick={() => setCapturedSelfie(null)} className="p-1.5 bg-white/20 rounded-lg">
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="p-5 pt-0">
              {!todayAttendance ? (
                <div className="space-y-2">
                  {/* Selfie Button */}
                  {!capturedSelfie && (
                    <button
                      onClick={handleCaptureSelfie}
                      disabled={showSelfieCapture}
                      className="w-full py-3 bg-white/20 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-white/30 transition-colors border border-white/20"
                    >
                      {showSelfieCapture ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Mengambil Foto...
                        </>
                      ) : (
                        <>
                          <Camera className="w-4 h-4" />
                          Ambil Foto Selfie
                        </>
                      )}
                    </button>
                  )}
                  {/* Check-in Button */}
                  <button
                    onClick={handleCheckIn}
                    disabled={isCheckingIn}
                    className="w-full py-4 bg-white text-brand-600 rounded-xl font-bold text-base flex items-center justify-center gap-2 hover:bg-brand-50 transition-all shadow-lg disabled:opacity-50 active:scale-[0.98]"
                  >
                    {isCheckingIn ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Memproses Check-In...</span>
                      </>
                    ) : (
                      <>
                        <MapPin className="w-5 h-5" />
                        <span>Check-In Sekarang</span>
                      </>
                    )}
                  </button>
                </div>
              ) : !todayAttendance.checkOutTime ? (
                <button
                  onClick={() => checkOut()}
                  className="w-full py-4 bg-rose-500 text-white rounded-xl font-bold text-base flex items-center justify-center gap-2 hover:bg-rose-600 transition-all shadow-lg active:scale-[0.98]"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Check-Out</span>
                </button>
              ) : (
                <div className="text-center py-3 text-white/80 text-sm flex items-center justify-center gap-2 bg-white/10 rounded-xl">
                  <CheckCircle2 className="w-5 h-5 text-emerald-300" />
                  <span>Absensi hari ini selesai • Sampai jumpa besok!</span>
                </div>
              )}
            </div>

            {/* Verified Location Display (after check-in) */}
            {todayAttendance?.locationLat && (
              <div className="px-5 pb-5">
                <div className="bg-white/10 rounded-lg p-2 flex items-center justify-center gap-2 text-[10px] text-brand-100">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Lokasi terverifikasi: {todayAttendance.locationLat.toFixed(4)}, {todayAttendance.locationLong?.toFixed(4)}</span>
                  {todayAttendance.notes && <span className="text-brand-200">• {todayAttendance.notes}</span>}
                </div>
              </div>
            )}
          </div>

          {/* Work Hours Summary */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-50">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-brand-600" />
                  Ringkasan Jam Kerja
                </h3>
                <div className="flex bg-gray-100 rounded-lg p-0.5">
                  {(['daily', 'weekly', 'monthly'] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => setWorkHoursPeriod(p)}
                      className={cn(
                        "px-2.5 py-1 rounded-md text-[10px] font-bold transition-all",
                        workHoursPeriod === p ? "bg-white text-brand-600 shadow-sm" : "text-gray-500"
                      )}
                    >
                      {p === 'daily' ? 'Hari Ini' : p === 'weekly' ? 'Minggu' : 'Bulan'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {(() => {
              const summary = getWorkHoursSummary(workHoursPeriod);
              return (
                <div className="p-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                    <div className="bg-brand-50 rounded-xl p-3 text-center border border-brand-100">
                      <p className="text-xl font-bold text-brand-600">{summary.totalHours}j</p>
                      <p className="text-[9px] font-bold text-brand-500 uppercase">Total Jam</p>
                    </div>
                    <div className="bg-emerald-50 rounded-xl p-3 text-center border border-emerald-100">
                      <p className="text-xl font-bold text-emerald-600">{summary.totalOvertime}j</p>
                      <p className="text-[9px] font-bold text-emerald-500 uppercase">Lembur</p>
                    </div>
                    <div className="bg-indigo-50 rounded-xl p-3 text-center border border-indigo-100">
                      <p className="text-xl font-bold text-indigo-600">{summary.avgDaily}j</p>
                      <p className="text-[9px] font-bold text-indigo-500 uppercase">Rata-rata/Hari</p>
                    </div>
                    <div className="bg-amber-50 rounded-xl p-3 text-center border border-amber-100">
                      <p className="text-xl font-bold text-amber-600">{summary.daysWorked || 0}</p>
                      <p className="text-[9px] font-bold text-amber-500 uppercase">Hari Kerja</p>
                    </div>
                  </div>
                  {/* Progress Bar */}
                  <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Pencapaian target</span>
                      <span className="font-bold">{summary.percentage}% dari {summary.targetHours}j</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full rounded-full transition-all",
                          summary.percentage >= 90 ? "bg-emerald-500" :
                          summary.percentage >= 70 ? "bg-brand-500" :
                          "bg-amber-500"
                        )}
                        style={{ width: `${Math.min(summary.percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Attendance Stats */}
          {(() => {
            const history = getMyAttendanceHistory(30);
            const present = history.filter(a => a.status === 'Present').length;
            const late = history.filter(a => a.status === 'Late').length;
            const leave = history.filter(a => a.status === 'Leave' || a.status === 'Sick').length;
            const alfa = history.filter(a => a.status === 'Absent' || a.status === 'Alfa').length;
            return (
              <div className="grid grid-cols-4 gap-2">
                <div className="bg-emerald-50 rounded-xl p-2.5 text-center border border-emerald-100">
                  <p className="text-lg font-bold text-emerald-600">{present}</p>
                  <p className="text-[8px] font-bold text-emerald-600 uppercase">Hadir</p>
                </div>
                <div className="bg-amber-50 rounded-xl p-2.5 text-center border border-amber-100">
                  <p className="text-lg font-bold text-amber-600">{late}</p>
                  <p className="text-[8px] font-bold text-amber-600 uppercase">Telat</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-2.5 text-center border border-blue-100">
                  <p className="text-lg font-bold text-blue-600">{leave}</p>
                  <p className="text-[8px] font-bold text-blue-600 uppercase">Cuti</p>
                </div>
                <div className="bg-rose-50 rounded-xl p-2.5 text-center border border-rose-100">
                  <p className="text-lg font-bold text-rose-600">{alfa}</p>
                  <p className="text-[8px] font-bold text-rose-600 uppercase">Alfa</p>
                </div>
              </div>
            );
          })()}

          {/* Leave Balance & Request */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-50 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Coffee className="w-4 h-4 text-brand-600" />
                Saldo Cuti & Izin
              </h3>
              <button 
                onClick={() => setShowLeaveModal(true)}
                className="px-3 py-1.5 bg-brand-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-brand-600 transition-colors"
              >
                <Plus className="w-3 h-3" />
                Ajukan
              </button>
            </div>
            {(() => {
              const balance = getLeaveBalance();
              return (
                <div className="p-4">
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="text-center p-3 bg-gray-50 rounded-xl">
                      <p className="text-2xl font-bold text-gray-900">{balance.annual}</p>
                      <p className="text-[10px] text-gray-500 font-medium">Cuti Tahunan</p>
                      <p className="text-[8px] text-gray-400">Terpakai: {balance.used.annual}</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-xl">
                      <p className="text-2xl font-bold text-gray-900">{balance.sick}</p>
                      <p className="text-[10px] text-gray-500 font-medium">Cuti Sakit</p>
                      <p className="text-[8px] text-gray-400">Terpakai: {balance.used.sick}</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-xl">
                      <p className="text-2xl font-bold text-gray-900">{balance.emergency}</p>
                      <p className="text-[10px] text-gray-500 font-medium">Darurat</p>
                      <p className="text-[8px] text-gray-400">Terpakai: {balance.used.emergency}</p>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Leave Requests History */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-50">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Hourglass className="w-4 h-4 text-brand-600" />
                Riwayat Pengajuan
              </h3>
            </div>
            <div className="divide-y divide-gray-50 max-h-[200px] overflow-y-auto">
              {getMyLeaveRequests().length > 0 ? getMyLeaveRequests().map(req => (
                <div key={req.id} className="p-3 flex items-center justify-between hover:bg-gray-50/50">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-9 h-9 rounded-lg flex items-center justify-center",
                      req.type === 'Annual' ? "bg-blue-100 text-blue-600" :
                      req.type === 'Sick' ? "bg-purple-100 text-purple-600" :
                      req.type === 'Emergency' ? "bg-rose-100 text-rose-600" :
                      "bg-gray-100 text-gray-600"
                    )}>
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">
                        {req.type === 'Annual' ? 'Cuti Tahunan' :
                         req.type === 'Sick' ? 'Sakit' :
                         req.type === 'Emergency' ? 'Darurat' :
                         req.type === 'Izin' ? 'Izin' : 'Unpaid'}
                      </p>
                      <p className="text-[10px] text-gray-500">
                        {new Date(req.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                        {req.startDate !== req.endDate && ` - ${new Date(req.endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}`}
                        {' · '}{req.days} hari
                      </p>
                    </div>
                  </div>
                  <span className={cn(
                    "px-2 py-1 rounded-full text-[9px] font-bold uppercase",
                    req.status === 'Approved' ? "bg-emerald-100 text-emerald-700" :
                    req.status === 'Pending' ? "bg-amber-100 text-amber-700" :
                    "bg-rose-100 text-rose-700"
                  )}>
                    {req.status === 'Approved' ? 'Disetujui' : 
                     req.status === 'Pending' ? 'Menunggu' : 'Ditolak'}
                  </span>
                </div>
              )) : (
                <div className="p-6 text-center text-gray-400 text-sm">
                  Belum ada pengajuan cuti/izin
                </div>
              )}
            </div>
          </div>

          {/* Attendance History */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-50 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <History className="w-4 h-4 text-brand-600" />
                Riwayat Absensi (30 Hari)
              </h3>
            </div>
            <div className="divide-y divide-gray-50 max-h-[400px] overflow-y-auto">
              {getMyAttendanceHistory(30).map(att => (
                <div key={att.id} className="p-3 flex items-center justify-between hover:bg-gray-50/50">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex flex-col items-center justify-center text-xs font-bold",
                      att.status === 'Present' ? "bg-emerald-100 text-emerald-700" :
                      att.status === 'Late' ? "bg-amber-100 text-amber-700" :
                      att.status === 'Leave' ? "bg-blue-100 text-blue-700" :
                      att.status === 'Sick' ? "bg-purple-100 text-purple-700" :
                      att.status === 'Alfa' ? "bg-rose-100 text-rose-700" :
                      "bg-gray-100 text-gray-700"
                    )}>
                      <span className="text-sm font-bold">{new Date(att.date).getDate()}</span>
                      <span className="text-[8px] uppercase">{new Date(att.date).toLocaleDateString('id-ID', { month: 'short' })}</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">
                        {new Date(att.date).toLocaleDateString('id-ID', { weekday: 'long' })}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-gray-500">
                        {att.checkInTime && <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" /> {att.checkInTime}</span>}
                        {att.checkOutTime && <span className="flex items-center gap-0.5"><LogOut className="w-3 h-3" /> {att.checkOutTime}</span>}
                        {att.notes && <span className="text-gray-400 truncate max-w-[100px]">· {att.notes}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={cn(
                      "px-2 py-1 rounded-full text-[9px] font-bold uppercase",
                      att.status === 'Present' ? "bg-emerald-100 text-emerald-700" :
                      att.status === 'Late' ? "bg-amber-100 text-amber-700" :
                      att.status === 'Leave' ? "bg-blue-100 text-blue-700" :
                      att.status === 'Sick' ? "bg-purple-100 text-purple-700" :
                      att.status === 'Alfa' ? "bg-rose-100 text-rose-700" :
                      "bg-gray-100 text-gray-700"
                    )}>
                      {att.status === 'Present' ? 'Hadir' :
                       att.status === 'Late' ? 'Telat' :
                       att.status === 'Leave' ? 'Cuti' :
                       att.status === 'Sick' ? 'Sakit' :
                       att.status === 'Alfa' ? 'Alfa' :
                       att.status}
                    </span>
                  </div>
                </div>
              ))}
              {getMyAttendanceHistory(30).length === 0 && (
                <div className="p-6 text-center text-gray-400 text-sm">
                  Belum ada riwayat absensi
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Leave Request Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Ajukan Cuti / Izin</h3>
              <button onClick={() => setShowLeaveModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Jenis Pengajuan</label>
                <select
                  value={leaveForm.type}
                  onChange={e => setLeaveForm(prev => ({ ...prev, type: e.target.value as typeof prev.type }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                >
                  <option value="Annual">Cuti Tahunan</option>
                  <option value="Sick">Sakit</option>
                  <option value="Emergency">Darurat</option>
                  <option value="Izin">Izin (Setengah Hari / Lainnya)</option>
                  <option value="Unpaid">Cuti Tidak Dibayar</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Tanggal Mulai</label>
                  <input
                    type="date"
                    value={leaveForm.startDate}
                    onChange={e => setLeaveForm(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Tanggal Selesai</label>
                  <input
                    type="date"
                    value={leaveForm.endDate}
                    onChange={e => setLeaveForm(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Alasan</label>
                <textarea
                  value={leaveForm.reason}
                  onChange={e => setLeaveForm(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Jelaskan alasan pengajuan..."
                  rows={3}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
                />
              </div>
              {leaveForm.type === 'Sick' && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Lampiran Surat Dokter (Opsional)</label>
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-brand-300 transition-colors cursor-pointer">
                    <Paperclip className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                    <p className="text-xs text-gray-500">Upload foto surat dokter</p>
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => setShowLeaveModal(false)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  if (!leaveForm.startDate || !leaveForm.reason) return;
                  const start = new Date(leaveForm.startDate);
                  const end = leaveForm.endDate ? new Date(leaveForm.endDate) : start;
                  const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
                  submitLeave({
                    userId: currentUser?.id || '',
                    type: leaveForm.type,
                    startDate: leaveForm.startDate,
                    endDate: leaveForm.endDate || leaveForm.startDate,
                    days,
                    reason: leaveForm.reason,
                  });
                  setShowLeaveModal(false);
                  setLeaveForm({ type: 'Annual', startDate: '', endDate: '', reason: '' });
                }}
                disabled={!leaveForm.startDate || !leaveForm.reason}
                className="flex-1 py-2.5 bg-brand-500 text-white rounded-xl text-sm font-bold hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                Ajukan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* SALARY TAB — Payroll Info */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'salary' && (
        <div className="space-y-4">
          {/* Current Month Estimate */}
          {(() => {
            const estimate = getCurrentMonthSalaryEstimate();
            return (
              <div className="bg-gradient-to-br from-brand-500 to-brand-600 rounded-2xl p-5 text-white">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    <span className="text-sm font-bold text-brand-100">Estimasi Gaji Bulan Ini</span>
                  </div>
                  <span className="text-[10px] bg-white/20 px-2 py-1 rounded-full">
                    {new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                  </span>
                </div>
                <p className="text-3xl font-bold mb-1">
                  Rp {estimate.net.toLocaleString('id-ID')}
                </p>
                <p className="text-xs text-brand-200">Gaji bersih setelah potongan</p>

                <div className="mt-4 pt-4 border-t border-white/20 space-y-2">
                  {estimate.breakdown.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-brand-100">{item.label}</span>
                      <span className={item.type === 'add' ? "text-white" : "text-rose-200"}>
                        {item.type === 'add' ? '+' : '-'}Rp {item.amount.toLocaleString('id-ID')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Payroll History */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-50 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <History className="w-4 h-4 text-brand-600" />
                Riwayat Slip Gaji
              </h3>
            </div>
            <div className="divide-y divide-gray-50">
              {getMyPayroll().map(pay => (
                <div key={pay.id} className="p-4 flex items-center justify-between hover:bg-gray-50/50">
                  <div>
                    <p className="font-bold text-gray-900">
                      {new Date(pay.period + '-01').toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                    </p>
                    <p className="text-xs text-gray-500">
                      {pay.presentDays} hari kerja · Lembur {pay.overtimeHours}j
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">Rp {pay.netPay.toLocaleString('id-ID')}</p>
                    <span className={cn(
                      "text-[9px] font-bold px-2 py-0.5 rounded-full",
                      pay.status === 'Paid' ? "bg-emerald-100 text-emerald-700" :
                      pay.status === 'Processed' ? "bg-blue-100 text-blue-700" :
                      "bg-gray-100 text-gray-600"
                    )}>
                      {pay.status}
                    </span>
                  </div>
                </div>
              ))}
              {getMyPayroll().length === 0 && (
                <div className="p-8 text-center text-gray-400 text-sm">
                  Belum ada riwayat slip gaji
                </div>
              )}
            </div>
          </div>

          {/* My Documents */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-50">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand-600" />
                Dokumen Saya
              </h3>
            </div>
            <div className="divide-y divide-gray-50">
              {employeeDocuments.filter(d => d.userId === currentUser?.id).map(doc => (
                <div key={doc.id} className="p-3 flex items-center justify-between hover:bg-gray-50/50">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-9 h-9 rounded-lg flex items-center justify-center",
                      doc.type === 'Contract' ? "bg-indigo-100 text-indigo-600" :
                      doc.type === 'Payslip' ? "bg-emerald-100 text-emerald-600" :
                      doc.type === 'Certificate' ? "bg-amber-100 text-amber-600" :
                      "bg-gray-100 text-gray-600"
                    )}>
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{doc.title}</p>
                      <p className="text-[10px] text-gray-500">
                        {doc.type} · {new Date(doc.uploadedAt).toLocaleDateString('id-ID')}
                      </p>
                    </div>
                  </div>
                  <button className="p-2 hover:bg-brand-50 rounded-lg text-gray-400 hover:text-brand-600 transition-colors">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* COMPANY TAB — Vision, Mission, Policies */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'company' && (
        <div className="space-y-4">
          {/* Company Info */}
          <div className="bg-gradient-to-br from-brand-500 to-brand-600 rounded-2xl p-5 text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-xl">
                ∞
              </div>
              <div>
                <h2 className="text-xl font-bold">{companyInfo.name}</h2>
                <p className="text-brand-200 text-sm">{companyInfo.tagline}</p>
              </div>
            </div>
          </div>

          {/* Vision */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-5 h-5 text-brand-600" />
              <h3 className="font-bold text-gray-900">Visi</h3>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">{companyInfo.vision}</p>
          </div>

          {/* Mission */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-5 h-5 text-brand-600" />
              <h3 className="font-bold text-gray-900">Misi</h3>
            </div>
            <ul className="space-y-2">
              {companyInfo.mission.map((m, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  {m}
                </li>
              ))}
            </ul>
          </div>

          {/* Values */}
          <div className="grid grid-cols-2 gap-3">
            {companyInfo.values.map((val, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 text-center">
                <span className="text-2xl mb-2 block">{val.icon}</span>
                <h4 className="font-bold text-gray-900 text-sm">{val.title}</h4>
                <p className="text-[10px] text-gray-500 mt-1">{val.description}</p>
              </div>
            ))}
          </div>

          {/* Policies */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-50 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Shield className="w-4 h-4 text-brand-600" />
                Kebijakan & SOP Perusahaan
              </h3>
            </div>
            <div className="divide-y divide-gray-50">
              {policies.map(policy => (
                <div key={policy.id} className="overflow-hidden">
                  <button
                    onClick={() => setExpandedPolicy(expandedPolicy === policy.id ? null : policy.id)}
                    className="w-full p-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-9 h-9 rounded-lg flex items-center justify-center",
                        policy.category === 'Attendance' ? "bg-brand-100 text-brand-600" :
                        policy.category === 'Leave' ? "bg-blue-100 text-blue-600" :
                        policy.category === 'Conduct' ? "bg-amber-100 text-amber-600" :
                        policy.category === 'Safety' ? "bg-rose-100 text-rose-600" :
                        "bg-gray-100 text-gray-600"
                      )}>
                        {policy.category === 'Attendance' ? <Clock className="w-4 h-4" /> :
                         policy.category === 'Leave' ? <Calendar className="w-4 h-4" /> :
                         policy.category === 'Conduct' ? <Heart className="w-4 h-4" /> :
                         policy.category === 'Safety' ? <Shield className="w-4 h-4" /> :
                         <FileText className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{policy.title}</p>
                        <p className="text-[10px] text-gray-500">v{policy.version} · Berlaku {new Date(policy.effectiveDate).toLocaleDateString('id-ID')}</p>
                      </div>
                    </div>
                    <ChevronDown className={cn(
                      "w-5 h-5 text-gray-400 transition-transform",
                      expandedPolicy === policy.id && "rotate-180"
                    )} />
                  </button>
                  {expandedPolicy === policy.id && (
                    <div className="px-4 pb-4 animate-slide-in-top">
                      <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
                        {policy.content}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Contact Info */}
          <div className="bg-gray-50 rounded-xl p-4 text-center text-xs text-gray-500 space-y-1">
            <p className="font-bold text-gray-700">{companyInfo.name}</p>
            <p>{companyInfo.address}</p>
            <p>{companyInfo.phone} · {companyInfo.email}</p>
          </div>
        </div>
      )}

      {/* Warning if no GPS */}
      {!todayAttendance && activeTab === 'home' && (
        <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex gap-3">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
          <p className="text-[11px] text-rose-600 font-medium">
            Pastikan anda sudah berada di lokasi kerja sebelum melakukan check-in. Sistem akan mencatat koordinat GPS anda secara otomatis.
          </p>
        </div>
      )}

      {selectedTask && (
        <TaskDetailModal 
          task={selectedTask} 
          project={projects.find(p => p.id === selectedTask.projectId)} 
          onClose={() => setSelectedTask(null)} 
        />
      )}
    </div>
  );
}
