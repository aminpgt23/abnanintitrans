export const formatRupiah = (num) => {
  if (!num && num !== 0) return '-';
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
};

export const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
};

export const formatDateTime = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export const statusColor = (status) => {
  const map = {
    paid: 'bg-green-100 text-green-800', draft: 'bg-gray-100 text-gray-700',
    sent: 'bg-blue-100 text-blue-800', partial: 'bg-yellow-100 text-yellow-800',
    overdue: 'bg-red-100 text-red-800', cancelled: 'bg-red-100 text-red-600',
    pending: 'bg-yellow-100 text-yellow-800', verified: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-800', approved: 'bg-green-100 text-green-800',
    approved_sm: 'bg-blue-100 text-blue-800', pending_sm: 'bg-yellow-100 text-yellow-700',
    pending_finance: 'bg-orange-100 text-orange-800', processing: 'bg-blue-100 text-blue-800',
    shipped: 'bg-indigo-100 text-indigo-800', delivered: 'bg-green-100 text-green-800',
    in_transit: 'bg-purple-100 text-purple-800', customs: 'bg-orange-100 text-orange-700',
  };
  return map[status] || 'bg-gray-100 text-gray-600';
};

export const statusLabel = (status) => {
  const map = {
    paid: 'Lunas', draft: 'Draft', sent: 'Terkirim', partial: 'Parsial',
    overdue: 'Jatuh Tempo', cancelled: 'Dibatalkan', pending: 'Pending',
    verified: 'Terverifikasi', rejected: 'Ditolak', approved: 'Disetujui',
    approved_sm: 'Disetujui SM', pending_sm: 'Menunggu SM', pending_finance: 'Menunggu Finance',
    processing: 'Diproses', shipped: 'Dikirim', delivered: 'Diterima',
    in_transit: 'Dalam Perjalanan', customs: 'Bea Cukai',
  };
  return map[status] || status;
};

export const roleLabel = (role) => {
  const map = { super_admin: 'Super Admin', general_manager: 'General Manager', sales_manager: 'Sales Manager', sales: 'Sales', finance: 'Finance' };
  return map[role] || role;
};

export const starRating = (rating) => '★'.repeat(rating) + '☆'.repeat(5 - rating);

export const truncate = (str, n = 40) => str && str.length > n ? str.slice(0, n) + '...' : str;
