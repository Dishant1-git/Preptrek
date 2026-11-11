import "./globals.css";

export const metadata = {
  title: "PrepTrek — Track your preparation",
  description: "Study tracker by Team Crudify (www.crudify.in)",
  icons: { icon: "/logo-icon.jpg" },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
