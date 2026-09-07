import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Route53 Clone",
  description: "AWS Route53 console clone - hosted zones and DNS records",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
