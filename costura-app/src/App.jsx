import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CoursesProvider } from './context/CoursesContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AdminNavbar from './components/AdminNavbar';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

import Home from './pages/Home';
import Auth from './pages/Auth';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Courses from './pages/Courses';
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
import AdminCourseForm from './pages/admin/AdminCourseForm';

function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

// CORREGIDO: Añadimos el fondo beige y aquí gestionamos el único Navbar de admin
function AdminLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#F9F5F0]">
      <AdminNavbar />
      <main className="flex-1">{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CoursesProvider>
          <Routes>
            {/* Público */}
            <Route path="/" element={<Layout><Home /></Layout>} />
            <Route path="/login" element={<Layout><Auth defaultTab="login" /></Layout>} />
            <Route path="/registro" element={<Layout><Auth defaultTab="register" /></Layout>} />
            <Route path="/forgot-password" element={<Layout hideNavLinks={true}><ForgotPassword /></Layout>} />
            <Route path="/reset-password" element={<Layout hideNavLinks={true}><ResetPassword /></Layout>} />
            <Route path="/cursos" element={<Layout><Courses /></Layout>} />

            {/* Alumno */}
            <Route path="/curso/:id" element={<ProtectedRoute><Layout><CourseDetail /></Layout></ProtectedRoute>} />
            <Route path="/checkout/:id" element={<ProtectedRoute><Layout><Checkout /></Layout></ProtectedRoute>} />
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
            <Route path="/admin/courses" element={<AdminCourses />} />
            <Route path="/admin/courses/new" element={<AdminCourseForm />} />
            <Route path="/admin/courses/edit/:id" element={<AdminCourseForm />} />
          </Routes>
        </CoursesProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}