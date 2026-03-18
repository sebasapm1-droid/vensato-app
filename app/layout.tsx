import type { Metadata } from "next";
import { Playfair_Display, Plus_Jakarta_Sans, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["700"],
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-ui",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Vensato App",
  description: "Property Management System premium para inversionistas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={cn("font-sans", geist.variable)}>
      <body
        className={`${playfair.variable} ${jakarta.variable} font-ui antialiased bg-vensato-base text-vensato-text-main`}
      >
        {children}
      </body>
    </html>
  );
}
