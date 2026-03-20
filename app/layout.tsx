import type { Metadata } from "next";
import { Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-heading" });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-ui" });

export const metadata: Metadata = {
  title: "Vensato App",
  description: "PMS para Inversionistas Inmobiliarios Independientes",
  icons: { icon: "/vensato-favicon.ico" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${playfair.variable} ${jakarta.variable} antialiased`}>
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
