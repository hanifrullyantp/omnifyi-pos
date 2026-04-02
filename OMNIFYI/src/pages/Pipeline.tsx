import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, UserPlus, Phone, Mail, MapPin, Calendar,
  ChevronRight, Search, Plus, MessageCircle,
  CheckCircle2, XCircle, Target,
  FileText, Send, Copy,
  Globe, Code, Link2, ExternalLink, Heart, Handshake, X,
  PhoneCall, Video,
  Briefcase, Tag, History, Activity,
  Clock, AlertTriangle, Bell, CalendarClock, ArrowRight
} from 'lucide-react';
import { useData } from '../store/dataStore';

// Pipeline stage configuration
const PIPELINE_STAGES = [
  { id: 'new-lead', label: 'Lead Baru', color: 'blue', icon: UserPlus, description: 'Lead yang baru masuk' },
  { id: 'contacted', label: 'Dihubungi', color: 'indigo', icon: Phone, description: 'Sudah ada kontak awal' },
  { id: 'follow-up', label: 'Follow Up', color: 'violet', icon: MessageCircle, description: 'Dalam proses follow up' },
  { id: 'negotiation', label: 'Negosiasi', color: 'amber', icon: Handshake, description: 'Sedang negosiasi' },
  { id: 'quotation', label: 'Penawaran', color: 'orange', icon: FileText, description: 'Quotation sudah dikirim' },
  { id: 'won', label: 'Closing', color: 'emerald', icon: CheckCircle2, description: 'Deal berhasil' },
  { id: 'lost', label: 'Lost', color: 'rose', icon: XCircle, description: 'Deal gagal' },
  { id: 'after-sales', label: 'After Sales', color: 'teal', icon: Heart, description: 'Layanan purna jual' },
];

const ACTIVITY_TYPES = [
  { id: 'call', label: 'Telepon', icon: PhoneCall, color: 'green' },
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, color: 'emerald' },
  { id: 'email', label: 'Email', icon: Mail, color: 'blue' },
  { id: 'meeting', label: 'Meeting', icon: Video, color: 'violet' },
  { id: 'visit', label: 'Kunjungan', icon: MapPin, color: 'amber' },
  { id: 'note', label: 'Catatan', icon: FileText, color: 'gray' },
];

const LEAD_SOURCES = [
  'Website Form', 'WhatsApp', 'Telepon', 'Referensi', 'Social Media', 
  'Google Ads', 'Event', 'Cold Call', 'Partner', 'Lainnya'
];

export default function Pipeline() {
  const navigate = useNavigate();
  const { 
    customers, addCustomer, updateCustomer,
    projects, estimates,
    activityLog, addActivity,
    currentUser
  } = useData();

  // State
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [showAddLead, setShowAddLead] = useState(false);
  const [showEmbedForm, setShowEmbedForm] = useState(false);
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [showFollowUpForm, setShowFollowUpForm] = useState(false);
  const [showWhatsApp, setShowWhatsApp] = useState(false);
  const [detailTab, setDetailTab] = useState<'info' | 'activity' | 'followup' | 'projects'>('info');

  // New lead form
  const [newLead, setNewLead] = useState({
    name: '', phone: '', email: '', company: '', 
    message: '', source: 'Website Form', assignedTo: '', dealValue: ''
  });

  // Activity form
  const [activityForm, setActivityForm] = useState({
    type: 'call', title: '', description: '', nextAction: ''
  });

  // Follow-up form
  const [followUpForm, setFollowUpForm] = useState({
    type: 'call', scheduledDate: '', scheduledTime: '09:00', notes: '', assignedTo: ''
  });

  // WhatsApp state
  const [waMessage, setWaMessage] = useState('');
  const [waTemplate, setWaTemplate] = useState('');
  
  // Reminder state
  const [showSetReminder, setShowSetReminder] = useState(false);
  const [reminderForm, setReminderForm] = useState({
    date: '', time: '09:00', notes: '', type: 'follow-up'
  });
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute for reminder checks
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Computed data
  const customersWithPipeline = useMemo(() => {
    return customers.map(c => ({
      ...c,
      pipelineStage: c.pipelineStage || (c.status === 'Lead' ? 'new-lead' : c.status === 'Active' ? 'won' : 'after-sales'),
      activities: activityLog.filter(a => 
        a.detail?.toLowerCase().includes(c.name.toLowerCase()) ||
        a.action?.toLowerCase().includes(c.name.toLowerCase())
      ),
      linkedProjects: projects.filter(p => p.customerId === c.id),
      linkedEstimates: estimates.filter(e => e.customerId === c.id),
    }));
  }, [customers, activityLog, projects, estimates]);

  const filteredCustomers = useMemo(() => {
    return customersWithPipeline.filter(c => {
      const matchesSearch = !searchQuery || 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone?.includes(searchQuery);
      const matchesStage = !selectedStage || c.pipelineStage === selectedStage;
      return matchesSearch && matchesStage;
    });
  }, [customersWithPipeline, searchQuery, selectedStage]);

  const pipelineStats = useMemo(() => {
    return PIPELINE_STAGES.map(stage => ({
      ...stage,
      count: customersWithPipeline.filter(c => c.pipelineStage === stage.id).length,
      value: customersWithPipeline
        .filter(c => c.pipelineStage === stage.id)
        .reduce((sum, c) => sum + (c.totalValue || 0), 0)
    }));
  }, [customersWithPipeline]);

  const selectedCustomerData = useMemo(() => {
    return customersWithPipeline.find(c => c.id === selectedCustomer);
  }, [customersWithPipeline, selectedCustomer]);

  // Follow-up reminder calculations
  const followUpReminders = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const weekFromNow = new Date(today);
    weekFromNow.setDate(weekFromNow.getDate() + 7);

    return customersWithPipeline
      .filter(c => c.nextFollowUp)
      .map(c => {
        const followUpDate = new Date(c.nextFollowUp!);
        followUpDate.setHours(0, 0, 0, 0);
        
        const diffTime = followUpDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        let status: 'overdue' | 'today' | 'tomorrow' | 'upcoming' | 'future';
        if (diffDays < 0) status = 'overdue';
        else if (diffDays === 0) status = 'today';
        else if (diffDays === 1) status = 'tomorrow';
        else if (diffDays <= 7) status = 'upcoming';
        else status = 'future';

        return {
          ...c,
          followUpStatus: status,
          daysUntilFollowUp: diffDays,
          followUpDateFormatted: followUpDate.toLocaleDateString('id-ID', { 
            weekday: 'short', day: 'numeric', month: 'short' 
          })
        };
      })
      .filter(c => c.followUpStatus !== 'future')
      .sort((a, b) => a.daysUntilFollowUp - b.daysUntilFollowUp);
  }, [customersWithPipeline, currentTime]);

  const reminderCounts = useMemo(() => ({
    overdue: followUpReminders.filter(r => r.followUpStatus === 'overdue').length,
    today: followUpReminders.filter(r => r.followUpStatus === 'today').length,
    tomorrow: followUpReminders.filter(r => r.followUpStatus === 'tomorrow').length,
    upcoming: followUpReminders.filter(r => r.followUpStatus === 'upcoming').length,
  }), [followUpReminders]);

  // Helper to check if customer has reminder status
  const getCustomerReminderStatus = (customerId: string) => {
    return followUpReminders.find(r => r.id === customerId);
  };

  // Handlers
  const handleAddLead = () => {
    if (!newLead.name || !newLead.phone) return;

    addCustomer({
      name: newLead.name,
      phone: newLead.phone,
      email: newLead.email || '',
      company: newLead.company || '',
      address: '',
      status: 'Lead',
      starred: false,
      tags: ['Pipeline Lead'],
      pipelineStage: 'new-lead',
      leadSource: newLead.source,
      assignedTo: newLead.assignedTo || currentUser?.name,
      dealValue: newLead.dealValue ? parseInt(newLead.dealValue) : undefined,
      totalValue: newLead.dealValue ? parseInt(newLead.dealValue) : 0,
    });

    addActivity({
      type: 'crm',
      action: 'Lead Baru Ditambahkan',
      detail: `${newLead.name} dari ${newLead.source}`,
    });

    setNewLead({ name: '', phone: '', email: '', company: '', message: '', source: 'Website Form', assignedTo: '', dealValue: '' });
    setShowAddLead(false);
  };

  const handleStageChange = (customerId: string, newStage: 'new-lead' | 'contacted' | 'follow-up' | 'negotiation' | 'quotation' | 'won' | 'lost' | 'after-sales') => {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;

    updateCustomer(customerId, { 
      pipelineStage: newStage,
      status: newStage === 'won' ? 'Active' : newStage === 'lost' ? 'Inactive' : customer.status
    });

    addActivity({
      type: 'crm',
      action: 'Pipeline Stage Changed',
      detail: `${customer.name} → ${PIPELINE_STAGES.find(s => s.id === newStage)?.label}`,
    });
  };

  const handleAddActivity = () => {
    if (!selectedCustomerData || !activityForm.title) return;

    addActivity({
      type: 'crm',
      action: `${ACTIVITY_TYPES.find(t => t.id === activityForm.type)?.label}: ${activityForm.title}`,
      detail: `${selectedCustomerData.name} - ${activityForm.description}`,
    });

    if (activityForm.nextAction) {
      addActivity({
        type: 'crm',
        action: 'Next Action Scheduled',
        detail: `${selectedCustomerData.name}: ${activityForm.nextAction}`,
      });
    }

    setActivityForm({ type: 'call', title: '', description: '', nextAction: '' });
    setShowActivityForm(false);
  };

  const handleSetReminder = () => {
    if (!selectedCustomerData || !reminderForm.date) return;

    const reminderDateTime = `${reminderForm.date}T${reminderForm.time}`;
    
    updateCustomer(selectedCustomerData.id, {
      nextFollowUp: reminderForm.date,
      lastContactDate: new Date().toISOString().split('T')[0],
    });

    addActivity({
      type: 'crm',
      action: 'Follow-up Reminder Set',
      detail: `${selectedCustomerData.name} - ${new Date(reminderDateTime).toLocaleDateString('id-ID', { 
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' 
      })} ${reminderForm.time}${reminderForm.notes ? ` - ${reminderForm.notes}` : ''}`,
    });

    setReminderForm({ date: '', time: '09:00', notes: '', type: 'follow-up' });
    setShowSetReminder(false);
  };

  const handleCompleteFollowUp = (customerId: string, result: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;

    updateCustomer(customerId, {
      nextFollowUp: undefined,
      lastContactDate: new Date().toISOString().split('T')[0],
    });

    addActivity({
      type: 'crm',
      action: 'Follow-up Completed',
      detail: `${customer.name} - ${result}`,
    });
  };

  const handleSendWhatsApp = () => {
    if (!selectedCustomerData?.phone) return;
    
    const phone = selectedCustomerData.phone.replace(/\D/g, '');
    const formattedPhone = phone.startsWith('0') ? '62' + phone.slice(1) : phone;
    const message = encodeURIComponent(waMessage || waTemplate);
    window.open(`https://wa.me/${formattedPhone}?text=${message}`, '_blank');

    addActivity({
      type: 'crm',
      action: 'WhatsApp Sent',
      detail: `${selectedCustomerData.name}: ${waMessage.substring(0, 50)}...`,
    });

    setWaMessage('');
    setShowWhatsApp(false);
  };

  const getStageColor = (stageId: string) => {
    const colors: Record<string, string> = {
      'new-lead': 'bg-blue-100 text-blue-700 border-blue-200',
      'contacted': 'bg-indigo-100 text-indigo-700 border-indigo-200',
      'follow-up': 'bg-violet-100 text-violet-700 border-violet-200',
      'negotiation': 'bg-amber-100 text-amber-700 border-amber-200',
      'quotation': 'bg-orange-100 text-orange-700 border-orange-200',
      'won': 'bg-emerald-100 text-emerald-700 border-emerald-200',
      'lost': 'bg-rose-100 text-rose-700 border-rose-200',
      'after-sales': 'bg-teal-100 text-teal-700 border-teal-200',
    };
    return colors[stageId] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getStageColorDark = (stageId: string) => {
    const colors: Record<string, string> = {
      'new-lead': 'bg-blue-500',
      'contacted': 'bg-indigo-500',
      'follow-up': 'bg-violet-500',
      'negotiation': 'bg-amber-500',
      'quotation': 'bg-orange-500',
      'won': 'bg-emerald-500',
      'lost': 'bg-rose-500',
      'after-sales': 'bg-teal-500',
    };
    return colors[stageId] || 'bg-gray-500';
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000000) return `Rp ${(amount / 1000000000).toFixed(1)}M`;
    if (amount >= 1000000) return `Rp ${(amount / 1000000).toFixed(1)}Jt`;
    if (amount >= 1000) return `Rp ${(amount / 1000).toFixed(0)}K`;
    return `Rp ${amount}`;
  };

  const WA_TEMPLATES = [
    { id: 'intro', label: 'Sapaan Awal', message: `Halo {name}, saya dari Omnifyi. Terima kasih telah menghubungi kami. Ada yang bisa kami bantu?` },
    { id: 'followup', label: 'Follow Up', message: `Halo {name}, bagaimana kabarnya? Apakah ada pertanyaan mengenai penawaran yang sudah kami kirimkan?` },
    { id: 'quotation', label: 'Kirim Quotation', message: `Halo {name}, berikut kami kirimkan penawaran untuk project {project}. Silakan direview dan kabari jika ada pertanyaan.` },
    { id: 'thankyou', label: 'Terima Kasih', message: `Halo {name}, terima kasih atas kepercayaannya menggunakan layanan kami. Jika ada yang bisa kami bantu lagi, jangan ragu menghubungi kami.` },
    { id: 'aftersales', label: 'After Sales', message: `Halo {name}, bagaimana dengan project yang sudah selesai? Apakah semuanya berjalan baik? Kami siap membantu jika ada kebutuhan tambahan.` },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-emerald-500 flex items-center justify-center">
                  <Target className="w-4 h-4 text-white" />
                </div>
                Customer Pipeline
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">Kelola lead hingga after sales</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowEmbedForm(true)}
                className="hidden md:flex items-center gap-1.5 px-3 py-2 text-sm bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors"
              >
                <Globe className="w-4 h-4" />
                Lead Form
              </button>
              <button
                onClick={() => setShowAddLead(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-sm bg-gradient-to-r from-brand-600 to-brand-500 text-white rounded-lg hover:shadow-md transition-all"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Tambah Lead</span>
              </button>
            </div>
          </div>

          {/* Pipeline Stats */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {pipelineStats.map((stage) => {
              const Icon = stage.icon;
              const isActive = selectedStage === stage.id;
              return (
                <button
                  key={stage.id}
                  onClick={() => setSelectedStage(isActive ? null : stage.id)}
                  className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                    isActive 
                      ? `${getStageColor(stage.id)} ring-2 ring-offset-1 ring-${stage.color}-400`
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? '' : 'text-gray-400'}`} />
                  <span className="text-sm font-medium whitespace-nowrap">{stage.label}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-white/50' : 'bg-gray-100'
                  }`}>
                    {stage.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Follow-up Reminders Strip */}
          {(reminderCounts.overdue > 0 || reminderCounts.today > 0 || reminderCounts.tomorrow > 0 || reminderCounts.upcoming > 0) && (
            <div className="mt-3 p-3 bg-gradient-to-r from-amber-50 via-white to-rose-50 rounded-xl border border-amber-200/50">
              <div className="flex items-center gap-2 mb-2">
                <Bell className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-medium text-gray-700">Follow-up Reminders</span>
                <span className="text-xs text-gray-400">
                  {followUpReminders.length} jadwal
                </span>
              </div>
              
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {/* Overdue */}
                {reminderCounts.overdue > 0 && (
                  <div className="flex-shrink-0 flex items-center gap-2 px-3 py-2 bg-rose-100 text-rose-700 rounded-lg">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm font-medium">{reminderCounts.overdue} Terlambat</span>
                  </div>
                )}
                
                {/* Today */}
                {reminderCounts.today > 0 && (
                  <div className="flex-shrink-0 flex items-center gap-2 px-3 py-2 bg-amber-100 text-amber-700 rounded-lg">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm font-medium">{reminderCounts.today} Hari Ini</span>
                  </div>
                )}
                
                {/* Tomorrow */}
                {reminderCounts.tomorrow > 0 && (
                  <div className="flex-shrink-0 flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg">
                    <CalendarClock className="w-4 h-4" />
                    <span className="text-sm font-medium">{reminderCounts.tomorrow} Besok</span>
                  </div>
                )}
                
                {/* Upcoming */}
                {reminderCounts.upcoming > 0 && (
                  <div className="flex-shrink-0 flex items-center gap-2 px-3 py-2 bg-brand-100 text-brand-700 rounded-lg">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm font-medium">{reminderCounts.upcoming} Minggu Ini</span>
                  </div>
                )}
              </div>
              
              {/* Reminder Items */}
              <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                {followUpReminders.slice(0, 5).map((reminder) => {
                  const statusColors = {
                    overdue: 'border-rose-300 bg-rose-50',
                    today: 'border-amber-300 bg-amber-50',
                    tomorrow: 'border-blue-300 bg-blue-50',
                    upcoming: 'border-brand-300 bg-brand-50',
                    future: 'border-gray-200'
                  };
                  
                  return (
                    <div 
                      key={reminder.id}
                      onClick={() => setSelectedCustomer(reminder.id)}
                      className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer hover:shadow-sm transition-all ${statusColors[reminder.followUpStatus]}`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-500 to-emerald-500 flex items-center justify-center text-white text-xs font-medium">
                          {reminder.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{reminder.name}</p>
                          <p className="text-xs text-gray-500">
                            {reminder.followUpStatus === 'overdue' && (
                              <span className="text-rose-600">{Math.abs(reminder.daysUntilFollowUp)} hari terlambat</span>
                            )}
                            {reminder.followUpStatus === 'today' && (
                              <span className="text-amber-600">Hari ini</span>
                            )}
                            {reminder.followUpStatus === 'tomorrow' && (
                              <span className="text-blue-600">Besok</span>
                            )}
                            {reminder.followUpStatus === 'upcoming' && (
                              <span className="text-brand-600">{reminder.followUpDateFormatted}</span>
                            )}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        {/* Quick WhatsApp button */}
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (reminder.phone) {
                              const phone = reminder.phone.replace(/\D/g, '');
                              const formattedPhone = phone.startsWith('0') ? '62' + phone.slice(1) : phone;
                              const msg = encodeURIComponent(`Halo ${reminder.name}, ini follow-up dari kami. Bagaimana kabarnya?`);
                              window.open(`https://wa.me/${formattedPhone}?text=${msg}`, '_blank');
                              addActivity({
                                type: 'crm',
                                action: 'Quick WhatsApp Follow-up',
                                detail: `${reminder.name} - Follow-up reminder`,
                              });
                            }
                          }}
                          className="p-1.5 hover:bg-white rounded-lg transition-colors"
                          title="Kirim WhatsApp"
                        >
                          <MessageCircle className="w-4 h-4 text-emerald-600" />
                        </button>
                        
                        {/* Mark complete */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCompleteFollowUp(reminder.id, 'Marked as completed');
                          }}
                          className="p-1.5 hover:bg-white rounded-lg transition-colors"
                          title="Selesai"
                        >
                          <CheckCircle2 className="w-4 h-4 text-brand-600" />
                        </button>
                        
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Search & View Toggle */}
          <div className="flex items-center gap-2 mt-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama, perusahaan, telepon..."
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              />
            </div>
            <div className="flex bg-gray-100 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('kanban')}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  viewMode === 'kanban' ? 'bg-white shadow text-gray-900' : 'text-gray-500'
                }`}
              >
                Kanban
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  viewMode === 'list' ? 'bg-white shadow text-gray-900' : 'text-gray-500'
                }`}
              >
                List
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex">
        {/* Pipeline View */}
        <div className={`flex-1 p-4 ${selectedCustomer ? 'hidden lg:block lg:max-w-[60%]' : ''}`}>
          {viewMode === 'kanban' ? (
            // Kanban View
            <div className="flex gap-3 overflow-x-auto pb-4">
              {PIPELINE_STAGES.map((stage) => {
                const stageCustomers = filteredCustomers.filter(c => c.pipelineStage === stage.id);
                const Icon = stage.icon;
                
                return (
                  <div 
                    key={stage.id}
                    className="flex-shrink-0 w-72 bg-gray-100 rounded-xl"
                  >
                    {/* Column Header */}
                    <div className={`p-3 rounded-t-xl ${getStageColorDark(stage.id)} bg-opacity-10`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-lg ${getStageColorDark(stage.id)} flex items-center justify-center`}>
                            <Icon className="w-3.5 h-3.5 text-white" />
                          </div>
                          <span className="font-semibold text-gray-900">{stage.label}</span>
                        </div>
                        <span className="text-xs font-medium px-2 py-0.5 bg-white/80 rounded-full">
                          {stageCustomers.length}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{stage.description}</p>
                    </div>

                    {/* Cards */}
                    <div className="p-2 space-y-2 max-h-[calc(100vh-320px)] overflow-y-auto">
                      {stageCustomers.map((customer) => (
                        <div
                          key={customer.id}
                          onClick={() => setSelectedCustomer(customer.id)}
                          className={`bg-white rounded-lg p-3 shadow-sm border border-gray-200 cursor-pointer hover:shadow-md hover:border-brand-300 transition-all ${
                            selectedCustomer === customer.id ? 'ring-2 ring-brand-500' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-emerald-500 flex items-center justify-center text-white font-medium text-sm">
                                {customer.name.charAt(0)}
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-900 text-sm">{customer.name}</h4>
                                {customer.company && (
                                  <p className="text-xs text-gray-500">{customer.company}</p>
                                )}
                              </div>
                            </div>
                            {customer.dealValue && (
                              <span className="text-xs font-medium text-emerald-600">
                                {formatCurrency(customer.dealValue)}
                              </span>
                            )}
                          </div>

                          <div className="space-y-1 text-xs text-gray-500">
                            {customer.phone && (
                              <div className="flex items-center gap-1.5">
                                <Phone className="w-3 h-3" />
                                <span>{customer.phone}</span>
                              </div>
                            )}
                            {customer.leadSource && (
                              <div className="flex items-center gap-1.5">
                                <Tag className="w-3 h-3" />
                                <span>{customer.leadSource}</span>
                              </div>
                            )}
                          </div>

                          {/* Follow-up Reminder Badge */}
                          {(() => {
                            const reminder = getCustomerReminderStatus(customer.id);
                            if (!reminder) return null;
                            
                            const badgeStyles = {
                              overdue: 'bg-rose-100 text-rose-700 border-rose-300',
                              today: 'bg-amber-100 text-amber-700 border-amber-300',
                              tomorrow: 'bg-blue-100 text-blue-700 border-blue-300',
                              upcoming: 'bg-brand-100 text-brand-700 border-brand-300',
                              future: 'bg-gray-100 text-gray-700 border-gray-300'
                            };
                            
                            const badgeLabels = {
                              overdue: `⚠ ${Math.abs(reminder.daysUntilFollowUp)}h terlambat`,
                              today: '📞 Hari ini',
                              tomorrow: '📅 Besok',
                              upcoming: `📆 ${reminder.followUpDateFormatted}`,
                              future: reminder.followUpDateFormatted
                            };
                            
                            return (
                              <div className={`mt-2 flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs font-medium ${badgeStyles[reminder.followUpStatus]}`}>
                                <Clock className="w-3 h-3" />
                                <span>{badgeLabels[reminder.followUpStatus]}</span>
                                {/* Quick WhatsApp action on overdue/today */}
                                {(reminder.followUpStatus === 'overdue' || reminder.followUpStatus === 'today') && customer.phone && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const phone = customer.phone!.replace(/\D/g, '');
                                      const formattedPhone = phone.startsWith('0') ? '62' + phone.slice(1) : phone;
                                      const msg = encodeURIComponent(`Halo ${customer.name}, ini follow-up dari kami. Bagaimana kabarnya?`);
                                      window.open(`https://wa.me/${formattedPhone}?text=${msg}`, '_blank');
                                      addActivity({
                                        type: 'crm',
                                        action: 'Quick WhatsApp Follow-up',
                                        detail: `${customer.name}`,
                                      });
                                    }}
                                    className="ml-auto p-1 hover:bg-white/50 rounded"
                                    title="Kirim WhatsApp"
                                  >
                                    <MessageCircle className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            );
                          })()}

                          {/* Quick Stats */}
                          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100">
                            {customer.linkedProjects.length > 0 && (
                              <span className="text-xs px-1.5 py-0.5 bg-brand-50 text-brand-600 rounded">
                                {customer.linkedProjects.length} Project
                              </span>
                            )}
                            {customer.linkedEstimates.length > 0 && (
                              <span className="text-xs px-1.5 py-0.5 bg-violet-50 text-violet-600 rounded">
                                {customer.linkedEstimates.length} Quote
                              </span>
                            )}
                            {customer.assignedTo && (
                              <span className="text-xs text-gray-400 ml-auto truncate max-w-[80px]">
                                {customer.assignedTo}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}

                      {stageCustomers.length === 0 && (
                        <div className="text-center py-8 text-gray-400">
                          <Icon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-xs">Belum ada lead</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // List View
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Lead/Customer</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Kontak</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Stage</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">Value</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">PIC</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredCustomers.map((customer) => {
                    const stage = PIPELINE_STAGES.find(s => s.id === customer.pipelineStage);
                    const Icon = stage?.icon || Users;
                    
                    return (
                      <tr 
                        key={customer.id}
                        onClick={() => setSelectedCustomer(customer.id)}
                        className="hover:bg-gray-50 cursor-pointer"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-emerald-500 flex items-center justify-center text-white font-medium">
                              {customer.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{customer.name}</p>
                              <p className="text-xs text-gray-500">{customer.company || customer.leadSource || '-'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <p className="text-sm text-gray-900">{customer.phone}</p>
                          <p className="text-xs text-gray-500">{customer.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStageColor(customer.pipelineStage || 'new-lead')}`}>
                            <Icon className="w-3 h-3" />
                            {stage?.label || 'New'}
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <span className="text-sm font-medium text-gray-900">
                            {customer.dealValue ? formatCurrency(customer.dealValue) : '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <span className="text-sm text-gray-500">{customer.assignedTo || '-'}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {filteredCustomers.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Tidak ada lead ditemukan</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {selectedCustomer && selectedCustomerData && (
          <div className="w-full lg:w-[40%] lg:min-w-[400px] bg-white border-l border-gray-200 min-h-[calc(100vh-180px)]">
            {/* Detail Header */}
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-brand-50 to-emerald-50">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-emerald-500 flex items-center justify-center text-white font-bold text-lg">
                    {selectedCustomerData.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{selectedCustomerData.name}</h3>
                    <p className="text-sm text-gray-500">{selectedCustomerData.company || 'Individual'}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedCustomer(null)}
                  className="p-1.5 hover:bg-white/50 rounded-lg lg:hidden"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Current Reminder Status */}
              {(() => {
                const reminder = getCustomerReminderStatus(selectedCustomerData.id);
                if (!reminder) return null;
                
                const statusConfig = {
                  overdue: { bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-300', label: `${Math.abs(reminder.daysUntilFollowUp)} hari terlambat` },
                  today: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300', label: 'Hari ini' },
                  tomorrow: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300', label: 'Besok' },
                  upcoming: { bg: 'bg-brand-100', text: 'text-brand-700', border: 'border-brand-300', label: reminder.followUpDateFormatted },
                  future: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300', label: reminder.followUpDateFormatted }
                };
                const config = statusConfig[reminder.followUpStatus];
                
                return (
                  <div className={`mt-3 p-3 rounded-lg border ${config.bg} ${config.border}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bell className={`w-4 h-4 ${config.text}`} />
                        <span className={`text-sm font-medium ${config.text}`}>
                          Follow-up: {config.label}
                        </span>
                      </div>
                      <button
                        onClick={() => handleCompleteFollowUp(selectedCustomerData.id, 'Completed')}
                        className={`text-xs px-2 py-1 rounded ${config.text} hover:bg-white/50`}
                      >
                        ✓ Selesai
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* Quick Actions */}
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={() => setShowWhatsApp(true)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp
                </button>
                <button
                  onClick={() => setShowSetReminder(true)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors"
                >
                  <CalendarClock className="w-4 h-4" />
                  Set Reminder
                </button>
              </div>
              
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={() => setShowActivityForm(true)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Log Activity
                </button>
              </div>

              {/* Pipeline Stage Selector */}
              <div className="mt-3">
                <label className="text-xs text-gray-500 mb-1 block">Pipeline Stage</label>
                <select
                  value={selectedCustomerData.pipelineStage || 'new-lead'}
                  onChange={(e) => handleStageChange(selectedCustomerData.id, e.target.value as any)}
                  className={`w-full px-3 py-2 rounded-lg border text-sm font-medium ${getStageColor(selectedCustomerData.pipelineStage || 'new-lead')}`}
                >
                  {PIPELINE_STAGES.map(stage => (
                    <option key={stage.id} value={stage.id}>{stage.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Detail Tabs */}
            <div className="flex border-b border-gray-200">
              {[
                { id: 'info', label: 'Info', icon: Users },
                { id: 'activity', label: 'Aktivitas', icon: Activity },
                { id: 'followup', label: 'Follow Up', icon: Calendar },
                { id: 'projects', label: 'Projects', icon: Briefcase },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setDetailTab(tab.id as any)}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                      detailTab === tab.id
                        ? 'text-brand-600 border-brand-500'
                        : 'text-gray-500 border-transparent hover:text-gray-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab Content */}
            <div className="p-4 overflow-y-auto max-h-[calc(100vh-400px)]">
              {detailTab === 'info' && (
                <div className="space-y-4">
                  {/* Contact Info */}
                  <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                    <h4 className="font-medium text-gray-900 flex items-center gap-2">
                      <Users className="w-4 h-4 text-brand-500" />
                      Informasi Kontak
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <label className="text-xs text-gray-500">Telepon</label>
                        <p className="font-medium">{selectedCustomerData.phone || '-'}</p>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Email</label>
                        <p className="font-medium">{selectedCustomerData.email || '-'}</p>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Perusahaan</label>
                        <p className="font-medium">{selectedCustomerData.company || '-'}</p>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Alamat</label>
                        <p className="font-medium">{selectedCustomerData.address || '-'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Lead Info */}
                  <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                    <h4 className="font-medium text-gray-900 flex items-center gap-2">
                      <Target className="w-4 h-4 text-brand-500" />
                      Informasi Lead
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <label className="text-xs text-gray-500">Sumber Lead</label>
                        <p className="font-medium">{selectedCustomerData.leadSource || 'Tidak diketahui'}</p>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Nilai Deal</label>
                        <p className="font-medium text-emerald-600">
                          {selectedCustomerData.dealValue ? formatCurrency(selectedCustomerData.dealValue) : '-'}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">PIC / Assigned</label>
                        <p className="font-medium">{selectedCustomerData.assignedTo || currentUser?.name || '-'}</p>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Status</label>
                        <p className="font-medium">{selectedCustomerData.status}</p>
                      </div>
                    </div>
                  </div>

                  {/* Tags */}
                  {selectedCustomerData.tags && selectedCustomerData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedCustomerData.tags.map((tag, i) => (
                        <span key={i} className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {detailTab === 'activity' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">Riwayat Aktivitas</h4>
                    <button
                      onClick={() => setShowActivityForm(true)}
                      className="text-sm text-brand-600 hover:text-brand-700 font-medium"
                    >
                      + Tambah
                    </button>
                  </div>

                  {selectedCustomerData.activities.length > 0 ? (
                    <div className="space-y-3">
                      {selectedCustomerData.activities.slice(0, 10).map((activity, i) => (
                        <div key={i} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
                            <Activity className="w-4 h-4 text-brand-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 text-sm">{activity.action}</p>
                            <p className="text-xs text-gray-500 truncate">{activity.detail}</p>
                            <p className="text-xs text-gray-400 mt-1">{activity.timestamp}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <History className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Belum ada aktivitas</p>
                    </div>
                  )}
                </div>
              )}

              {detailTab === 'followup' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">Jadwal Follow Up</h4>
                    <button
                      onClick={() => setShowFollowUpForm(true)}
                      className="text-sm text-brand-600 hover:text-brand-700 font-medium"
                    >
                      + Jadwalkan
                    </button>
                  </div>

                  {/* Placeholder for follow-ups */}
                  <div className="text-center py-8 text-gray-400">
                    <Calendar className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Belum ada jadwal follow up</p>
                    <button
                      onClick={() => setShowFollowUpForm(true)}
                      className="mt-2 text-sm text-brand-600 hover:text-brand-700"
                    >
                      Jadwalkan sekarang
                    </button>
                  </div>
                </div>
              )}

              {detailTab === 'projects' && (
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Project & Estimasi</h4>

                  {/* Projects */}
                  {selectedCustomerData.linkedProjects.length > 0 ? (
                    <div className="space-y-2">
                      <h5 className="text-xs text-gray-500 uppercase">Projects</h5>
                      {selectedCustomerData.linkedProjects.map((project) => (
                        <div
                          key={project.id}
                          onClick={() => navigate(`/projects/${project.id}`)}
                          className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-gray-900">{project.name}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              project.status === 'Active' ? 'bg-emerald-100 text-emerald-700' :
                              project.status === 'Completed' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {project.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500">{formatCurrency(project.budget)}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-400 bg-gray-50 rounded-lg">
                      <Briefcase className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Belum ada project</p>
                    </div>
                  )}

                  {/* Estimates */}
                  {selectedCustomerData.linkedEstimates.length > 0 && (
                    <div className="space-y-2 mt-4">
                      <h5 className="text-xs text-gray-500 uppercase">Estimasi / Quotation</h5>
                      {selectedCustomerData.linkedEstimates.map((estimate) => {
                        const total = estimate.items.reduce((sum, item) => sum + (item.qty * item.sellPrice), 0);
                        return (
                          <div
                            key={estimate.id}
                            onClick={() => navigate('/estimator')}
                            className="p-3 bg-violet-50 rounded-lg cursor-pointer hover:bg-violet-100 transition-colors"
                          >
                            <p className="font-medium text-gray-900">{estimate.title}</p>
                            <p className="text-sm text-violet-600">{formatCurrency(total)}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add Lead Modal */}
      {showAddLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Tambah Lead Baru</h3>
              <button onClick={() => setShowAddLead(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  value={newLead.name}
                  onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500"
                  placeholder="Nama lead"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">No. Telepon / WhatsApp *</label>
                <input
                  type="tel"
                  value={newLead.phone}
                  onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500"
                  placeholder="08xxxxxxxxxx"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={newLead.email}
                  onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500"
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Perusahaan</label>
                <input
                  type="text"
                  value={newLead.company}
                  onChange={(e) => setNewLead({ ...newLead, company: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500"
                  placeholder="Nama perusahaan"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sumber Lead</label>
                <select
                  value={newLead.source}
                  onChange={(e) => setNewLead({ ...newLead, source: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500"
                >
                  {LEAD_SOURCES.map(source => (
                    <option key={source} value={source}>{source}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nilai Deal (estimasi)</label>
                <input
                  type="number"
                  value={newLead.dealValue}
                  onChange={(e) => setNewLead({ ...newLead, dealValue: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500"
                  placeholder="Rp 0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Catatan / Kebutuhan</label>
                <textarea
                  value={newLead.message}
                  onChange={(e) => setNewLead({ ...newLead, message: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500"
                  placeholder="Deskripsi kebutuhan..."
                />
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 flex gap-2">
              <button
                onClick={() => setShowAddLead(false)}
                className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={handleAddLead}
                disabled={!newLead.name || !newLead.phone}
                className="flex-1 py-2 bg-gradient-to-r from-brand-600 to-brand-500 text-white rounded-lg font-medium hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Simpan Lead
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Activity Form Modal */}
      {showActivityForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Catat Aktivitas</h3>
              <button onClick={() => setShowActivityForm(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Jenis Aktivitas</label>
                <div className="grid grid-cols-3 gap-2">
                  {ACTIVITY_TYPES.map((type) => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.id}
                        onClick={() => setActivityForm({ ...activityForm, type: type.id })}
                        className={`p-2 rounded-lg border text-center transition-colors ${
                          activityForm.type === type.id
                            ? 'border-brand-500 bg-brand-50 text-brand-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Icon className="w-5 h-5 mx-auto mb-1" />
                        <span className="text-xs">{type.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Judul / Ringkasan</label>
                <input
                  type="text"
                  value={activityForm.title}
                  onChange={(e) => setActivityForm({ ...activityForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500"
                  placeholder="Contoh: Diskusi kebutuhan project"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Detail / Catatan</label>
                <textarea
                  value={activityForm.description}
                  onChange={(e) => setActivityForm({ ...activityForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500"
                  placeholder="Detail hasil interaksi..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Next Action (opsional)</label>
                <input
                  type="text"
                  value={activityForm.nextAction}
                  onChange={(e) => setActivityForm({ ...activityForm, nextAction: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500"
                  placeholder="Contoh: Kirim quotation besok"
                />
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 flex gap-2">
              <button
                onClick={() => setShowActivityForm(false)}
                className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={handleAddActivity}
                disabled={!activityForm.title}
                className="flex-1 py-2 bg-gradient-to-r from-brand-600 to-brand-500 text-white rounded-lg font-medium hover:shadow-md disabled:opacity-50"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Modal */}
      {showWhatsApp && selectedCustomerData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-emerald-50">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-gray-900">Kirim WhatsApp</h3>
              </div>
              <button onClick={() => setShowWhatsApp(false)} className="p-1 hover:bg-white/50 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-emerald-500 flex items-center justify-center text-white font-medium">
                  {selectedCustomerData.name.charAt(0)}
                </div>
                <div>
                  <p className="font-medium">{selectedCustomerData.name}</p>
                  <p className="text-sm text-gray-500">{selectedCustomerData.phone}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Template Pesan</label>
                <div className="space-y-2">
                  {WA_TEMPLATES.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => {
                        let msg = template.message
                          .replace('{name}', selectedCustomerData.name)
                          .replace('{project}', selectedCustomerData.linkedProjects[0]?.name || 'project Anda');
                        setWaMessage(msg);
                        setWaTemplate(template.id);
                      }}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        waTemplate === template.id
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <p className="font-medium text-sm">{template.label}</p>
                      <p className="text-xs text-gray-500 line-clamp-1">{template.message.substring(0, 60)}...</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pesan</label>
                <textarea
                  value={waMessage}
                  onChange={(e) => setWaMessage(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  placeholder="Tulis pesan..."
                />
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 flex gap-2">
              <button
                onClick={() => setShowWhatsApp(false)}
                className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={handleSendWhatsApp}
                disabled={!waMessage}
                className="flex-1 py-2 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                Kirim
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Embed Form Modal */}
      {showEmbedForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-gray-900">Embed Lead Form</h3>
              </div>
              <button onClick={() => setShowEmbedForm(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-sm text-gray-600">
                Pasang form lead capture di website Anda. Lead yang masuk akan otomatis tercatat di Customer Pipeline.
              </p>

              {/* Direct Link */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Link2 className="w-4 h-4 text-brand-600" />
                  <h4 className="font-medium">Link Langsung</h4>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}/lead-form?source=website`}
                    className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/lead-form?source=website`);
                    }}
                    className="px-3 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Iframe Embed */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Code className="w-4 h-4 text-brand-600" />
                  <h4 className="font-medium">Embed HTML</h4>
                </div>
                <textarea
                  readOnly
                  value={`<iframe src="${window.location.origin}/lead-form?source=website" width="100%" height="600" frameborder="0" style="border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"></iframe>`}
                  rows={4}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-mono"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`<iframe src="${window.location.origin}/lead-form?source=website" width="100%" height="600" frameborder="0" style="border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"></iframe>`);
                  }}
                  className="mt-2 text-sm text-brand-600 hover:text-brand-700"
                >
                  Salin Kode
                </button>
              </div>

              {/* Preview Link */}
              <a
                href="/lead-form?source=preview"
                target="_blank"
                className="flex items-center justify-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Preview Form</span>
              </a>
            </div>
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={() => setShowEmbedForm(false)}
                className="w-full py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Follow-up Form Modal */}
      {showFollowUpForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Jadwalkan Follow Up</h3>
              <button onClick={() => setShowFollowUpForm(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Jenis Follow Up</label>
                <div className="grid grid-cols-3 gap-2">
                  {ACTIVITY_TYPES.slice(0, 6).map((type) => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.id}
                        onClick={() => setFollowUpForm({ ...followUpForm, type: type.id })}
                        className={`p-2 rounded-lg border text-center transition-colors ${
                          followUpForm.type === type.id
                            ? 'border-brand-500 bg-brand-50 text-brand-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Icon className="w-5 h-5 mx-auto mb-1" />
                        <span className="text-xs">{type.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Follow Up</label>
                <input
                  type="date"
                  value={followUpForm.scheduledDate}
                  onChange={(e) => setFollowUpForm({ ...followUpForm, scheduledDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
                <textarea
                  value={followUpForm.notes}
                  onChange={(e) => setFollowUpForm({ ...followUpForm, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500"
                  placeholder="Apa yang akan difollow up..."
                />
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 flex gap-2">
              <button
                onClick={() => setShowFollowUpForm(false)}
                className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  if (selectedCustomerData) {
                    addActivity({
                      type: 'crm',
                      action: `Follow Up Dijadwalkan (${ACTIVITY_TYPES.find(t => t.id === followUpForm.type)?.label})`,
                      detail: `${selectedCustomerData.name}: ${followUpForm.notes} - ${followUpForm.scheduledDate}`,
                    });
                    setShowFollowUpForm(false);
                    setFollowUpForm({ type: 'call', scheduledDate: '', scheduledTime: '09:00', notes: '', assignedTo: '' });
                  }
                }}
                disabled={!followUpForm.scheduledDate}
                className="flex-1 py-2 bg-gradient-to-r from-brand-600 to-brand-500 text-white rounded-lg font-medium hover:shadow-md disabled:opacity-50"
              >
                Jadwalkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Set Reminder Modal */}
      {showSetReminder && selectedCustomerData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in duration-200">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
                    <CalendarClock className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Set Follow-up Reminder</h3>
                    <p className="text-sm text-gray-500">{selectedCustomerData.name}</p>
                  </div>
                </div>
                <button onClick={() => setShowSetReminder(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-4 space-y-4">
              {/* Quick Date Buttons */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Pilih Waktu</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: 'Hari ini', days: 0 },
                    { label: 'Besok', days: 1 },
                    { label: '3 Hari', days: 3 },
                    { label: '1 Minggu', days: 7 },
                  ].map((option) => {
                    const targetDate = new Date();
                    targetDate.setDate(targetDate.getDate() + option.days);
                    const dateStr = targetDate.toISOString().split('T')[0];
                    return (
                      <button
                        key={option.days}
                        onClick={() => setReminderForm({ ...reminderForm, date: dateStr })}
                        className={`p-2 rounded-lg border text-center text-sm transition-colors ${
                          reminderForm.date === dateStr
                            ? 'border-amber-500 bg-amber-50 text-amber-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              
              {/* Custom Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
                  <input
                    type="date"
                    value={reminderForm.date}
                    onChange={(e) => setReminderForm({ ...reminderForm, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Waktu</label>
                  <input
                    type="time"
                    value={reminderForm.time}
                    onChange={(e) => setReminderForm({ ...reminderForm, time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
              
              {/* Reminder Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Jenis Reminder</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'follow-up', label: 'Follow Up', icon: Phone },
                    { id: 'meeting', label: 'Meeting', icon: Video },
                    { id: 'call', label: 'Telepon', icon: PhoneCall },
                  ].map((type) => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.id}
                        onClick={() => setReminderForm({ ...reminderForm, type: type.id })}
                        className={`p-2 rounded-lg border text-center transition-colors ${
                          reminderForm.type === type.id
                            ? 'border-amber-500 bg-amber-50 text-amber-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Icon className="w-5 h-5 mx-auto mb-1" />
                        <span className="text-xs">{type.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              
              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Catatan (opsional)</label>
                <textarea
                  value={reminderForm.notes}
                  onChange={(e) => setReminderForm({ ...reminderForm, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  placeholder="Apa yang perlu ditanyakan atau difollow up..."
                />
              </div>
              
              {/* WhatsApp Template Preview */}
              {reminderForm.date && (
                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageCircle className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm font-medium text-emerald-700">Preview Pesan WhatsApp</span>
                  </div>
                  <p className="text-sm text-emerald-800">
                    Halo {selectedCustomerData.name}, ini follow-up dari kami mengenai 
                    {reminderForm.notes ? ` ${reminderForm.notes}` : ' penawaran kami sebelumnya'}. 
                    Bagaimana kabarnya?
                  </p>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-gray-200 flex gap-2">
              <button
                onClick={() => setShowSetReminder(false)}
                className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={handleSetReminder}
                disabled={!reminderForm.date}
                className="flex-1 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg font-medium hover:shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Bell className="w-4 h-4" />
                Set Reminder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
