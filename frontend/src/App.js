import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { UIProvider } from './contexts/UIContext';
import CRMLayout from './components/layout/CRMLayout';
import CustomerPortalLayout from './components/layout/CustomerPortalLayout';
import {
  CommissionsPage, PaymentRequestsPage, AnalyticsPage,
  UsersPage, ProductsPage, DocumentsPage,
  TaxReportsPage, KnowledgeBasePage
} from './pages/OtherPages';

// Lazy-loaded pages for code splitting
const LandingPage           = lazy(() => import('./pages/LandingPage'));
const LoginPage             = lazy(() => import('./pages/LoginPage'));
const CustomerSetupPage     = lazy(() => import('./pages/CustomerSetupPage'));
const DashboardPage         = lazy(() => import('./pages/DashboardPage'));
const CustomersPage         = lazy(() => import('./pages/CustomersPage'));
const CustomerDetailPage    = lazy(() => import('./pages/CustomerDetailPage'));
const CustomerPortalPage    = lazy(() => import('./pages/CustomerPortalPage'));
const FinancePage           = lazy(() => import('./pages/FinancePage'));
const InvoiceWorkspacePage  = lazy(() => import('./pages/InvoiceWorkspacePage'));
const PipelineWorkspacePage = lazy(() => import('./pages/PipelineWorkspacePage'));
const ImportExportPage      = lazy(() => import('./pages/ImportExportPage'));
const ShipmentsPage         = lazy(() => import('./pages/ShipmentsPage'));
const PaymentsWorkspacePage = lazy(() => import('./pages/PaymentsWorkspacePage'));
const ProfilePage           = lazy(() => import('./pages/ProfilePage'));

// Page loader spinner
function PageLoader() {
  return (
    <div style={{
      display:'flex', alignItems:'center', justifyContent:'center',
      minHeight:'100vh', background:'var(--bg-base)',
      flexDirection:'column', gap:16
    }}>
      <div style={{
        width:40, height:40, borderRadius:'50%',
        border:'3px solid var(--border-base)',
        borderTopColor:'var(--brand-500)',
        animation:'_spin 0.8s linear infinite'
      }}/>
      <span style={{fontSize:13, color:'var(--text-muted)', fontWeight:500}}>Memuat halaman...</span>
      <style>{`@keyframes _spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// Route guards
function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.account_type === 'customer') return <Navigate to="/dashboard" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return <CRMLayout>{children}</CRMLayout>;
}

function CustomerDashboardRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.account_type !== 'customer') return <CRMLayout>{children}</CRMLayout>;
  return <CustomerPortalLayout>{children}</CustomerPortalLayout>;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

function DashboardSwitch() {
  const { user } = useAuth();
  if (user?.account_type === 'customer') return <CustomerPortalPage />;
  return <DashboardPage />;
}

// Notifications page
function NotificationsPage() {
  const [notifs, setNotifs] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    import('./services/api').then(api =>
      api.notifAPI.getAll()
        .then(r => setNotifs(r.data.data || []))
        .catch(() => {})
        .finally(() => setLoading(false))
    );
  }, []);
  const unread = notifs.filter(n => !n.is_read);
  const read = notifs.filter(n => n.is_read);
  return (
    <div className="animate-page-enter">
      <div className="page-header">
        <div>
          <h1 className="page-title">Notifikasi</h1>
          <p className="page-subtitle">{unread.length} belum dibaca</p>
        </div>
        {unread.length > 0 && (
          <button className="btn btn-secondary btn-sm" onClick={() => setNotifs(notifs.map(n=>({...n,is_read:true})))}>
            Tandai Semua Dibaca
          </button>
        )}
      </div>
      {loading ? (
        <div className="card p-8 text-center" style={{color:'var(--text-muted)'}}>Memuat...</div>
      ) : notifs.length === 0 ? (
        <div className="card p-12 text-center">
          <div style={{fontSize:32,marginBottom:12}}>🔔</div>
          <p style={{fontSize:14,color:'var(--text-muted)'}}>Tidak ada notifikasi</p>
        </div>
      ) : (
        <div className="space-y-3">
          {unread.length > 0 && (
            <div>
              <div style={{fontSize:11,fontWeight:700,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:8}}>Belum Dibaca</div>
              <div className="card overflow-hidden">
                {unread.map((n,i)=>(
                  <div key={n.id} className="flex items-start gap-4 p-4" style={{borderBottom:i<unread.length-1?'1px solid var(--border-base)':'none'}}>
                    <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{background:'var(--brand-500)'}}/>
                    <div className="flex-1">
                      <div className="font-semibold text-sm" style={{color:'var(--text-primary)'}}>{n.title}</div>
                      <div style={{fontSize:12.5,color:'var(--text-secondary)',marginTop:2}}>{n.message}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {read.length > 0 && (
            <div>
              <div style={{fontSize:11,fontWeight:700,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:8}}>Sudah Dibaca</div>
              <div className="card overflow-hidden" style={{opacity:0.6}}>
                {read.map((n,i)=>(
                  <div key={n.id} className="flex items-start gap-4 p-4" style={{borderBottom:i<read.length-1?'1px solid var(--border-base)':'none'}}>
                    <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{background:'var(--border-strong)'}}/>
                    <div className="flex-1">
                      <div className="font-semibold text-sm" style={{color:'var(--text-primary)'}}>{n.title}</div>
                      <div style={{fontSize:12.5,color:'var(--text-secondary)',marginTop:2}}>{n.message}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <UIProvider>
        <AuthProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3500,
              style: {
                borderRadius: 14, fontSize: 13.5, fontWeight: 500,
                fontFamily:"'Plus Jakarta Sans',sans-serif",
                background:'var(--bg-surface)', color:'var(--text-primary)',
                border:'1px solid var(--border-base)',
                boxShadow:'0 8px 32px rgba(0,0,0,0.12)',
              },
              success:{ iconTheme:{ primary:'#10b981', secondary:'#fff' } },
              error:  { iconTheme:{ primary:'#ef4444', secondary:'#fff' } },
            }}
          />
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/"                    element={<LandingPage />} />
              <Route path="/login"               element={<PublicRoute><LoginPage /></PublicRoute>} />
              <Route path="/customer-setup/:token" element={<CustomerSetupPage />} />

              <Route path="/dashboard" element={<CustomerDashboardRoute><DashboardSwitch /></CustomerDashboardRoute>} />

              <Route path="/profile"             element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
              <Route path="/notifications"       element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />

              <Route path="/customers"           element={<ProtectedRoute roles={['super_admin','general_manager','sales_manager','sales']}><CustomersPage /></ProtectedRoute>} />
              <Route path="/customers/:id"       element={<ProtectedRoute roles={['super_admin','general_manager','sales_manager','sales']}><CustomerDetailPage /></ProtectedRoute>} />
              <Route path="/pipeline"            element={<ProtectedRoute roles={['super_admin','general_manager','sales_manager','sales']}><PipelineWorkspacePage /></ProtectedRoute>} />
              <Route path="/invoices"            element={<ProtectedRoute><InvoiceWorkspacePage /></ProtectedRoute>} />
              <Route path="/products"            element={<ProtectedRoute roles={['super_admin','general_manager','sales_manager','sales']}><ProductsPage /></ProtectedRoute>} />
              <Route path="/payments"            element={<ProtectedRoute><PaymentsWorkspacePage /></ProtectedRoute>} />
              <Route path="/commissions"         element={<ProtectedRoute><CommissionsPage /></ProtectedRoute>} />
              <Route path="/payment-requests"    element={<ProtectedRoute><PaymentRequestsPage /></ProtectedRoute>} />
              <Route path="/finance"             element={<ProtectedRoute roles={['super_admin','general_manager','finance']}><FinancePage /></ProtectedRoute>} />
              <Route path="/analytics"           element={<ProtectedRoute roles={['super_admin','general_manager','sales_manager']}><AnalyticsPage /></ProtectedRoute>} />
              <Route path="/documents"           element={<ProtectedRoute><DocumentsPage /></ProtectedRoute>} />
              <Route path="/shipments"           element={<ProtectedRoute><ShipmentsPage /></ProtectedRoute>} />
              <Route path="/tax-reports"         element={<ProtectedRoute roles={['super_admin','general_manager','finance']}><TaxReportsPage /></ProtectedRoute>} />
              <Route path="/knowledge-base"      element={<ProtectedRoute><KnowledgeBasePage /></ProtectedRoute>} />
              <Route path="/import-export"       element={<ProtectedRoute roles={['super_admin','general_manager','sales_manager','finance']}><ImportExportPage /></ProtectedRoute>} />
              <Route path="/users"               element={<ProtectedRoute roles={['super_admin']}><UsersPage /></ProtectedRoute>} />
              <Route path="/portal"              element={<Navigate to="/dashboard" replace />} />
              <Route path="*"                    element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </UIProvider>
    </BrowserRouter>
  );
}
