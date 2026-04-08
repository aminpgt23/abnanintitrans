import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  ArrowRightLeft,
  CheckCircle2,
  CircleDollarSign,
  Plus,
  Target,
  Users,
  UserRoundPlus,
} from 'lucide-react';
import { customersAPI, pipelineAPI, usersAPI } from '../services/api';
import { formatDate, formatRupiah } from '../utils/format';
import { useAuth } from '../contexts/AuthContext';

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-3xl bg-white/95 shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200/50 p-5">
          <h3 className="text-xl font-bold tracking-tight text-gray-900">{title}</h3>
          <button onClick={onClose} className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700">✕</button>
        </div>
        <div className="max-h-[calc(90vh-80px)] overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
}

export default function PipelinePage() {
  const { user } = useAuth();
  const [stages, setStages] = useState([]);
  const [leads, setLeads] = useState([]);
  const [salesUsers, setSalesUsers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [leadModal, setLeadModal] = useState(false);
  const [dealModal, setDealModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [draggingDealId, setDraggingDealId] = useState(null);
  const [loading, setLoading] = useState(false);
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
        throw new Error('core_pipeline_load_failed');
      }

      setStages(stagesRes.value.data.data || []);
      setLeads(leadsRes.value.data.data || []);
      setCustomers(customersRes.value.data.data?.customers || []);

      if (salesRes.status === 'fulfilled' && salesRes.value?.data?.data?.users) {
        setSalesUsers(salesRes.value.data.data.users || []);
      } else if (user) {
        setSalesUsers([{
          id: user.id,
          full_name: user.full_name,
        }]);
      } else {
        setSalesUsers([]);
      }
    } catch (error) {
      toast.error('Gagal memuat data pipeline');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [user]);

  const openDealFromLead = (lead) => {
    const firstStageId = stages.find((stage) => !stage.is_closed)?.id || '';
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

  const totals = useMemo(() => {
    const flatDeals = stages.flatMap((stage) => stage.deals || []);
    return {
      deals: flatDeals.length,
      pipelineValue: flatDeals.reduce((sum, deal) => sum + Number(deal.value || 0), 0),
      leads: leads.length,
    };
  }, [stages, leads]);

  const handleCreateLead = async (event) => {
    event.preventDefault();
    try {
      await pipelineAPI.createLead(leadForm);
      toast.success('Lead berhasil dibuat');
      setLeadModal(false);
      setLeadForm({
        company_name: '',
        contact_name: '',
        contact_email: '',
        contact_phone: '',
        source: 'manual',
        region: '',
        assigned_to: '',
        notes: '',
      });
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal membuat lead');
    }
  };

  const handleCreateDeal = async (event) => {
    event.preventDefault();
    try {
      if (selectedLead) {
        await pipelineAPI.convertLead(selectedLead.id, dealForm);
      } else {
        await pipelineAPI.createDeal(dealForm);
      }
      toast.success('Deal berhasil dibuat');
      setDealModal(false);
      setSelectedLead(null);
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal membuat deal');
    }
  };

  const handleDropDeal = async (stageId) => {
    if (!draggingDealId) return;
    try {
      await pipelineAPI.updateDealStage(draggingDealId, { pipeline_stage_id: stageId });
      toast.success('Stage deal diperbarui');
      load();
    } catch (error) {
      toast.error('Gagal memindahkan deal');
    } finally {
      setDraggingDealId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Sales Pipeline</h1>
          <p className="mt-1 text-sm text-gray-500">Lead, deal, dan kanban pipeline untuk tim sales.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setLeadModal(true)}
            className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-gray-200 transition hover:bg-gray-50"
          >
            <span className="inline-flex items-center gap-2"><UserRoundPlus className="h-4 w-4" /> Tambah Lead</span>
          </button>
          <button
            onClick={() => {
              setSelectedLead(null);
              setDealForm((form) => ({ ...form, lead_id: '', customer_id: '', deal_name: '', value: '', expected_close_date: '', notes: '' }));
              setDealModal(true);
            }}
            className="rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:scale-[1.02]"
          >
            <span className="inline-flex items-center gap-2"><Plus className="h-4 w-4" /> Tambah Deal</span>
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-blue-200 bg-blue-50/80 p-5">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-500">Total Lead</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{totals.leads}</p>
        </div>
        <div className="rounded-2xl border border-green-200 bg-green-50/80 p-5">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-green-500">Total Deal</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{totals.deals}</p>
        </div>
        <div className="rounded-2xl border border-yellow-200 bg-yellow-50/80 p-5">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-yellow-500">Pipeline Value</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{formatRupiah(totals.pipelineValue)}</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-3xl border border-gray-200/60 bg-white/80 p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Lead Queue</h2>
              <p className="text-sm text-gray-500">Prospek yang siap dikonversi menjadi deal.</p>
            </div>
            <Users className="h-5 w-5 text-gray-400" />
          </div>

          <div className="space-y-3">
            {leads.length ? leads.map((lead) => (
              <div key={lead.id} className="rounded-2xl border border-gray-100 bg-gray-50/80 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{lead.company_name}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      {lead.contact_name || '-'} · {lead.contact_email || '-'} · {lead.contact_phone || '-'}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Source: {lead.source || '-'} · Assigned: {lead.assigned_to_name || '-'}
                    </p>
                  </div>
                  <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-gray-500 ring-1 ring-gray-200">
                    {lead.status}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-xs text-gray-400">Dibuat {formatDate(lead.created_at)}</p>
                  <button
                    onClick={() => openDealFromLead(lead)}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
                  >
                    <ArrowRightLeft className="h-3.5 w-3.5" />
                    Convert ke Deal
                  </button>
                </div>
              </div>
            )) : (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-10 text-center text-sm text-gray-500">
                Belum ada lead.
              </div>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-gray-200/60 bg-white/80 p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Deal Kanban</h2>
              <p className="text-sm text-gray-500">Geser kartu antar stage untuk update pipeline.</p>
            </div>
            <Target className="h-5 w-5 text-gray-400" />
          </div>

          <div className="flex gap-4 overflow-x-auto pb-2">
            {stages.map((stage) => (
              <div
                key={stage.id}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => handleDropDeal(stage.id)}
                className="min-h-[420px] min-w-[280px] rounded-2xl bg-gray-50/80 p-4"
              >
                <div className="mb-3 rounded-2xl bg-white p-3 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-bold text-gray-900">{stage.name}</p>
                    <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-600">
                      {stage.deals?.length || 0}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Probability {stage.probability}%</p>
                </div>

                <div className="space-y-3">
                  {(stage.deals || []).map((deal) => (
                    <div
                      key={deal.id}
                      draggable
                      onDragStart={() => setDraggingDealId(deal.id)}
                      className="cursor-grab rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <p className="text-sm font-semibold text-gray-900">{deal.deal_name}</p>
                      <p className="mt-1 text-xs text-gray-500">{deal.customer_name || deal.lead_company_name || '-'}</p>
                      <p className="mt-3 text-sm font-bold text-blue-600">{formatRupiah(deal.value || 0)}</p>
                      <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                        <span>{deal.assigned_to_name || '-'}</span>
                        <span>{deal.probability ?? stage.probability}%</span>
                      </div>
                    </div>
                  ))}

                  {!stage.deals?.length && (
                    <div className="rounded-2xl border border-dashed border-gray-200 bg-white/70 p-6 text-center text-xs text-gray-400">
                      Drop deal di sini
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {leadModal && (
        <Modal title="Tambah Lead" onClose={() => setLeadModal(false)}>
          <form onSubmit={handleCreateLead} className="grid gap-4 md:grid-cols-2">
            <input required value={leadForm.company_name} onChange={(e) => setLeadForm((f) => ({ ...f, company_name: e.target.value }))} placeholder="Nama perusahaan" className="rounded-xl border border-gray-200 px-4 py-3 text-sm" />
            <input value={leadForm.contact_name} onChange={(e) => setLeadForm((f) => ({ ...f, contact_name: e.target.value }))} placeholder="Nama kontak" className="rounded-xl border border-gray-200 px-4 py-3 text-sm" />
            <input value={leadForm.contact_email} onChange={(e) => setLeadForm((f) => ({ ...f, contact_email: e.target.value }))} placeholder="Email" className="rounded-xl border border-gray-200 px-4 py-3 text-sm" />
            <input value={leadForm.contact_phone} onChange={(e) => setLeadForm((f) => ({ ...f, contact_phone: e.target.value }))} placeholder="Telepon" className="rounded-xl border border-gray-200 px-4 py-3 text-sm" />
            <input value={leadForm.source} onChange={(e) => setLeadForm((f) => ({ ...f, source: e.target.value }))} placeholder="Source" className="rounded-xl border border-gray-200 px-4 py-3 text-sm" />
            <input value={leadForm.region} onChange={(e) => setLeadForm((f) => ({ ...f, region: e.target.value }))} placeholder="Region / wilayah" className="rounded-xl border border-gray-200 px-4 py-3 text-sm" />
            <select value={leadForm.assigned_to} onChange={(e) => setLeadForm((f) => ({ ...f, assigned_to: e.target.value }))} className="rounded-xl border border-gray-200 px-4 py-3 text-sm">
              <option value="">Pilih sales PIC</option>
              {salesUsers.map((sales) => <option key={sales.id} value={sales.id}>{sales.full_name}</option>)}
            </select>
            <textarea value={leadForm.notes} onChange={(e) => setLeadForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Catatan lead" className="min-h-[100px] rounded-xl border border-gray-200 px-4 py-3 text-sm md:col-span-2" />
            <div className="flex gap-3 md:col-span-2">
              <button type="button" onClick={() => setLeadModal(false)} className="flex-1 rounded-xl border border-gray-300 py-3 text-sm font-medium text-gray-700">Batal</button>
              <button type="submit" className="flex-1 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white">Simpan Lead</button>
            </div>
          </form>
        </Modal>
      )}

      {dealModal && (
        <Modal title={selectedLead ? 'Convert Lead ke Deal' : 'Tambah Deal'} onClose={() => { setDealModal(false); setSelectedLead(null); }}>
          <form onSubmit={handleCreateDeal} className="grid gap-4 md:grid-cols-2">
            <input required value={dealForm.deal_name} onChange={(e) => setDealForm((f) => ({ ...f, deal_name: e.target.value }))} placeholder="Nama deal" className="rounded-xl border border-gray-200 px-4 py-3 text-sm md:col-span-2" />
            <select value={dealForm.customer_id} onChange={(e) => setDealForm((f) => ({ ...f, customer_id: e.target.value }))} className="rounded-xl border border-gray-200 px-4 py-3 text-sm">
              <option value="">Relasikan ke customer</option>
              {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
            </select>
            <select value={dealForm.assigned_to} onChange={(e) => setDealForm((f) => ({ ...f, assigned_to: e.target.value }))} className="rounded-xl border border-gray-200 px-4 py-3 text-sm">
              <option value="">Pilih sales PIC</option>
              {salesUsers.map((sales) => <option key={sales.id} value={sales.id}>{sales.full_name}</option>)}
            </select>
            <input type="number" min="0" required value={dealForm.value} onChange={(e) => setDealForm((f) => ({ ...f, value: e.target.value }))} placeholder="Nilai deal" className="rounded-xl border border-gray-200 px-4 py-3 text-sm" />
            <input type="date" value={dealForm.expected_close_date} onChange={(e) => setDealForm((f) => ({ ...f, expected_close_date: e.target.value }))} className="rounded-xl border border-gray-200 px-4 py-3 text-sm" />
            <select value={dealForm.pipeline_stage_id} onChange={(e) => setDealForm((f) => ({ ...f, pipeline_stage_id: e.target.value }))} className="rounded-xl border border-gray-200 px-4 py-3 text-sm">
              <option value="">Pilih stage awal</option>
              {stages.map((stage) => <option key={stage.id} value={stage.id}>{stage.name}</option>)}
            </select>
            <textarea value={dealForm.notes} onChange={(e) => setDealForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Catatan deal" className="min-h-[100px] rounded-xl border border-gray-200 px-4 py-3 text-sm md:col-span-2" />
            <div className="flex gap-3 md:col-span-2">
              <button type="button" onClick={() => { setDealModal(false); setSelectedLead(null); }} className="flex-1 rounded-xl border border-gray-300 py-3 text-sm font-medium text-gray-700">Batal</button>
              <button type="submit" className="flex-1 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white">
                {selectedLead ? 'Convert ke Deal' : 'Simpan Deal'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
