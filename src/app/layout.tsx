import { Inter } from "next/font/google";
import "./globals.css";
import ClientLayout from './ClientLayout';
import { QueueProvider } from '@/contexts/QueueContext';

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: 'QueueFlow',
  description: 'Sistema de gerenciamento de senhas',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} bg-gradient-to-br from-blue-50 to-white min-h-screen`}>
        <QueueProvider>
          <ClientLayout>
            {children}
          </ClientLayout>
        </QueueProvider>
      </body>
    </html>
  );
}
