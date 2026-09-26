import './globals.css';
import { AuthProvider } from '../context/AuthContext';
import AdminLayout from '../components/AdminLayout';
import { Toaster } from 'react-hot-toast';

export const metadata = {
  title: 'WePrixe Admin Panel — Control Center',
  description: 'Admin Control Center for multi-tenant e-commerce platform',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <AdminLayout>{children}</AdminLayout>
          <Toaster position="top-right" />
        </AuthProvider>
      </body>
    </html>
  );
}
