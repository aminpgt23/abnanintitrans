const SearchRepository = require('../repositories/searchRepository');

class SearchService {
  static async globalSearch(query, requester, limit = 5) {
    const normalized = String(query || '').trim();

    if (normalized.length < 2) {
      const error = new Error('Kata kunci minimal 2 karakter');
      error.status = 400;
      throw error;
    }

    const perModuleLimit = Math.max(1, Math.min(Number(limit) || 5, 10));

    const [customers, invoices, shipments, documents] = await Promise.all([
      SearchRepository.searchCustomers(normalized, requester, perModuleLimit),
      SearchRepository.searchInvoices(normalized, requester, perModuleLimit),
      SearchRepository.searchShipments(normalized, requester, perModuleLimit),
      SearchRepository.searchDocuments(normalized, requester, perModuleLimit),
    ]);

    return [...customers, ...invoices, ...shipments, ...documents]
      .sort((left, right) => new Date(right.occurred_at) - new Date(left.occurred_at))
      .slice(0, perModuleLimit * 4);
  }
}

module.exports = SearchService;
