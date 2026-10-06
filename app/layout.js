import './globals.css';

export const metadata = {
  title: 'Gabriel - Contemporary Art',
  description: 'Original artwork by Gabriel. Contemporary paintings, drawings, and mixed media.',
  icons: {
    icon: [
      {
        url: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:%23ec4899;stop-opacity:1" /><stop offset="100%" style="stop-color:%23f59e0b;stop-opacity:1" /></linearGradient></defs><polygon points="50,10 90,40 80,90 20,90 10,40" fill="url(%23grad1)" stroke="%23ec4899" stroke-width="2"/><line x1="50" y1="10" x2="50" y2="70" stroke="%23f59e0b" stroke-width="1.5" opacity="0.6"/><circle cx="50" cy="55" r="8" fill="%23ec4899" opacity="0.8"/></svg>',
        type: 'image/svg+xml',
      }
    ],
    apple: [
      {
        url: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:%23ec4899;stop-opacity:1" /><stop offset="100%" style="stop-color:%23f59e0b;stop-opacity:1" /></linearGradient></defs><polygon points="50,10 90,40 80,90 20,90 10,40" fill="url(%23grad1)" stroke="%23ec4899" stroke-width="2"/><line x1="50" y1="10" x2="50" y2="70" stroke="%23f59e0b" stroke-width="1.5" opacity="0.6"/><circle cx="50" cy="55" r="8" fill="%23ec4899" opacity="0.8"/></svg>',
        type: 'image/svg+xml',
      }
    ],
  },
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
