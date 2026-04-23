import type { Metadata } from "next";
import localfont from "next/font/local";
import "./globals.css";
import InnerLayout from "@/layouts/innerlayout";
import { ThemeProvider } from "@/components/theme-provider";

const myFont = localfont({
  src: "../public/fonts/PlusJakartaSans-Regular.ttf",
});

export const metadata: Metadata = {
  title: "Aura",
  description: "IS-108 Final Project",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={myFont.className} suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <InnerLayout>{children}</InnerLayout>
        </ThemeProvider>
      </body>
    </html>
  );
}
