export const metadata = {
  title: 'Kappa Theta Phi II Fraternity | Wokou-Corsairs',
  description: 'Death by Dishonor · Est. 3/14/21',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@400;700;900&family=Zen+Antique+Soft&family=Rajdhani:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
