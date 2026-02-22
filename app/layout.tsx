import "./globals.css";

export const metadata = {
  title: "BISINDO Realtime",
  description: "Deteksi bahasa isyarat BISINDO secara real-time dari kamera"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
