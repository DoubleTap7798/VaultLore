import type { Metadata } from "next";

import { Providers } from "../components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "VaultLore | The Collector's Command Center",
  description:
    "Premium collector intelligence for scanning, valuing, organizing, and understanding collectible cards."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
