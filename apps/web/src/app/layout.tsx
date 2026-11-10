import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Acadence — Your learning, in rhythm",
  description: "A focused academic workspace for keeping up with your learning.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}