import React from "react";
import Head from "next/head";
import Header from "../components/Header";
import Footer from "../components/Footer";

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function Layout({
  children,
  title = "GINVA - DeFi Lending Platform",
}: LayoutProps) {
  return (
    <div className="min-h-screen bg-ginva-navy">
      <Head>
        <title>{title}</title>
        <meta
          name="description"
          content="Distribute Revenue, Deliver Happiness, Provide Safety, Build Trust"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />

      <main className="flex-grow">{children}</main>

      <Footer />
    </div>
  );
}
