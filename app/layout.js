import "./globals.css";

export const metadata = {
  title: "Read Write",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
