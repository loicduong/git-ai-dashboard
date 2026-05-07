import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Git AI Dashboard",
  description: "Self-hosted analytics for Git AI contribution metrics"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
