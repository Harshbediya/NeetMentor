import { Inter } from "next/font/google";
import "./globals.css";
import { TimerProvider } from "@/context/TimerContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "NEET Study Dashboard",
  description: "Distraction-free study mentor for NEET aspirants.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <TimerProvider>
          {children}
        </TimerProvider>
      </body>
    </html>
  );
}
