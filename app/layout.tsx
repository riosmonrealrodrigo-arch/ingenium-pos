import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { ProductProvider } from '@/context/ProductContext';
import { CartProvider } from '@/context/CartContext';
import { SalesProvider } from '@/context/SalesContext';
import { ClientProvider } from '@/context/ClientContext';
import OfflineNoticeModal from '@/components/OfflineNoticeModal';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Ingenium POS',
  description: 'Vende inteligente, cobra rápido',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${inter.className} bg-gray-50 min-h-screen`}>
        <AuthProvider>
          <ProductProvider>
            <CartProvider>
              <SalesProvider>
                <ClientProvider>
                  <OfflineNoticeModal />
                  {children}
                </ClientProvider>
              </SalesProvider>
            </CartProvider>
          </ProductProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
