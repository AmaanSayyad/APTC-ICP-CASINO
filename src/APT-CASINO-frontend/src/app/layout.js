import { Inter } from "next/font/google";
import "@/styles/globals.css";
import Providers from "./providers";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ErrorBoundary from "@/components/ErrorBoundary";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "APT Casino",
  description: "APT Casino",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${inter.className} overflow-x-hidden w-full`}
        suppressHydrationWarning={true}
      >
        <Providers>
          <ErrorBoundary>
            <Navbar />
            {children}
            <Footer />
          </ErrorBoundary>
        </Providers>
      </body>
    </html>
  );
}
