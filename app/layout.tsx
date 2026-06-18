import type { Metadata } from "next";
import { ThemeToggle } from "@/components/ThemeToggle";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dumpyard",
  description: "A public shelf for PDFs and saved text."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: `
try {
  var savedTheme = localStorage.getItem("dumpyard-theme");
  var systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  document.documentElement.dataset.theme = savedTheme || (systemDark ? "dark" : "light");
} catch {}
`
          }}
        />
        <ThemeToggle />
        {children}
      </body>
    </html>
  );
}
