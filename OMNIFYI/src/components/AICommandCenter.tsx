import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Sparkles, Send, X, CheckCircle2, AlertTriangle,
  ShoppingCart, ArrowRightLeft, Pencil, ListPlus,
  Calculator, CreditCard, ClipboardCheck,
  ChevronRight, Mic, MicOff, Square,
  Zap, FileText, TrendingUp, Package, RotateCcw,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useData } from '../store/dataStore';

interface ParsedAction {
  type: 'purchase' | 'income' | 'debt' | 'transfer' | 'rename' | 'todo' | 'update_task' | 'estimate' | 'expense' | 'unknown';
  icon: any;
  color: string;
  title: string;
  description: string;
  details: Record<string, string>;
  confidence: number;
  execute: () => void;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onNavigate: (path: string) => void;
}

type TemplateCategory = 'purchase' | 'payment' | 'project' | 'task' | 'finance';

interface TemplateItem {
  category: TemplateCategory;
  icon: any;
  color: string;
  template: string;
  label: string;
}

export function AICommandCenter({ open, onClose, onNavigate }: Props) {
  const [input, setInput] = useState('');
  const [phase, setPhase] = useState<'input' | 'processing' | 'confirm' | 'success'>('input');
  const [parsed, setParsed] = useState<ParsedAction | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [activeCategory, setActiveCategory] = useState<TemplateCategory | 'all'>('all');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  const data = useData();

  const activeProjects = data.projects.filter(p => p.status === 'Active' || p.status === 'Planning');
  const projectNames = activeProjects.map(p => p.name);

  // Build dynamic templates using REAL project names
  const getTemplates = useCallback((): TemplateItem[] => {
    const p1 = projectNames[0] || 'Renovasi Rumah';
    const p2 = projectNames[1] || 'Interior Office';
    const p3 = projectNames[2] || 'Villa Bali';
    const c1 = data.customers.find(c => c.status === 'Active')?.name || 'Pak Budi';
    const c2 = data.customers[1]?.name || 'Sarah';

    return [
      { category: 'purchase', icon: ShoppingCart, color: 'bg-orange-50 text-orange-600', template: `beli semen 50 sak @65rb untuk ${p1}`, label: 'Beli material' },
      { category: 'purchase', icon: ShoppingCart, color: 'bg-orange-50 text-orange-600', template: `beli besi hollow 15x30 25 batang @45rb project ${p3}`, label: 'Beli besi' },
      { category: 'purchase', icon: Package, color: 'bg-orange-50 text-orange-600', template: `beli cat dulux 10 kaleng @350rb untuk ${p2}`, label: 'Beli cat' },
      { category: 'payment', icon: CreditCard, color: 'bg-emerald-50 text-emerald-600', template: `terima dp ${c1} 50% project ${p1}`, label: 'Terima DP' },
      { category: 'payment', icon: CreditCard, color: 'bg-emerald-50 text-emerald-600', template: `terima pelunasan ${c2} project ${p2}`, label: 'Terima pelunasan' },
      { category: 'payment', icon: AlertTriangle, color: 'bg-amber-50 text-amber-600', template: `hutang ke Toko Maju Jaya 5jt`, label: 'Catat hutang' },
      { category: 'finance', icon: ArrowRightLeft, color: 'bg-blue-50 text-blue-600', template: `pindah saldo ${p1} ke ${p3} senilai 10jt`, label: 'Transfer saldo' },
      { category: 'finance', icon: TrendingUp, color: 'bg-blue-50 text-blue-600', template: `bayar tukang harian 5 orang @200rb project ${p3}`, label: 'Bayar tukang' },
      { category: 'project', icon: Pencil, color: 'bg-purple-50 text-purple-600', template: `ganti nama ${p2} menjadi Modern Office Design`, label: 'Rename project' },
      { category: 'project', icon: Calculator, color: 'bg-indigo-50 text-indigo-600', template: `hitung estimasi keramik 60x60 24m2, cat dinding 45m2, plafon gypsum 18m2`, label: 'Buat estimasi' },
      { category: 'task', icon: ListPlus, color: 'bg-teal-50 text-teal-600', template: `tambah todo "pasang rangka atap" project ${p1}`, label: 'Tambah task' },
      { category: 'task', icon: ClipboardCheck, color: 'bg-green-50 text-green-600', template: `update pengelasan selesai hari ini project ${p1}`, label: 'Update progress' },
      { category: 'task', icon: ListPlus, color: 'bg-teal-50 text-teal-600', template: `tambah todo "order keramik bathroom" project ${p3}`, label: 'Tambah task 2' },
      { category: 'task', icon: ClipboardCheck, color: 'bg-green-50 text-green-600', template: `selesai pemasangan pipa air project ${p3}`, label: 'Selesai task' },
    ];
  }, [projectNames, data.customers]);

  const categoryTabs: { id: TemplateCategory | 'all'; label: string; icon: any }[] = [
    { id: 'all', label: 'Semua', icon: Zap },
    { id: 'purchase', label: 'Pembelian', icon: ShoppingCart },
    { id: 'payment', label: 'Pembayaran', icon: CreditCard },
    { id: 'finance', label: 'Keuangan', icon: TrendingUp },
    { id: 'project', label: 'Project', icon: FileText },
    { id: 'task', label: 'Task', icon: ListPlus },
  ];

  // Voice Recognition Setup
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setVoiceSupported(true);
      const recognition = new SpeechRecognition();
      recognition.lang = 'id-ID';
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const t = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += t;
          } else {
            interimTranscript += t;
          }
        }
        if (finalTranscript) {
          setInput(prev => (prev ? prev + ' ' : '') + finalTranscript.trim());
        } else if (interimTranscript) {
          // Show interim in a subtle way - we'll just let it accumulate
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  useEffect(() => {
    if (open) {
      setPhase('input');
      setInput('');
      setParsed(null);
      setIsListening(false);
      setActiveCategory('all');
      setTimeout(() => inputRef.current?.focus(), 200);
    } else {
      if (recognitionRef.current && isListening) {
        recognitionRef.current.stop();
        setIsListening(false);
      }
    }
  }, [open]);

  const toggleVoice = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch {
        setIsListening(false);
      }
    }
  };

  const parseCommand = (text: string): ParsedAction => {
    const lower = text.toLowerCase().trim();

    // Find project by name match
    const findProjectByName = (): typeof data.projects[0] | null => {
      for (const p of data.projects) {
        if (lower.includes(p.name.toLowerCase())) return p;
      }
      // fallback to ID match
      const idMatch = lower.match(/prj-?\d+/i);
      if (idMatch) {
        const found = data.projects.find(p => p.id.toLowerCase() === idMatch[0].toLowerCase().replace(/prj(\d)/, 'PRJ-00$1').replace(/prj-?0*(\d{3})/, 'PRJ-$1'));
        if (found) return found;
      }
      return null;
    };

    const findCustomerByName = (): typeof data.customers[0] | null => {
      for (const c of data.customers) {
        if (lower.includes(c.name.toLowerCase())) return c;
      }
      return null;
    };

    const proj = findProjectByName();
    const cust = findCustomerByName();

    // PURCHASE
    if (lower.match(/^(beli|purchase|buy)\s/)) {
      const qtyMatch = lower.match(/(\d+)\s*(pcs|batang|sak|kg|meter|lembar|buah|unit|kaleng|m2|m²|roll|set|dus|box)/);
      const priceMatch = lower.match(/@(\d+(?:[.,]\d+)?)\s*(rb|ribu|k|jt|juta)?/);
      const qty = qtyMatch ? parseInt(qtyMatch[1]) : 1;
      const unit = qtyMatch ? qtyMatch[2] : 'pcs';
      let price = priceMatch ? parseFloat(priceMatch[1].replace(',', '.')) : 0;
      if (priceMatch?.[2]?.match(/rb|ribu|k/)) price *= 1000;
      if (priceMatch?.[2]?.match(/jt|juta/)) price *= 1000000;
      const itemName = lower.replace(/^(beli|purchase|buy)\s+/, '').replace(/\d+\s*(pcs|batang|sak|kg|meter|lembar|buah|unit|kaleng|m2|m²|roll|set|dus|box)/, '').replace(/@\S+/, '').replace(/untuk\s+.*/i, '').replace(/project\s+.*/i, '').trim();

      return {
        type: 'purchase', icon: ShoppingCart, color: 'text-orange-600 bg-orange-50',
        title: 'Purchase / Pembelian',
        description: `Beli ${itemName}`,
        details: {
          'Item': itemName || 'Unknown item',
          'Quantity': `${qty} ${unit}`,
          'Unit Price': price > 0 ? `Rp ${price.toLocaleString('id-ID')}` : 'Not specified',
          'Total': price > 0 ? `Rp ${(qty * price).toLocaleString('id-ID')}` : '-',
          'Project': proj?.name || 'Not specified',
          'Category': 'Material',
        },
        confidence: price > 0 ? 0.94 : 0.72,
        execute: () => {
          data.addTransaction({
            date: new Date().toISOString().split('T')[0],
            desc: text, type: 'Expense', category: 'Material',
            amount: qty * price, projectId: proj?.id || null, supplierId: null, status: 'Completed',
          });
        },
      };
    }

    // INCOME / DP
    if (lower.match(/(terima|receive|dp|down\s*payment|pembayaran|bayaran dari|pelunasan)/)) {
      const amountMatch = lower.match(/(\d+(?:[.,]\d+)?)\s*(rb|ribu|k|jt|juta|m)?(%)?/);
      let amount = amountMatch ? parseFloat(amountMatch[1].replace(',', '.')) : 0;
      if (amountMatch?.[2]?.match(/rb|ribu|k/)) amount *= 1000;
      if (amountMatch?.[2]?.match(/jt|juta/)) amount *= 1000000;
      if (amountMatch?.[2] === 'm') amount *= 1000000;
      const isPercent = !!amountMatch?.[3] || lower.includes('%');
      const finalAmount = isPercent && proj ? proj.budget * (amount / 100) : amount;

      return {
        type: 'income', icon: CreditCard, color: 'text-emerald-600 bg-emerald-50',
        title: 'Income / Penerimaan',
        description: `Terima pembayaran${isPercent ? ` (${amount}%)` : ''}`,
        details: {
          'Type': isPercent ? `Down Payment ${amount}%` : lower.includes('pelunasan') ? 'Final Payment' : 'Payment',
          'Amount': `Rp ${finalAmount.toLocaleString('id-ID')}`,
          'Project': proj?.name || 'Not specified',
          'Customer': cust?.name || (proj ? (data.getCustomer(proj.customerId)?.name || '-') : '-'),
          'Category': 'Client Payment',
        },
        confidence: 0.91,
        execute: () => {
          data.addTransaction({
            date: new Date().toISOString().split('T')[0],
            desc: text, type: 'Income', category: 'Client Payment',
            amount: finalAmount, projectId: proj?.id || null, supplierId: null, status: 'Completed',
          });
        },
      };
    }

    // DEBT / HUTANG
    if (lower.match(/(hutang|payable|kredit ke|credit to)/)) {
      const amountMatch = lower.match(/(\d+(?:[.,]\d+)?)\s*(rb|ribu|k|jt|juta|m)?/);
      let amount = amountMatch ? parseFloat(amountMatch[1].replace(',', '.')) : 0;
      if (amountMatch?.[2]?.match(/rb|ribu|k/)) amount *= 1000;
      if (amountMatch?.[2]?.match(/jt|juta/)) amount *= 1000000;
      if (amountMatch?.[2] === 'm') amount *= 1000000;
      const supplierMatch = lower.match(/(?:ke|to|dari)\s+([a-zA-Z\s]+?)(?:\s+\d|$)/);
      const supplier = supplierMatch ? supplierMatch[1].trim() : 'Unknown';

      return {
        type: 'debt', icon: AlertTriangle, color: 'text-amber-600 bg-amber-50',
        title: 'Hutang / Account Payable',
        description: `Catat hutang ke ${supplier}`,
        details: {
          'Supplier': supplier,
          'Amount': `Rp ${amount.toLocaleString('id-ID')}`,
          'Type': 'Account Payable',
          'Project': proj?.name || 'General',
        },
        confidence: 0.88,
        execute: () => {
          data.addTransaction({
            date: new Date().toISOString().split('T')[0],
            desc: text, type: 'Expense', category: 'Account Payable',
            amount, projectId: proj?.id || null, supplierId: null, status: 'Pending',
          });
        },
      };
    }

    // TRANSFER BUDGET
    if (lower.match(/(pindah|transfer|move)\s+(saldo|budget|dana)/)) {
      const amountMatch = lower.match(/(\d+(?:[.,]\d+)?)\s*(rb|ribu|k|jt|juta|m)?/);
      let amount = amountMatch ? parseFloat(amountMatch[1].replace(',', '.')) : 0;
      if (amountMatch?.[2]?.match(/rb|ribu|k/)) amount *= 1000;
      if (amountMatch?.[2]?.match(/jt|juta/)) amount *= 1000000;
      if (amountMatch?.[2] === 'm') amount *= 1000000;
      // Find two project names
      const foundProjects: typeof data.projects = [];
      for (const p of data.projects) {
        if (lower.includes(p.name.toLowerCase())) foundProjects.push(p);
      }
      const fromP = foundProjects[0] || data.projects[0];
      const toP = foundProjects[1] || data.projects[1];

      return {
        type: 'transfer', icon: ArrowRightLeft, color: 'text-blue-600 bg-blue-50',
        title: 'Budget Transfer',
        description: `Transfer saldo antar project`,
        details: {
          'From': fromP?.name || 'Unknown',
          'To': toP?.name || 'Unknown',
          'Amount': `Rp ${amount.toLocaleString('id-ID')}`,
        },
        confidence: foundProjects.length >= 2 ? 0.92 : 0.75,
        execute: () => {
          if (fromP && toP) data.transferBudget(fromP.id, toP.id, amount);
        },
      };
    }

    // RENAME PROJECT
    if (lower.match(/(ganti nama|rename|ubah nama)/)) {
      const targetP = proj || data.projects[0];
      const nameMatch = lower.match(/(?:menjadi|menjd|to|jadi|=>)\s+["']?(.+?)["']?$/);
      const newName = nameMatch ? nameMatch[1].trim() : 'Untitled';

      return {
        type: 'rename', icon: Pencil, color: 'text-purple-600 bg-purple-50',
        title: 'Rename Project',
        description: `Ubah nama project`,
        details: {
          'Project': targetP?.name || 'Unknown',
          'New Name': newName,
        },
        confidence: 0.92,
        execute: () => {
          if (targetP) data.renameProject(targetP.id, newName);
        },
      };
    }

    // ADD TODO
    if (lower.match(/(tambah|add)\s+(todo|task|tugas|pekerjaan)/)) {
      const titleMatch = lower.match(/(?:todo|task|tugas|pekerjaan)\s+["'](.+?)["']/i) || lower.match(/(?:todo|task|tugas|pekerjaan)\s+(.+?)\s+(?:project|untuk|ke|di)/i) || lower.match(/(?:todo|task|tugas|pekerjaan)\s+(.+)$/i);
      const taskTitle = titleMatch ? titleMatch[1].replace(/["']/g, '').trim() : 'New task';

      return {
        type: 'todo', icon: ListPlus, color: 'text-teal-600 bg-teal-50',
        title: 'Add Task / Todo',
        description: `Tambah task baru`,
        details: {
          'Task': taskTitle,
          'Project': proj?.name || 'Not specified',
          'Status': 'To Do',
          'Priority': 'Medium',
        },
        confidence: 0.90,
        execute: () => {
          if (proj) {
            data.addTask(proj.id, {
              title: taskTitle, milestoneId: '',
              description: '', status: 'To Do', priority: 'Medium',
              assignee: '', assignees: [], dueDate: '', labels: [], subtasks: [],
              comments: 0, attachments: 0, timeLogged: '0h', startDay: 0, duration: 5,
            });
          }
        },
      };
    }

    // UPDATE TASK
    if (lower.match(/(update|selesai|complete|done|finish|progres)/)) {
      const desc = lower.replace(/(update|selesai|complete|done|finish|progres)\s*/i, '').replace(/hari\s*ini/i, '').trim();

      return {
        type: 'update_task', icon: ClipboardCheck, color: 'text-green-600 bg-green-50',
        title: 'Update Progress',
        description: `Update task progress`,
        details: {
          'Activity': desc || 'Task update',
          'Project': proj?.name || 'Not specified',
          'Status': 'In Progress → Done',
          'Date': new Date().toLocaleDateString('id-ID'),
        },
        confidence: 0.86,
        execute: () => {
          data.addActivity({
            type: 'task', action: 'Progress Updated',
            detail: `${desc} - ${proj?.name || 'Unknown'}`,
            entityId: proj?.id || undefined,
          });
        },
      };
    }

    // ESTIMATE
    if (lower.match(/(hitung|estimasi|estimate|kalkulasi|calc)/)) {
      return {
        type: 'estimate', icon: Calculator, color: 'text-indigo-600 bg-indigo-50',
        title: 'Create Estimation',
        description: `Buat estimasi baru`,
        details: {
          'Input': lower.replace(/(hitung|estimasi|estimate|kalkulasi|calc)\s*/i, '').trim() || 'Items to estimate',
          'Action': 'Navigate to Estimator page',
        },
        confidence: 0.95,
        execute: () => {
          onNavigate('/estimator');
        },
      };
    }

    // BAYAR TUKANG / EXPENSE
    if (lower.match(/(bayar|pay|upah)/)) {
      const amountMatch = lower.match(/(\d+(?:[.,]\d+)?)\s*(rb|ribu|k|jt|juta|m)?/);
      let price = amountMatch ? parseFloat(amountMatch[1].replace(',', '.')) : 0;
      if (amountMatch?.[2]?.match(/rb|ribu|k/)) price *= 1000;
      if (amountMatch?.[2]?.match(/jt|juta/)) price *= 1000000;
      const qtyMatch = lower.match(/(\d+)\s*(orang|org|tukang|pekerja)/);
      const qty = qtyMatch ? parseInt(qtyMatch[1]) : 1;
      const total = qty > 1 && price > 0 ? qty * price : price;
      const desc = lower.replace(/^(bayar|pay|upah)\s*/i, '').replace(/project\s+.*/i, '').replace(/untuk\s+.*/i, '').trim();

      return {
        type: 'expense', icon: CreditCard, color: 'text-rose-600 bg-rose-50',
        title: 'Expense / Pembayaran',
        description: `Bayar ${desc}`,
        details: {
          'Description': desc,
          'Qty': qty > 1 ? `${qty} orang` : '-',
          'Rate': price > 0 ? `Rp ${price.toLocaleString('id-ID')}` : '-',
          'Total': `Rp ${total.toLocaleString('id-ID')}`,
          'Project': proj?.name || 'Not specified',
          'Category': 'Labor',
        },
        confidence: 0.89,
        execute: () => {
          data.addTransaction({
            date: new Date().toISOString().split('T')[0],
            desc: text, type: 'Expense', category: 'Labor',
            amount: total, projectId: proj?.id || null, supplierId: null, status: 'Completed',
          });
        },
      };
    }

    return {
      type: 'unknown', icon: Sparkles, color: 'text-gray-600 bg-gray-100',
      title: 'Action Not Recognized',
      description: 'Coba ulangi dengan kata kunci: beli, terima, hutang, pindah saldo, ganti nama, tambah todo, update, hitung estimasi, bayar',
      details: { 'Input': text },
      confidence: 0.30,
      execute: () => {},
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    if (isListening) { recognitionRef.current?.stop(); setIsListening(false); }
    setPhase('processing');
    setTimeout(() => {
      const result = parseCommand(input);
      setParsed(result);
      setPhase('confirm');
    }, 1200);
  };

  const handleConfirm = () => {
    if (parsed) {
      parsed.execute();
      setPhase('success');
      setTimeout(() => onClose(), 1500);
    }
  };

  const handleUseSuggestion = (template: string) => {
    setInput(template);
    inputRef.current?.focus();
  };

  if (!open) return null;

  const templates = getTemplates();
  const filteredTemplates = activeCategory === 'all' ? templates : templates.filter(t => t.category === activeCategory);

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose} />

      <div className="relative w-full md:max-w-xl bg-white md:rounded-2xl rounded-t-3xl shadow-2xl animate-fade-in-up max-h-[92vh] md:max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white shadow-lg shadow-brand-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-base">AI Command Center</h2>
              <p className="text-[11px] text-gray-400">Ketik atau bicara perintah apapun</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
          {/* Input Phase */}
          {phase === 'input' && (
            <>
              <form onSubmit={handleSubmit}>
                <div className="relative">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ketik perintah bebas atau tekan 🎙 untuk bicara..."
                    className={cn(
                      "w-full bg-gray-50 border rounded-2xl p-4 pr-24 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 focus:bg-white transition-all min-h-[90px] resize-none",
                      isListening ? "border-brand-400 bg-brand-50/30 ring-2 ring-brand-500/20" : "border-gray-200"
                    )}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e); } }}
                  />
                  <div className="absolute bottom-3 right-3 flex items-center gap-1.5">
                    {/* Voice Button */}
                    {voiceSupported && (
                      <button
                        type="button"
                        onClick={toggleVoice}
                        className={cn(
                          "w-9 h-9 rounded-xl flex items-center justify-center transition-all",
                          isListening
                            ? "bg-red-500 text-white animate-voice-pulse"
                            : "bg-gray-100 text-gray-500 hover:bg-brand-50 hover:text-brand-600"
                        )}
                        title={isListening ? "Berhenti" : "Voice command"}
                      >
                        {isListening ? <Square className="w-3.5 h-3.5" /> : <Mic className="w-4 h-4" />}
                      </button>
                    )}
                    {/* Send Button */}
                    <button
                      type="submit"
                      disabled={!input.trim()}
                      className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:shadow-md active:scale-90"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                  {isListening && (
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-red-50 text-red-600 px-2 py-1 rounded-lg text-[10px] font-bold animate-pulse">
                      <MicOff className="w-3 h-3" />
                      Mendengarkan...
                    </div>
                  )}
                </div>
              </form>

              {/* Category Filter Tabs */}
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar -mx-1 px-1">
                {categoryTabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveCategory(tab.id)}
                    className={cn(
                      "flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all",
                      activeCategory === tab.id
                        ? "bg-brand-500 text-white shadow-md shadow-brand-500/25"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    )}
                  >
                    <tab.icon className="w-3 h-3" />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Template Commands - Click to Paste */}
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Zap className="w-3 h-3" /> Klik untuk paste ke input
                </p>
                <div className="space-y-1">
                  {filteredTemplates.map((t, i) => (
                    <button
                      key={i}
                      onClick={() => handleUseSuggestion(t.template)}
                      className="w-full flex items-center gap-3 p-2.5 rounded-xl text-left hover:bg-gray-50 transition-all text-sm text-gray-600 group active:scale-[0.98]"
                    >
                      <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all", t.color)}>
                        <t.icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">{t.label}</p>
                        <p className="text-xs text-gray-600 truncate group-hover:text-brand-700 transition-colors">{t.template}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Processing Phase */}
          {phase === 'processing' && (
            <div className="flex flex-col items-center justify-center py-12 animate-fade-in">
              <div className="relative mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white shadow-xl shadow-brand-500/30">
                  <Sparkles className="w-7 h-7 animate-pulse" />
                </div>
                <div className="absolute -inset-3 rounded-2xl border-2 border-brand-300 animate-ping opacity-30" />
              </div>
              <p className="font-bold text-gray-900 mb-1">AI is analyzing...</p>
              <p className="text-sm text-gray-400">Parsing your command</p>
              <div className="mt-4 flex items-center gap-1.5">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-2 h-2 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                ))}
              </div>
              <div className="mt-6 bg-gray-50 rounded-xl p-3 max-w-sm w-full">
                <p className="text-xs text-gray-500 italic text-center">"{input}"</p>
              </div>
            </div>
          )}

          {/* Confirmation Phase */}
          {phase === 'confirm' && parsed && (
            <div className="space-y-4 animate-fade-in-up">
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <div className={cn("flex items-center gap-3 p-4 border-b border-gray-100", parsed.color.split(' ')[1])}>
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", parsed.color)}>
                    <parsed.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 text-sm">{parsed.title}</p>
                    <p className="text-xs text-gray-500">{parsed.description}</p>
                  </div>
                  <div className={cn(
                    "text-xs font-bold px-2.5 py-1 rounded-full",
                    parsed.confidence >= 0.9 ? "bg-green-100 text-green-700" :
                    parsed.confidence >= 0.7 ? "bg-amber-100 text-amber-700" :
                    "bg-red-100 text-red-700"
                  )}>
                    {Math.round(parsed.confidence * 100)}% match
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  {Object.entries(parsed.details).map(([key, value]) => (
                    <div key={key} className="flex items-start justify-between text-sm">
                      <span className="text-gray-400 flex-shrink-0">{key}</span>
                      <span className="font-semibold text-gray-900 text-right ml-4">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Original Input</p>
                <p className="text-sm text-gray-600 italic">"{input}"</p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleConfirm}
                  disabled={parsed.type === 'unknown'}
                  className="flex-1 py-3 bg-gradient-to-r from-brand-600 to-brand-500 text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-brand-500/25 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Confirm & Execute
                </button>
                <button
                  onClick={() => { setPhase('input'); setParsed(null); }}
                  className="px-5 py-3 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-all flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Edit
                </button>
              </div>
            </div>
          )}

          {/* Success Phase */}
          {phase === 'success' && (
            <div className="flex flex-col items-center justify-center py-16 animate-scale-in">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <p className="font-bold text-gray-900 text-lg mb-1">Done!</p>
              <p className="text-sm text-gray-400">Action executed successfully</p>
            </div>
          )}
        </div>

        <div className="h-safe md:hidden" />
      </div>
    </div>
  );
}
