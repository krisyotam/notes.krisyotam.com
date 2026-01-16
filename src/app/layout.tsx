import type { Metadata } from "next";
import { Outfit, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/lib/theme-context";
import { PanesProvider } from "@/lib/panes-context";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  display: "swap",
  style: ["normal", "italic"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "Kris Yotam - Notes",
  description: "Personal knowledge base and notes",
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${outfit.variable} ${sourceSerif.variable}`}>
        <ThemeProvider>
          <PanesProvider>{children}</PanesProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
