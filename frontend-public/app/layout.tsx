import type { Metadata } from "next";
import { Bitter, Karla } from "next/font/google";
import "./globals.css";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";

const bitter = Bitter({
  variable: "--font-bitter",
  subsets: ["latin"],
});

const karla = Karla({
  variable: "--font-karla",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://rockcitymotel.com"),
  title: {
    default: "Rock City Motel - Affordable Motel",
    template: "%s | Rock City Motel"
  },
  description: "We are a small affordable motel located in Minneapolis Kansas off us-81 and not far from i70, and just a short drive from Ottawa, Lindsborg, and Salina. Save money directly booking with us via call or our website!"
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${bitter.variable} ${karla.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-body">
        <SiteHeader />
        {
          children
        }
        <SiteFooter />
      </body>
    </html>
  );
}
