const PipelineRepository = require('../repositories/pipelineRepository');

class PipelineService {
  static async getStages() {
    return PipelineRepository.getStages();
  }

  static async getLeads(requester, query) {
    const filters = { ...query };
    if (requester?.role === 'sales') filters.assigned_to = requester.id;
    return PipelineRepository.getLeads(filters);
  }

  static async createLead(payload, requester) {
    const assignedTo = requester?.role === 'sales' ? requester.id : payload.assigned_to;
    return PipelineRepository.createLead({
      ...payload,
      assigned_to: assignedTo || null,
      created_by: requester?.id || null,
    });
  }

  static async getDealsBoard(requester, query) {
    const [stages, deals] = await Promise.all([
      PipelineRepository.getStages(),
      PipelineRepository.getDeals({
        ...query,
        assigned_to: requester?.role === 'sales' ? requester.id : query.assigned_to,
      }),
    ]);

    const columns = stages.map((stage) => ({
      ...stage,
      deals: deals.filter((deal) => Number(deal.pipeline_stage_id) === Number(stage.id)).map((deal) => ({
        ...deal,
        probability: deal.probability ?? deal.stage_probability,
      })),
    }));

    return columns;
  }

  static async createDeal(payload, requester) {
    return PipelineRepository.createDeal({
      ...payload,
      assigned_to: requester?.role === 'sales' ? requester.id : payload.assigned_to,
      created_by: requester?.id || null,
    });
  }

  static async updateDealStage(dealId, stageId, requester) {
    const updated = await PipelineRepository.updateDealStage(dealId, stageId);
    if (!updated) {
      const error = new Error('Deal tidak ditemukan');
      error.status = 404;
      throw error;
    }

    await PipelineRepository.addDealActivity({
      deal_id: dealId,
      activity_type: 'stage_change',
      description: `Stage deal dipindahkan ke ID ${stageId}`,
      created_by: requester?.id || null,
    });

    return updated;
  }

  static async convertLeadToDeal(leadId, payload, requester) {
    const lead = await PipelineRepository.findLeadById(leadId);
    if (!lead) {
      const error = new Error('Lead tidak ditemukan');
      error.status = 404;
      throw error;
    }

    const firstStage = payload.pipeline_stage_id
      ? { id: payload.pipeline_stage_id }
      : await PipelineRepository.getFirstOpenStage();

    if (!firstStage?.id) {
      const error = new Error('Pipeline stage belum tersedia');
      error.status = 400;
      throw error;
    }

    const deal = await PipelineRepository.createDeal({
      lead_id: lead.id,
      customer_id: payload.customer_id || lead.customer_id || null,
      pipeline_stage_id: firstStage.id,
      deal_name: payload.deal_name || `${lead.company_name} Opportunity`,
      value: payload.value || 0,
      probability: payload.probability || null,
      currency_code: payload.currency_code || 'IDR',
      expected_close_date: payload.expected_close_date || null,
      assigned_to: requester?.role === 'sales' ? requester.id : (payload.assigned_to || lead.assigned_to || null),
      notes: payload.notes || lead.notes || null,
      created_by: requester?.id || null,
    });

    await PipelineRepository.updateLeadStatus(leadId, 'qualified');
    await PipelineRepository.addDealActivity({
      deal_id: deal.id,
      activity_type: 'conversion',
      description: `Deal dibuat dari lead ${lead.company_name}`,
      created_by: requester?.id || null,
    });

    return deal;
  }
}

module.exports = PipelineService;
