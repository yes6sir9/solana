import type { FC, ReactNode } from "react";
import { Navbar } from "./Navbar";

export const Layout: FC<{ children: ReactNode }> = ({ children }) => (
  <div className="min-h-screen flex flex-col">
    <Navbar />
    <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">{children}</main>
    <footer className="text-center text-xs text-gray-500 py-6 border-t border-white/5">
      PetNFT MVP — running on Solana Devnet. Not real funds. Built for learning &amp; demo purposes.
    </footer>
  </div>
);
