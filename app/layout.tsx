import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { ProductProvider } from '@/context/ProductContext';
import { CartProvider } from '@/context/CartContext';
import { SalesProvider } from '@/context/SalesContext';
import { ClientProvider } from '@/context/ClientContext';
import { StoreThemeProvider } from '@/context/StoreThemeContext';
import OfflineNoticeModal from '@/components/OfflineNoticeModal';
import AdminNotificationSystem from '@/components/admin/AdminNotificationSystem';

export const viewport: Viewport = {
  themeColor: '#1e3a5f',
};

export const metadata: Metadata = {
  title: 'Ingenium POS',
  description: 'Vende inteligente, cobra rápido',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'INGENIUM POS',
  },
  icons: {
    icon: '/images/logo.jpg',
    apple: '/images/logo.jpg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="font-sans antialiased bg-gray-50 min-h-screen">
        <AuthProvider>
          <ProductProvider>
            <CartProvider>
              <SalesProvider>
                <ClientProvider>
                  <StoreThemeProvider>
                    <OfflineNoticeModal />
                    <AdminNotificationSystem />
                    {children}
                  </StoreThemeProvider>
                </ClientProvider>
              </SalesProvider>
            </CartProvider>
          </ProductProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
