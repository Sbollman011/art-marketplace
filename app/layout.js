import './globals.css';

export const metadata = {
  title: 'Goodness Gracious Gabriel - Original Artwork',
  description: 'Contemporary art by Gabriel Davis. Original paintings, drawings, and mixed media.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
