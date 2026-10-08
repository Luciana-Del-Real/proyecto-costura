import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Providers from './components/providers';
import { DialogProvider } from './context/DialogContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AdminSidebar from './components/AdminSidebar';
import AdminTopbar from './components/AdminTopbar';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

import Home from './pages/Home';
import Auth from './pages/Auth';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Courses from './pages/Courses';
import PatronesGratis from './pages/PatronesGratis';
import PatternCheckout from './pages/PatternCheckout';
import Events from './pages/Events';
import CourseDetail from './pages/CourseDetail';
import Checkout from './pages/Checkout';
import MyCourses from './pages/MyCourses';
import Profile from './pages/Profile';
import Favorites from './pages/Favorites';

import AdminDashboard from './pages/admin/AdminDashboard';
import AdminCourses from './pages/admin/AdminCourses';
import AdminUsers from './pages/admin/AdminUsers';
import AdminSales from './pages/admin/AdminSales';
import AdminRequests from './pages/admin/AdminRequests';
import AdminCertificates from './pages/admin/AdminCertificates';
import AdminEvents from './pages/admin/AdminEvents';
import AdminEventForm from './pages/admin/AdminEventForm';
import AdminCourseForm from './pages/admin/AdminCourseForm';
import AdminPatterns from './pages/admin/AdminPatterns';
import AdminPatternForm from './pages/admin/AdminPatternForm';

function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

// Al navegar (click en links del footer/navbar), sube el scroll al tope
// automáticamente en lugar de dejar la página en la posición anterior.
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

// Admin shell: a left sidebar (sticky on desktop, drawer on mobile) plus a
// thin top bar. The drawer state lives here so the topbar trigger and the
// sidebar can share it.
function AdminLayout({ children }) {
  const [navOpen, setNavOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-bg-surface">
      <AdminSidebar open={navOpen} onClose={() => setNavOpen(false)} />
      <div className="flex-1 min-w-0 flex flex-col">
        <AdminTopbar onMenuClick={() => setNavOpen(true)} />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <DialogProvider>
      <Providers>
        <Routes>
            {/* Público */}
            <Route path="/" element={<Layout><Home /></Layout>} />
            <Route path="/login" element={<Layout><Auth defaultTab="login" /></Layout>} />
            <Route path="/registro" element={<Layout><Auth defaultTab="register" /></Layout>} />
            <Route path="/forgot-password" element={<Layout hideNavLinks={true}><ForgotPassword /></Layout>} />
            <Route path="/reset-password" element={<Layout hideNavLinks={true}><ResetPassword /></Layout>} />
            <Route path="/cursos" element={<Layout><Courses /></Layout>} />
            <Route path="/patrones-gratis" element={<Layout><PatronesGratis /></Layout>} />
            <Route path="/eventos" element={<Layout><Events /></Layout>} />

            {/* Alumno */}
            {/* /curso/:id es público: sin sesión muestra la vista previa del
                curso (CoursePreviewView); "Inscribirme" lleva al login. */}
            <Route path="/curso/:id" element={<Layout><CourseDetail /></Layout>} />
            <Route path="/checkout/:id" element={<ProtectedRoute><Layout><Checkout /></Layout></ProtectedRoute>} />
            <Route path="/checkout-patron/:id" element={<ProtectedRoute><Layout><PatternCheckout /></Layout></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
            <Route path="/mis-cursos" element={<ProtectedRoute><Layout><MyCourses /></Layout></ProtectedRoute>} />
            <Route path="/perfil" element={<ProtectedRoute><Layout><Profile /></Layout></ProtectedRoute>} />
            <Route path="/favoritos" element={<ProtectedRoute><Layout><Favorites /></Layout></ProtectedRoute>} />

            {/* Admin */}
            <Route path="/admin" element={<AdminRoute><AdminLayout><AdminDashboard /></AdminLayout></AdminRoute>} />
            <Route path="/admin/cursos" element={<AdminRoute><AdminLayout><AdminCourses /></AdminLayout></AdminRoute>} />
            <Route path="/admin/usuarios" element={<AdminRoute><AdminLayout><AdminUsers /></AdminLayout></AdminRoute>} />
            <Route path="/admin/solicitudes" element={<AdminRoute><AdminLayout><AdminRequests /></AdminLayout></AdminRoute>} />
            <Route path="/admin/ventas" element={<AdminRoute><AdminLayout><AdminSales /></AdminLayout></AdminRoute>} />
            <Route path="/admin/certificados" element={<AdminRoute><AdminLayout><AdminCertificates /></AdminLayout></AdminRoute>} />
            <Route path="/admin/eventos" element={<AdminRoute><AdminLayout><AdminEvents /></AdminLayout></AdminRoute>} />
            <Route path="/admin/eventos/nuevo" element={<AdminRoute><AdminLayout><AdminEventForm /></AdminLayout></AdminRoute>} />
            <Route path="/admin/eventos/editar/:id" element={<AdminRoute><AdminLayout><AdminEventForm /></AdminLayout></AdminRoute>} />
            <Route path="/admin/courses/new" element={<AdminRoute><AdminLayout><AdminCourseForm /></AdminLayout></AdminRoute>} />
            <Route path="/admin/courses/edit/:id" element={<AdminRoute><AdminLayout><AdminCourseForm /></AdminLayout></AdminRoute>} />
            <Route path="/admin/patrones" element={<AdminRoute><AdminLayout><AdminPatterns /></AdminLayout></AdminRoute>} />
            <Route path="/admin/patrones/nuevo" element={<AdminRoute><AdminLayout><AdminPatternForm /></AdminLayout></AdminRoute>} />
            <Route path="/admin/patrones/editar/:id" element={<AdminRoute><AdminLayout><AdminPatternForm /></AdminLayout></AdminRoute>} />
          </Routes>
      </Providers>
      </DialogProvider>
    </BrowserRouter>
  );
}