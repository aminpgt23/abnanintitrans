import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  ArrowRightLeft,
  Calendar,
  Briefcase,
  CircleDollarSign,
  Clock3,
  Filter,
  Plus,
  Search,
  Target,
  UserRoundPlus,
  Users,
} from 'lucide-react';
import { customersAPI, pipelineAPI, usersAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useUI } from '../contexts/UIContext';
import { formatDate, formatRupiah } from '../utils/format';

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-hidden rounded-[2rem] border border-white/20 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <h3 className="text-lg font-black tracking-tight text-slate-900">{title}</h3>
          <button onClick={onClose} className="rounded-2xl px-3 py-2 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900">
            Tutup
          </button>
        </div>
        <div className="max-h-[calc(92vh-88px)] overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, hint, tone = 'blue' }) {
  const palette = {
    blue: 'from-blue-600 to-sky-500',
    emerald: 'from-emerald-600 to-teal-400',
    amber: 'from-amber-500 to-yellow-400',
    rose: 'from-rose-600 to-orange-400',
  };

  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">{label}</p>
          <p className="mt-3 text-2xl font-black tracking-tight text-slate-900">{value}</p>
          <p className="mt-2 text-sm text-slate-500">{hint}</p>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${palette[tone] || palette.blue} text-white shadow-lg`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export default function PipelineWorkspacePage() {
  const { user } = useAuth();
  const { locale } = useUI();
  const isEnglish = locale === 'en';
  const [stages, setStages] = useState([]);
  const [leads, setLeads] = useState([]);
  const [salesUsers, setSalesUsers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [leadModal, setLeadModal] = useState(false);
  const [dealModal, setDealModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [draggingDealId, setDraggingDealId] = useState(null);
  const [search, setSearch] = useState('');
  const [ownerFilter, setOwnerFilter] = useState('all');
  const [leadForm, setLeadForm] = useState({
    company_name: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    source: 'manual',
    region: '',
    assigned_to: '',
    notes: '',
  });
  const [dealForm, setDealForm] = useState({
    lead_id: '',
    customer_id: '',
    deal_name: '',
    value: '',
    expected_close_date: '',
    assigned_to: '',
    pipeline_stage_id: '',
    notes: '',
  });

  const load = async () => {
    setLoading(true);
    try {
      const canLoadSalesDirectory = ['super_admin', 'general_manager', 'sales_manager'].includes(user?.role);
      const [stagesRes, leadsRes, salesRes, customersRes] = await Promise.allSettled([
        pipelineAPI.getDeals(),
        pipelineAPI.getLeads(),
        canLoadSalesDirectory ? usersAPI.getAll({ role: 'sales', is_active: 1 }) : Promise.resolve(null),
        customersAPI.getAll({ limit: 100 }),
      ]);

      if (stagesRes.status !== 'fulfilled' || leadsRes.status !== 'fulfilled' || customersRes.status !== 'fulfilled') {
        throw new Error('pipeline_load_failed');
      }

      setStages(stagesRes.value.data.data || []);
      setLeads(leadsRes.value.data.data || []);
      setCustomers(customersRes.value.data.data?.customers || []);

      if (salesRes.status === 'fulfilled' && salesRes.value?.data?.data?.users) {
        setSalesUsers(salesRes.value.data.data.users || []);
      } else if (user) {
        setSalesUsers([{ id: user.id, full_name: user.full_name }]);
      } else {
        setSalesUsers([]);
      }
    } catch {
      toast.error(isEnglish ? 'Failed to load pipeline data' : 'Gagal memuat data pipeline');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [user]);

  const allDeals = useMemo(() => stages.flatMap((stage) => stage.deals || []), [stages]);

  const filteredStages = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return stages.map((stage) => ({
      ...stage,
      deals: (stage.deals || []).filter((deal) => {
        const matchesOwner = ownerFilter === 'all' || String(deal.assigned_to) === ownerFilter;
        const matchesSearch = !needle || [deal.deal_name, deal.customer_name, deal.lead_company_name, deal.assigned_to_name]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(needle));
        return matchesOwner && matchesSearch;
      }),
    }));
  }, [stages, search, ownerFilter]);

  const summary = useMemo(() => {
    const weightedValue = allDeals.reduce((sum, deal) => sum + (Number(deal.value || 0) * Number(deal.probability || 0) / 100), 0);
    const stalled = allDeals.filter((deal) => deal.expected_close_date && new Date(deal.expected_close_date) < new Date() && !['closed_won', 'closed_lost'].includes(String(deal.stage_code || ''))).length;
    return {
      leads: leads.length,
      deals: allDeals.length,
      pipelineValue: allDeals.reduce((sum, deal) => sum + Number(deal.value || 0), 0),
      weightedValue,
      stalled,
    };
  }, [allDeals, leads]);

  const leadQueue = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return leads.filter((lead) => {
      const matchesOwner = ownerFilter === 'all' || String(lead.assigned_to) === ownerFilter;
      const matchesSearch = !needle || [lead.company_name, lead.contact_name, lead.contact_email, lead.source]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle));
      return matchesOwner && matchesSearch;
    });
  }, [leads, ownerFilter, search]);

  const openDealFromLead = (lead) => {
    const firstStageId = stages.find((stage) => !stage.is_closed)?.id || stages[0]?.id || '';
    setSelectedLead(lead);
    setDealForm({
      lead_id: lead.id,
      customer_id: lead.customer_id || '',
      deal_name: `${lead.company_name} Opportunity`,
      value: '',
      expected_close_date: '',
      assigned_to: lead.assigned_to || '',
      pipeline_stage_id: firstStageId,
      notes: lead.notes || '',
    });
    setDealModal(true);
  };

  const handleCreateLead = async (event) => {
    event.preventDefault();
    try {
      await pipelineAPI.createLead(leadForm);
      toast.success(isEnglish ? 'Lead created' : 'Lead berhasil dibuat');
      setLeadModal(false);
      setLeadForm({ company_name: '', contact_name: '', contact_email: '', contact_phone: '', source: 'manual', region: '', assigned_to: '', notes: '' });
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || (isEnglish ? 'Failed to create lead' : 'Gagal membuat lead'));
    }
  };

  const handleCreateDeal = async (event) => {
    event.preventDefault();
    try {
      if (selectedLead) await pipelineAPI.convertLead(selectedLead.id, dealForm);
      else await pipelineAPI.createDeal(dealForm);
      toast.success(isEnglish ? 'Deal created' : 'Deal berhasil dibuat');
      setDealModal(false);
      setSelectedLead(null);
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || (isEnglish ? 'Failed to create deal' : 'Gagal membuat deal'));
    }
  };

  const handleDropDeal = async (stageId) => {
    if (!draggingDealId) return;
    try {
      await pipelineAPI.updateDealStage(draggingDealId, { pipeline_stage_id: stageId });
      toast.success(isEnglish ? 'Deal stage updated' : 'Stage deal diperbarui');
      load();
    } catch {
      toast.error(isEnglish ? 'Failed to move deal' : 'Gagal memindahkan deal');
    } finally {
      setDraggingDealId(null);
    }
  };

  return (
    <div className="space-y-6 overflow-x-hidden">
      <section className="overflow-hidden rounded-[2.5rem] bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.22),_transparent_30%),linear-gradient(135deg,#0f172a,#1e293b_45%,#0f766e)] p-6 text-white shadow-2xl shadow-slate-900/20 md:p-8">
        <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-emerald-100/80">Revenue Pipeline</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">
              {isEnglish ? 'Focus the team on opportunities, closing risk, and next actions' : 'Fokuskan tim pada peluang, risiko closing, dan next action yang harus dikerjakan'}
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-200">
              {isEnglish
                ? 'Use this page to qualify leads, convert them into deals, review closing risk, and decide which opportunities need follow-up this week.'
                : 'Gunakan halaman ini untuk mengkualifikasi lead, mengubahnya menjadi deal, menilai risiko closing, dan menentukan peluang mana yang harus difollow-up minggu ini.'}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button onClick={() => setLeadModal(true)} className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/15">
                <UserRoundPlus className="h-4 w-4" />
                {isEnglish ? 'New Lead' : 'Tambah Lead'}
              </button>
              <button
                onClick={() => {
                  setSelectedLead(null);
                  setDealForm({ lead_id: '', customer_id: '', deal_name: '', value: '', expected_close_date: '', assigned_to: '', pipeline_stage_id: stages[0]?.id || '', notes: '' });
                  setDealModal(true);
                }}
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-slate-900 transition hover:scale-[1.02]"
              >
                <Plus className="h-4 w-4" />
                {isEnglish ? 'New Deal' : 'Tambah Deal'}
              </button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[1.75rem] border border-white/10 bg-white/10 p-5 backdrop-blur-md">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-100">{isEnglish ? 'Weighted Forecast' : 'Forecast Tertimbang'}</p>
              <p className="mt-3 text-3xl font-black">{formatRupiah(summary.weightedValue)}</p>
              <p className="mt-2 text-sm text-slate-200">{isEnglish ? 'Probability-adjusted pipeline' : 'Nilai pipeline setelah probability'}</p>
            </div>
            <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/20 p-5 backdrop-blur-md">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-300">{isEnglish ? 'Closing Risk' : 'Closing Risk'}</p>
              <p className="mt-3 text-3xl font-black">{summary.stalled}</p>
              <p className="mt-2 text-sm text-slate-200">{isEnglish ? 'Deals past expected close date' : 'Deal melewati target close date'}</p>
            </div>
            <div className="rounded-[1.75rem] border border-white/10 bg-white/10 p-5 backdrop-blur-md md:col-span-2">
              <div className="grid gap-3 sm:grid-cols-3">
                <div><p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-300">{isEnglish ? 'Lead Pool' : 'Lead Pool'}</p><p className="mt-2 text-2xl font-black">{summary.leads}</p></div>
                <div><p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-300">{isEnglish ? 'Active Deals' : 'Active Deals'}</p><p className="mt-2 text-2xl font-black">{summary.deals}</p></div>
                <div><p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-300">{isEnglish ? 'Pipeline Value' : 'Pipeline Value'}</p><p className="mt-2 text-2xl font-black">{formatRupiah(summary.pipelineValue)}</p></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={Users} label={isEnglish ? 'Lead Pool' : 'Lead Pool'} value={summary.leads} hint={isEnglish ? 'Prospects awaiting qualification' : 'Prospek yang menunggu kualifikasi'} tone="blue" />
        <MetricCard icon={Briefcase} label={isEnglish ? 'Active Deals' : 'Active Deals'} value={summary.deals} hint={isEnglish ? 'Open opportunities in pipeline' : 'Peluang aktif di pipeline'} tone="emerald" />
        <MetricCard icon={CircleDollarSign} label={isEnglish ? 'Pipeline Value' : 'Pipeline Value'} value={formatRupiah(summary.pipelineValue)} hint={isEnglish ? 'Gross open value' : 'Nilai bruto seluruh deal terbuka'} tone="amber" />
        <MetricCard icon={Clock3} label={isEnglish ? 'Stalled Deals' : 'Stalled Deals'} value={summary.stalled} hint={isEnglish ? 'Need immediate action' : 'Butuh follow-up cepat'} tone="rose" />
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-black tracking-tight text-slate-900">{isEnglish ? 'Pipeline Control' : 'Pipeline Control'}</h2>
            <p className="mt-1 text-sm text-slate-500">{isEnglish ? 'Use filters to focus the board by owner or account' : 'Gunakan filter untuk memfokuskan board berdasarkan PIC atau akun tertentu'}</p>
          </div>
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="relative md:w-72">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={isEnglish ? 'Search leads or deals...' : 'Cari lead atau deal...'} className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm font-medium outline-none transition focus:border-blue-300" />
            </div>
            <div className="relative">
              <Filter className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <select value={ownerFilter} onChange={(event) => setOwnerFilter(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm font-semibold outline-none transition focus:border-blue-300 md:w-64">
                <option value="all">{isEnglish ? 'All owners' : 'Semua PIC'}</option>
                {salesUsers.map((sales) => (
                  <option key={sales.id} value={sales.id}>{sales.full_name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black tracking-tight text-slate-900">{isEnglish ? 'Lead Queue' : 'Lead Queue'}</h2>
              <p className="mt-1 text-sm text-slate-500">{isEnglish ? 'Prioritize the next prospects to qualify, assign, or convert into active opportunities' : 'Prioritaskan prospek berikutnya untuk dikualifikasi, di-assign, atau dikonversi menjadi peluang aktif'}</p>
            </div>
            <Users className="h-5 w-5 text-slate-400" />
          </div>

          <div className="mt-6 space-y-3">
            {loading ? (
              <div className="flex h-40 items-center justify-center rounded-[1.5rem] bg-slate-50">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
              </div>
            ) : leadQueue.length === 0 ? (
              <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 p-10 text-center text-sm text-slate-500">
                {isEnglish ? 'No leads match the current filter.' : 'Tidak ada lead yang cocok dengan filter saat ini.'}
              </div>
            ) : (
              leadQueue.map((lead) => (
                <article key={lead.id} className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 transition hover:border-blue-200 hover:bg-white">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-white px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-slate-600">{lead.status || 'new'}</span>
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-bold text-blue-700">{lead.source || 'manual'}</span>
                      </div>
                      <p className="mt-3 text-base font-black tracking-tight text-slate-900">{lead.company_name}</p>
                      <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-500">
                        <span>{lead.contact_name || '-'}</span>
                        <span>{lead.contact_email || '-'}</span>
                        <span>{lead.contact_phone || '-'}</span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-500">
                        <span>{isEnglish ? 'Owner' : 'PIC'}: {lead.assigned_to_name || '-'}</span>
                        <span>{isEnglish ? 'Created' : 'Dibuat'}: {formatDate(lead.created_at)}</span>
                      </div>
                    </div>
                    <button onClick={() => openDealFromLead(lead)} className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700">
                      <ArrowRightLeft className="h-4 w-4" />
                      {isEnglish ? 'Convert' : 'Convert'}
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black tracking-tight text-slate-900">{isEnglish ? 'Deal Board' : 'Deal Board'}</h2>
              <p className="mt-1 text-sm text-slate-500">{isEnglish ? 'Review pipeline by stage, value, probability, and expected close date before taking action' : 'Tinjau pipeline berdasarkan stage, nilai, probability, dan expected close date sebelum mengambil tindakan'}</p>
            </div>
            <Target className="h-5 w-5 text-slate-400" />
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {filteredStages.map((stage) => {
              const stageValue = (stage.deals || []).reduce((sum, deal) => sum + Number(deal.value || 0), 0);
              const stageWeighted = (stage.deals || []).reduce((sum, deal) => sum + (Number(deal.value || 0) * Number(deal.probability || stage.probability || 0) / 100), 0);

              return (
                <div
                  key={stage.id}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => handleDropDeal(stage.id)}
                  className="min-h-[320px] rounded-[1.75rem] bg-slate-50 p-4"
                >
                  <div className="rounded-[1.5rem] bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-black text-slate-900">{stage.name}</p>
                      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700">{stage.deals?.length || 0}</span>
                    </div>
                    <div className="mt-3 grid gap-2 text-xs text-slate-500">
                      <div className="flex items-center justify-between"><span>{isEnglish ? 'Probability' : 'Probability'}</span><span className="font-bold text-slate-900">{stage.probability || 0}%</span></div>
                      <div className="flex items-center justify-between"><span>{isEnglish ? 'Stage value' : 'Stage value'}</span><span className="font-bold text-slate-900">{formatRupiah(stageValue)}</span></div>
                      <div className="flex items-center justify-between"><span>{isEnglish ? 'Weighted' : 'Weighted'}</span><span className="font-bold text-emerald-600">{formatRupiah(stageWeighted)}</span></div>
                    </div>
                  </div>

                  <div className="mt-4 space-y-3">
                    {(stage.deals || []).length === 0 ? (
                      <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-white/70 p-6 text-center text-xs text-slate-400">
                        {isEnglish ? 'Drop deals here' : 'Drop deal di sini'}
                      </div>
                    ) : (
                      (stage.deals || []).map((deal) => {
                        const overdue = deal.expected_close_date && new Date(deal.expected_close_date) < new Date();
                        return (
                          <div
                            key={deal.id}
                            draggable
                            onDragStart={() => setDraggingDealId(deal.id)}
                            className="cursor-grab rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-slate-600">{deal.probability ?? stage.probability ?? 0}%</span>
                              {overdue ? <span className="rounded-full bg-rose-100 px-3 py-1 text-[11px] font-bold text-rose-700">{isEnglish ? 'At risk' : 'At risk'}</span> : null}
                            </div>
                            <p className="mt-3 text-sm font-black tracking-tight text-slate-900">{deal.deal_name}</p>
                            <p className="mt-1 text-xs text-slate-500">{deal.customer_name || deal.lead_company_name || '-'}</p>
                            <p className="mt-3 text-lg font-black text-blue-600">{formatRupiah(deal.value || 0)}</p>
                            <div className="mt-3 grid gap-2 text-xs text-slate-500">
                              <div className="flex items-center justify-between"><span>{isEnglish ? 'Owner' : 'PIC'}</span><span>{deal.assigned_to_name || '-'}</span></div>
                              <div className="flex items-center justify-between"><span>{isEnglish ? 'Expected close' : 'Expected close'}</span><span>{formatDate(deal.expected_close_date)}</span></div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {leadModal ? (
        <Modal title={isEnglish ? 'Create Lead' : 'Tambah Lead'} onClose={() => setLeadModal(false)}>
          <form onSubmit={handleCreateLead} className="grid gap-4 md:grid-cols-2">
            <input required value={leadForm.company_name} onChange={(event) => setLeadForm((current) => ({ ...current, company_name: event.target.value }))} placeholder={isEnglish ? 'Company name' : 'Nama perusahaan'} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold" />
            <input value={leadForm.contact_name} onChange={(event) => setLeadForm((current) => ({ ...current, contact_name: event.target.value }))} placeholder={isEnglish ? 'Contact person' : 'Nama kontak'} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold" />
            <input value={leadForm.contact_email} onChange={(event) => setLeadForm((current) => ({ ...current, contact_email: event.target.value }))} placeholder="Email" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold" />
            <input value={leadForm.contact_phone} onChange={(event) => setLeadForm((current) => ({ ...current, contact_phone: event.target.value }))} placeholder={isEnglish ? 'Phone' : 'Telepon'} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold" />
            <input value={leadForm.source} onChange={(event) => setLeadForm((current) => ({ ...current, source: event.target.value }))} placeholder="Source" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold" />
            <input value={leadForm.region} onChange={(event) => setLeadForm((current) => ({ ...current, region: event.target.value }))} placeholder={isEnglish ? 'Region' : 'Region / wilayah'} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold" />
            <select value={leadForm.assigned_to} onChange={(event) => setLeadForm((current) => ({ ...current, assigned_to: event.target.value }))} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold">
              <option value="">{isEnglish ? 'Select owner' : 'Pilih sales PIC'}</option>
              {salesUsers.map((sales) => <option key={sales.id} value={sales.id}>{sales.full_name}</option>)}
            </select>
            <textarea value={leadForm.notes} onChange={(event) => setLeadForm((current) => ({ ...current, notes: event.target.value }))} placeholder={isEnglish ? 'Qualification notes' : 'Catatan lead'} className="min-h-[110px] rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold md:col-span-2" />
            <div className="flex gap-3 md:col-span-2">
              <button type="button" onClick={() => setLeadModal(false)} className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600">{isEnglish ? 'Cancel' : 'Batal'}</button>
              <button type="submit" className="flex-1 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white">{isEnglish ? 'Save Lead' : 'Simpan Lead'}</button>
            </div>
          </form>
        </Modal>
      ) : null}

      {dealModal ? (
        <Modal title={selectedLead ? (isEnglish ? 'Convert Lead to Deal' : 'Convert Lead ke Deal') : (isEnglish ? 'Create Deal' : 'Tambah Deal')} onClose={() => { setDealModal(false); setSelectedLead(null); }}>
          <form onSubmit={handleCreateDeal} className="grid gap-4 md:grid-cols-2">
            <input required value={dealForm.deal_name} onChange={(event) => setDealForm((current) => ({ ...current, deal_name: event.target.value }))} placeholder={isEnglish ? 'Deal name' : 'Nama deal'} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold md:col-span-2" />
            <select value={dealForm.customer_id} onChange={(event) => setDealForm((current) => ({ ...current, customer_id: event.target.value }))} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold">
              <option value="">{isEnglish ? 'Link customer' : 'Relasikan ke customer'}</option>
              {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
            </select>
            <select value={dealForm.assigned_to} onChange={(event) => setDealForm((current) => ({ ...current, assigned_to: event.target.value }))} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold">
              <option value="">{isEnglish ? 'Select owner' : 'Pilih sales PIC'}</option>
              {salesUsers.map((sales) => <option key={sales.id} value={sales.id}>{sales.full_name}</option>)}
            </select>
            <input type="number" min="0" required value={dealForm.value} onChange={(event) => setDealForm((current) => ({ ...current, value: event.target.value }))} placeholder={isEnglish ? 'Deal value' : 'Nilai deal'} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold" />
            <input type="date" value={dealForm.expected_close_date} onChange={(event) => setDealForm((current) => ({ ...current, expected_close_date: event.target.value }))} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold" />
            <select value={dealForm.pipeline_stage_id} onChange={(event) => setDealForm((current) => ({ ...current, pipeline_stage_id: event.target.value }))} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold">
              <option value="">{isEnglish ? 'Select stage' : 'Pilih stage awal'}</option>
              {stages.map((stage) => <option key={stage.id} value={stage.id}>{stage.name}</option>)}
            </select>
            <textarea value={dealForm.notes} onChange={(event) => setDealForm((current) => ({ ...current, notes: event.target.value }))} placeholder={isEnglish ? 'Buying signals, blockers, or negotiation notes' : 'Catatan buying signal, blocker, atau negosiasi'} className="min-h-[110px] rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold md:col-span-2" />
            <div className="flex gap-3 md:col-span-2">
              <button type="button" onClick={() => { setDealModal(false); setSelectedLead(null); }} className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600">{isEnglish ? 'Cancel' : 'Batal'}</button>
              <button type="submit" className="flex-1 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white">{selectedLead ? (isEnglish ? 'Convert to Deal' : 'Convert ke Deal') : (isEnglish ? 'Save Deal' : 'Simpan Deal')}</button>
            </div>
          </form>
        </Modal>
      ) : null}
    </div>
  );
}
