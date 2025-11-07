import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Studieo | Real Projects. Elite Student Teams.",
  description: "A launchpad for real-world innovation, connecting elite student teams from top universities with forward-thinking companies to build what matters.",
  icons: {
    icon: [
      { url: "/Studieo Logo/Favicon-Light.svg", media: "(prefers-color-scheme: light)" },
      { url: "/Studieo Logo/Favicon-Dark.svg", media: "(prefers-color-scheme: dark)" },
    ],
    apple: [
      { url: "/Studieo Logo/Icon-Light.svg", media: "(prefers-color-scheme: light)" },
      { url: "/Studieo Logo/Icon-Dark.svg", media: "(prefers-color-scheme: dark)" },
    ],
  },
};

const inter = Inter({
  variable: "--font-inter",
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster richColors position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
