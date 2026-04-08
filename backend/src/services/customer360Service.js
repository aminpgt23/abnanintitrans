const Customer360Repository = require('../repositories/customer360Repository');

class Customer360Service {
  static async getOverview(customerId, requester) {
    const customer = await Customer360Repository.findCustomerById(customerId);

    if (!customer) {
      const error = new Error('Customer tidak ditemukan');
      error.status = 404;
      throw error;
    }

    if (requester?.role === 'sales' && Number(customer.assigned_sales_id) !== Number(requester.id)) {
      const error = new Error('Akses ditolak');
      error.status = 403;
      throw error;
    }

    if (requester?.account_type === 'customer' && Number(requester.customer_id) !== Number(customer.id)) {
      const error = new Error('Akses ditolak');
      error.status = 403;
      throw error;
    }

    const [
      invoiceSummary,
      shipmentSummary,
      documentSummary,
      invoices,
      payments,
      shipments,
      documents,
      activities,
      products,
    ] = await Promise.all([
      Customer360Repository.getInvoiceSummary(customerId),
      Customer360Repository.getShipmentSummary(customerId),
      Customer360Repository.getDocumentSummary(customerId),
      Customer360Repository.getRecentInvoices(customerId),
      Customer360Repository.getRecentPayments(customerId),
      Customer360Repository.getRecentShipments(customerId),
      Customer360Repository.getRecentDocuments(customerId),
      Customer360Repository.getRecentActivities(customerId),
      Customer360Repository.getPurchasedProducts(customerId),
    ]);

    return {
      customer,
      summary: {
        totalInvoices: Number(invoiceSummary.total_invoices || 0),
        paidInvoices: Number(invoiceSummary.paid_invoices || 0),
        overdueInvoices: Number(invoiceSummary.overdue_invoices || 0),
        totalRevenue: Number(invoiceSummary.total_invoice_value || 0),
        totalPaidAmount: Number(invoiceSummary.total_paid_amount || 0),
        outstandingAmount: Number(invoiceSummary.outstanding_amount || 0),
        shipmentCount: Number(shipmentSummary.total_shipments || 0),
        deliveredShipments: Number(shipmentSummary.delivered_shipments || 0),
        activeShipments: Number(shipmentSummary.active_shipments || 0),
        documentCount: Number(documentSummary.total_documents || 0),
        lastInvoiceDate: invoiceSummary.last_invoice_date || null,
        lastShipmentDate: shipmentSummary.last_shipment_date || null,
        lastDocumentDate: documentSummary.last_document_date || null,
      },
      recent: {
        invoices,
        payments,
        shipments,
        documents,
        products,
      },
      timeline: this.buildTimeline({ invoices, payments, shipments, documents, activities }),
    };
  }

  static buildTimeline({ invoices, payments, shipments, documents, activities }) {
    const events = [
      ...invoices.map((item) => ({
        type: 'invoice',
        id: item.id,
        title: `Invoice ${item.invoice_number}`,
        description: `Status ${item.status} dengan nilai ${Number(item.grand_total || 0)}`,
        status: item.status,
        amount: Number(item.grand_total || 0),
        occurred_at: item.created_at,
      })),
      ...payments.map((item) => ({
        type: 'payment',
        id: item.id,
        title: `Pembayaran ${item.invoice_number}`,
        description: `Metode ${item.payment_method || '-'} - status ${item.status}`,
        status: item.status,
        amount: Number(item.amount || 0),
        occurred_at: item.payment_date || item.created_at,
      })),
      ...shipments.map((item) => ({
        type: 'shipment',
        id: item.id,
        title: `Shipment ${item.tracking_id}`,
        description: `${item.origin || '-'} ke ${item.destination || '-'} - status ${item.status}`,
        status: item.status,
        occurred_at: item.created_at,
      })),
      ...documents.map((item) => ({
        type: 'document',
        id: item.id,
        title: item.title,
        description: `${item.type} - status ${item.status}`,
        status: item.status,
        occurred_at: item.created_at,
      })),
      ...activities.map((item) => ({
        type: 'activity',
        id: item.id,
        title: item.action,
        description: item.description || `Aktivitas oleh ${item.actor_name || 'system'}`,
        entity_type: item.entity_type,
        occurred_at: item.created_at,
      })),
    ];

    return events
      .filter((item) => item.occurred_at)
      .sort((left, right) => new Date(right.occurred_at) - new Date(left.occurred_at))
      .slice(0, 25);
  }
}

module.exports = Customer360Service;
