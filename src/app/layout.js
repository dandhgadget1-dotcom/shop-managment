import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ShopProvider } from "@/context/ShopContext";
import { ToastProvider } from "@/components/ui/toast";
import { ShopSettingsProvider } from "@/context/ShopSettingsContext";
import { ThemeProvider } from "@/context/ThemeContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Shop Management System",
  description: "Manage customers, phones, and installments",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <ShopProvider>
            <ShopSettingsProvider>
              <ToastProvider>{children}</ToastProvider>
            </ShopSettingsProvider>
          </ShopProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
