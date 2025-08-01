import React from "react";
import "../styles/globals.css";
import Providers from "./providers";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ErrorBoundary from "../components/ErrorBoundary";

export default function RootLayout({ children }) {
  return (
    <div className="app-root">
      <Providers>
        <ErrorBoundary>
          <Navbar />
          {children}
          <Footer />
        </ErrorBoundary>
      </Providers>
    </div>
  );
}
