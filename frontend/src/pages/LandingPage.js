import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  Globe, 
  ShieldCheck, 
  Banknote, 
  Truck, 
  Headphones, 
  MessageSquare, 
  Send, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  ArrowRight, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Menu,
  Building2,
  Cpu,
  Zap,
  Star,
  CreditCard,
  Wallet,
  Smartphone
} from 'lucide-react';

// --- DATA CONSTANTS ---
const SLIDES = [
  {
    img: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=1400&q=80',
    title: 'PT Abnan Inti Trans',
    sub: 'Solusi Export Import & Distribusi Alat Telekomunikasi Terpercaya',
    cta: 'Konsultasi Gratis',
  },
  {
    img: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=1400&q=80',
    title: 'Pengalaman 3 Tahun Global',
    sub: 'Negosiasi harga terbaik, menekan biaya pembelian 1-6 Miliar Rupiah',
    cta: 'Lihat Produk',
  },
  {
    img: 'https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?w=1400&q=80',
    title: 'Pembayaran Mudah & Aman',
    sub: 'Tersedia via Indomaret, Alfamart, Transfer Bank, dan Midtrans',
    cta: 'Mulai Sekarang',
  },
];

const BRANDS = ['Agroplush','Huawei','Juniper','ZTE','Huawei Enterprise','Cisco','Mikrotik','TP-Link','Ruckus','Fortinet'];

const PARTNERS = [
  { name: 'Awinet', role: 'Partner Distribusi', icon: <Globe size={20} /> },
  { name: 'Fen', role: 'Partner Logistik', icon: <Truck size={20} /> },
  { name: 'Raju', role: 'Partner Ekspor', icon: <ShieldCheck size={20} /> },
  { name: 'Tink Net', role: 'Partner Networking', icon: <Cpu size={20} /> },
];

const TOOLS = ['Switch Jaringan', 'Router Enterprise', 'Fiber Optic', 'Access Point', 'Server Rack', 'UPS & Power', 'Kabel Telekomunikasi', 'Antena Tower', 'Peralatan Pertanian', 'Perangkat IoT'];

const PAYMENT_METHODS = [
  { icon: <Building2 />, name: 'Indomaret', desc: 'Gerai Terdekat' },
  { icon: <Building2 />, name: 'Alfamart', desc: 'Akses 24 Jam' },
  { icon: <CreditCard />, name: 'Midtrans', desc: 'Credit/Debit Card' },
  { icon: <Banknote />, name: 'Transfer Bank', desc: 'BCA, BRI, Mandiri' },
  { icon: <Smartphone />, name: 'E-Wallet', desc: 'GoPay, OVO, Dana' },
  { icon: <Wallet />, name: 'Virtual Account', desc: 'Instan Konfirmasi' },
];

const CHATBOT_ANSWERS = {
  harga: 'Harga kami sangat kompetitif! Kami mampu menekan biaya pembelian 1-6 Miliar dari harga pasar. Silakan hubungi marketing kami di marketing@abnanintitrans.com untuk penawaran khusus.',
  produk: 'Kami menyediakan: Agroplush, Huawei, Juniper Networks, ZTE, dan banyak brand telekomunikasi lainnya. Ketik nama brand untuk info lebih detail!',
  pengiriman: 'Kami melayani export-import dengan pengalaman 3 tahun. Kami mengurus semua dokumen beacukai dan customs clearance untuk Anda.',
  pembayaran: 'Tersedia: Transfer Bank, Indomaret, Alfamart, Midtrans (kartu kredit/debit), Virtual Account, dan E-Wallet.',
  kontak: 'Hubungi kami:\n📧 marketing@abnanintitrans.com\n📞 Silakan isi form kontak di website',
  default: 'Halo! Saya asisten virtual Abnan. Anda bisa bertanya tentang: produk, harga, pengiriman, atau kontak.',
};

// --- COMPONENTS ---

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const links = [
    { label: 'Beranda', href: '#beranda' },
    { label: 'Tentang', href: '#tentang' },
    { label: 'Produk', href: '#produk' },
    { label: 'Layanan', href: '#layanan' },
    { label: 'Kontak', href: '#kontak' },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 px-4 pt-4`}>
      <div className={`max-w-7xl mx-auto rounded-2xl transition-all duration-500 ${
        scrolled 
        ? 'bg-white/80 backdrop-blur-xl shadow-lg border border-white/20 py-2' 
        : 'bg-white/20 backdrop-blur-xl shadow-lg border border-white/20 py-2'
      }`}>
        <div className="px-6 flex justify-between items-center h-12 ">
          <div className="flex items-center gap-3 group cursor-pointer">
          <img
            src="/LOGO-04.png"
            alt="Logo Abnan CRM"
            className="w-20 h-10 object-contain cursor-pointer"
            onClick={() => navigate('/dashboard')}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
            <span className={`font-bold text-lg tracking-tight transition-colors ${scrolled ? 'text-gray-900' : 'text-gray-900'}`}>
              Abnan <span className={scrolled ? 'text-blue-600' : 'text-blue-600'}>Inti Trans</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {links.map(l => (
              <a key={l.label} href={l.href} className={`text-sm font-semibold transition-all hover:scale-105 ${
                scrolled ? 'text-gray-600 hover:text-blue-600' : 'text-gray-600 hover:text-blue-600'
              }`}>
                {l.label}
              </a>
            ))}
            <Link to="/login" className={`px-5 py-2 rounded-xl text-sm font-bold transition-all active:scale-95 ${
              scrolled 
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 hover:bg-blue-700' 
              : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}>
              Login
            </Link>
          </div>

          <button className="md:hidden p-2" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className={scrolled ? 'text-gray-900' : 'text-white'} /> : <Menu className={scrolled ? 'text-gray-900' : 'text-white'} />}
          </button>
        </div>

        {/* Mobile Menu Slide-in */}
        <div className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${menuOpen ? 'max-h-96 opacity-100 py-4 border-t border-gray-100 mt-2' : 'max-h-0 opacity-0'}`}>
          <div className="px-6 space-y-4 bg-white rounded-b-2xl">
            {links.map(l => (
              <a key={l.label} href={l.href} className="block text-gray-700 font-semibold text-lg py-2" onClick={() => setMenuOpen(false)}>{l.label}</a>
            ))}
            <Link to="/login" className="block w-full text-center bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg" onClick={() => setMenuOpen(false)}>Login</Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

function Carousel() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setCurrent(c => (c + 1) % SLIDES.length), 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div id="beranda" className="relative h-screen overflow-hidden bg-black">
      {SLIDES.map((slide, i) => (
        <div key={i} className={`absolute inset-0 transition-all duration-1000 ease-in-out transform ${
          i === current ? 'opacity-100 scale-100' : 'opacity-0 scale-110'
        }`}>
          <img src={slide.img} alt={slide.title} className="w-full h-full object-cover opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-900/20 to-black/80" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center px-6 max-w-5xl mx-auto">
              <div className="inline-flex items-center gap-2 bg-blue-500/20 backdrop-blur-md text-blue-100 text-xs font-bold px-4 py-1.5 rounded-full mb-6 border border-white/10 tracking-widest uppercase animate-fade-in">
                <Star size={12} className="fill-blue-400 text-blue-400" /> Premium Logistics
              </div>
              <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 tracking-tight leading-tight">
                {slide.title}
              </h1>
              <p className="text-xl md:text-2xl mb-10 text-gray-200 max-w-3xl mx-auto font-medium leading-relaxed">
                {slide.sub}
              </p>
              <div className="flex flex-col sm:flex-row gap-5 justify-center items-center">
                <a href="#kontak" className="group bg-blue-600 hover:bg-blue-500 text-white px-10 py-4 rounded-2xl font-bold transition-all shadow-2xl shadow-blue-600/30 flex items-center gap-2 hover:-translate-y-1 active:scale-95">
                  {slide.cta} <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </a>
                <a href="#produk" className="bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 px-10 py-4 rounded-2xl font-bold transition-all active:scale-95">
                  Lihat Katalog
                </a>
              </div>
            </div>
          </div>
        </div>
      ))}
      
      {/* Controls */}
      <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-3 z-10">
        {SLIDES.map((_, i) => (
          <button key={i} onClick={() => setCurrent(i)} className={`h-1.5 rounded-full transition-all duration-500 ${i === current ? 'bg-blue-500 w-12' : 'bg-white/30 w-4 hover:bg-white/50'}`} />
        ))}
      </div>
    </div>
  );
}

function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([{ from: 'bot', text: 'Halo! Ada yang bisa saya bantu terkait layanan Abnan Inti Trans? 👋' }]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = useCallback(() => {
    if (!input.trim()) return;
    const msg = input.trim().toLowerCase();
    setMessages(m => [...m, { from: 'user', text: input }]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      let reply = CHATBOT_ANSWERS.default;
      if (msg.includes('harga')) reply = CHATBOT_ANSWERS.harga;
      else if (msg.includes('produk')) reply = CHATBOT_ANSWERS.produk;
      else if (msg.includes('kirim')) reply = CHATBOT_ANSWERS.pengiriman;
      else if (msg.includes('bayar')) reply = CHATBOT_ANSWERS.pembayaran;
      else if (msg.includes('kontak')) reply = CHATBOT_ANSWERS.kontak;
      
      setMessages(m => [...m, { from: 'bot', text: reply }]);
      setIsTyping(false);
    }, 1000);
  }, [input]);

  return (
    <div className="fixed bottom-6 right-6 z-[60]">
      {open && (
        <div className="mb-4 w-[340px] sm:w-[380px] bg-white/90 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden flex flex-col animate-slide-up" style={{ height: 480 }}>
          <div className="bg-blue-600 p-5 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
                <Headphones className="text-white" size={20} />
              </div>
              <div>
                <p className="text-white font-bold text-sm tracking-tight">Abnan Virtual Support</p>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <p className="text-blue-100 text-xs font-medium">Online Now</p>
                </div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                  m.from === 'user' 
                  ? 'bg-blue-600 text-white rounded-tr-none' 
                  : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start animate-pulse">
                <div className="bg-gray-200 px-4 py-2 rounded-2xl text-xs text-gray-500">Typing...</div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="p-4 border-t border-gray-100 bg-white flex gap-2">
            <input 
              value={input} 
              onChange={e => setInput(e.target.value)} 
              onKeyDown={e => e.key === 'Enter' && send()} 
              placeholder="Type your question..." 
              className="flex-1 bg-gray-100 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
            <button onClick={send} className="bg-blue-600 text-white w-11 h-11 rounded-xl flex items-center justify-center hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-90">
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
      <button 
        onClick={() => setOpen(!open)} 
        className="bg-blue-600 hover:bg-blue-700 text-white w-16 h-16 rounded-2xl shadow-2xl flex items-center justify-center transition-all transform hover:scale-110 active:scale-95 group relative"
      >
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-white rounded-full" />
        {open ? <X size={28} /> : <MessageSquare size={28} />}
      </button>
    </div>
  );
}

export default function LandingPage() {
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      alert('Terima kasih! Pesan Anda telah diterima oleh tim kami.');
      e.target.reset();
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[#FDFDFF] font-sans text-gray-900 selection:bg-blue-100 selection:text-blue-900">
      <Navbar />
      <Carousel />

      {/* STATS - Glass Cards */}
      <div className="relative -mt-20 z-20 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
          {[
            { n: '3+', l: 'Years Exp', i: <Clock className="text-blue-500" /> },
            { n: '100+', l: 'Happy Clients', i: <User className="text-blue-500" /> },
            { n: 'Rp 6M+', l: 'Cost Savings', i: <Zap className="text-blue-500" /> },
            { n: '10+', l: 'Global Brands', i: <Building2 className="text-blue-500" /> }
          ].map((stat, idx) => (
            <div key={idx} className="bg-white/80 backdrop-blur-xl p-6 md:p-8 rounded-[2rem] border border-white shadow-xl shadow-gray-200/50 flex flex-col items-center text-center transform hover:-translate-y-2 transition-all duration-300">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">{stat.i}</div>
              <p className="text-2xl md:text-4xl font-black tracking-tighter text-gray-900">{stat.n}</p>
              <p className="text-xs md:text-sm font-bold text-gray-400 mt-1 uppercase tracking-widest">{stat.l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* TENTANG KAMI */}
      <section id="tentang" className="py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row gap-16 items-center">
            <div className="md:w-1/2">
              <div className="inline-block px-4 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold mb-6">ABOUT US</div>
              <h2 className="text-4xl md:text-5xl font-black text-gray-900 leading-tight mb-8 tracking-tighter">
                Transformasi Logistik <br/><span className="text-blue-600 underline decoration-blue-200 underline-offset-8">Global ke Lokal.</span>
              </h2>
              <div className="space-y-6 text-gray-600 text-lg leading-relaxed font-medium">
                <p>
                  PT Abnan Inti Trans hadir sebagai mitra strategis dalam pengadaan infrastruktur telekomunikasi skala enterprise dengan standar internasional.
                </p>
                <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                  <p className="text-blue-700 italic">"Kami tidak hanya mengirim barang, kami memberikan efisiensi biaya nyata hingga 6 Miliar Rupiah per proyek melalui negosiasi global."</p>
                </div>
              </div>
            </div>
            
            <div className="md:w-1/2 grid grid-cols-2 gap-4">
              {PARTNERS.map(p => (
                <div key={p.name} className="group bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-blue-200/40 transition-all duration-500">
                  <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-blue-200">
                    {p.icon}
                  </div>
                  <h4 className="text-xl font-bold text-gray-900">{p.name}</h4>
                  <p className="text-sm font-medium text-gray-400 mt-1">{p.role}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* TOOLS CLOUD */}
      <section className="pb-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-wrap gap-3 justify-center">
            {TOOLS.map(tool => (
              <span key={tool} className="bg-white px-6 py-3 rounded-2xl text-sm font-bold text-gray-700 shadow-sm border border-gray-100 hover:border-blue-200 hover:text-blue-600 cursor-default transition-all hover:scale-105 active:scale-95">
                {tool}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* PRODUK & BRAND - Grid Modern */}
      <section id="produk" className="py-32 bg-gray-50/50 rounded-[3rem] mx-4 border border-gray-100 shadow-inner">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-black tracking-tighter mb-4">Authorized Brands</h2>
            <p className="text-gray-500 font-medium max-w-xl mx-auto">Kami menjamin keaslian perangkat dengan dukungan teknis langsung dari manufaktur global.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {BRANDS.map((brand, i) => (
              <div key={i} className="group bg-white rounded-[2rem] p-8 flex flex-col items-center justify-center border border-gray-100 hover:border-blue-200 shadow-sm hover:shadow-xl transition-all cursor-pointer">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-600 transition-colors">
                   <Zap className="text-blue-600 group-hover:text-white transition-colors" size={24} />
                </div>
                <p className="font-extrabold text-gray-800 text-sm tracking-tight text-center">{brand}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LAYANAN - iOS Feature Cards */}
      <section id="layanan" className="py-32">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-20">Keunggulan Layanan</h2>
          <div className="grid md:grid-cols-3 gap-10">
            {[
              { icon: <Globe className="text-blue-600" />, title: 'Global Sourcing', desc: 'Akses langsung ke pabrik utama di Asia Pasifik dan Eropa.' },
              { icon: <ShieldCheck className="text-blue-600" />, title: 'Safe & Compliant', desc: 'Pengurusan dokumen bea cukai 100% legal dan transparan.' },
              { icon: <Zap className="text-blue-600" />, title: 'Cost Efficiency', desc: 'Negosiasi harga bulk untuk proyek skala besar (Enterprise).' },
            ].map((item, i) => (
              <div key={i} className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 group">
                <div className="w-20 h-20 bg-blue-50 rounded-[2rem] flex items-center justify-center mb-8 mx-auto group-hover:scale-110 transition-transform">
                  {item.icon}
                </div>
                <h3 className="text-2xl font-black mb-4 tracking-tight">{item.title}</h3>
                <p className="text-gray-500 font-medium leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Payment Gateway - Premium Glass */}
          <div className="mt-24 p-8 md:p-16 rounded-[4rem] bg-gradient-to-br from-blue-700 to-blue-900 text-white relative overflow-hidden shadow-2xl shadow-blue-900/30">
            <div className="relative z-10">
              <h3 className="text-3xl font-black mb-12 tracking-tight">Metode Pembayaran Secure</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                {PAYMENT_METHODS.map(pm => (
                  <div key={pm.name} className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/10 hover:bg-white/20 transition-all flex flex-col items-center">
                    <div className="mb-4 text-blue-200">{pm.icon}</div>
                    <p className="font-bold text-sm mb-1">{pm.name}</p>
                    <p className="text-[10px] text-blue-200 font-medium">{pm.desc}</p>
                  </div>
                ))}
              </div>
            </div>
            {/* Abstract Background Shapes */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400 rounded-full blur-[100px] opacity-20 -mr-20 -mt-20" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-300 rounded-full blur-[100px] opacity-10 -ml-20 -mb-20" />
          </div>
        </div>
      </section>

      {/* KONTAK - Modern Form */}
      <section id="kontak" className="py-32 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-white rounded-[4rem] shadow-2xl shadow-gray-200/50 border border-gray-100 overflow-hidden flex flex-col lg:flex-row">
            <div className="lg:w-2/5 bg-blue-600 p-12 md:p-16 text-white flex flex-col justify-between">
              <div>
                <h2 className="text-4xl font-black tracking-tighter mb-6">Mulai Proyek <br/>Bersama Kami</h2>
                <p className="text-blue-100 font-medium mb-12">Konsultasikan kebutuhan hardware dan logistik Anda hari ini.</p>
                <div className="space-y-8">
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md"><Mail size={24}/></div>
                    <p className="font-bold">marketing@abnanintitrans.com</p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md"><Phone size={24}/></div>
                    <p className="font-bold">+62 812 XXXX XXXX</p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md"><MapPin size={24}/></div>
                    <p className="font-bold italic text-sm text-blue-200">Alamat Segera Tersedia</p>
                  </div>
                </div>
              </div>
              <div className="mt-16 pt-8 border-t border-white/10 text-xs text-blue-200 font-medium">
                Jam Operasional: Sen - Jum (08:00 - 17:00 WIB)
              </div>
            </div>

            <div className="lg:w-3/5 p-12 md:p-16">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="relative">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">Nama Lengkap</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input required className="w-full bg-gray-50 border-none rounded-2xl pl-12 pr-4 py-4 focus:ring-2 focus:ring-blue-600/10 transition-all font-semibold outline-none" placeholder="Nama Lengkap" />
                    </div>
                  </div>
                  <div className="relative">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">No. WhatsApp</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input required className="w-full bg-gray-50 border-none rounded-2xl pl-12 pr-4 py-4 focus:ring-2 focus:ring-blue-600/10 transition-all font-semibold outline-none" placeholder="0812..." />
                    </div>
                  </div>
                </div>
                <div className="relative">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">Email Perusahaan</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input type="email" required className="w-full bg-gray-50 border-none rounded-2xl pl-12 pr-4 py-4 focus:ring-2 focus:ring-blue-600/10 transition-all font-semibold outline-none" placeholder="company@gmail.com" />
                  </div>
                </div>
                <div className="relative">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">Pesan Detail</label>
                  <textarea rows={4} className="w-full bg-gray-50 border-none rounded-2xl px-4 py-4 focus:ring-2 focus:ring-blue-600/10 transition-all font-semibold outline-none resize-none" placeholder="Ceritakan kebutuhan perangkat Anda..." />
                </div>
                <button 
                  disabled={loading}
                  type="submit" 
                  className={`w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-blue-200 transition-all active:scale-95 flex items-center justify-center gap-3 hover:bg-blue-700 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {loading ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Kirim Permintaan <ArrowRight size={22} /></>}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-white py-20 px-6 border-t border-gray-100">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-2">
              <div className="flex items-center gap-3 mb-6">
                 <img
              src="/LOGO-04.png"
              alt="Logo Abnan CRM"
              className="w-10 h-10 object-contain cursor-pointer"
              onClick={() => navigate('/dashboard')}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
                {/* <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold">A</div> */}
                <span className="text-xl font-black tracking-tighter">Abnan Inti Trans</span>
              </div>
              <p className="text-gray-500 font-medium max-w-sm leading-relaxed">
                Penyedia solusi end-to-end untuk kebutuhan telekomunikasi dan perdagangan internasional yang fokus pada efisiensi biaya dan kecepatan distribusi.
              </p>
            </div>
            <div>
              <h4 className="font-black text-sm uppercase tracking-widest mb-6">Quick Links</h4>
              <ul className="space-y-4 font-bold text-gray-400">
                {['Beranda', 'Tentang', 'Produk', 'Layanan', 'Kontak'].map(l => (
                  <li key={l}><a href={`#${l.toLowerCase()}`} className="hover:text-blue-600 transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-black text-sm uppercase tracking-widest mb-6">Our Policy</h4>
              <ul className="space-y-4 font-bold text-gray-400">
                <li><p className="hover:text-blue-600 cursor-pointer">Privacy Policy</p></li>
                <li><p className="hover:text-blue-600 cursor-pointer">Terms of Service</p></li>
                <li><p className="hover:text-blue-600 cursor-pointer">Customs Guide</p></li>
              </ul>
            </div>
          </div>
          <div className="pt-12 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-gray-400 text-sm font-bold">© 2026 PT Abnan Inti Trans.</p>
            <Link to="/login" className="flex items-center gap-2 text-blue-600 font-black text-sm group">
             Login <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </footer>

      <Chatbot />

      {/* Global CSS for custom animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(40px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-fade-in { animation: fade-in 0.6s ease-out forwards; }
        .animate-slide-up { animation: slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        html { scroll-behavior: smooth; }
      `}} />
    </div>
  );
}
