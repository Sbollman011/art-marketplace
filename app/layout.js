import './globals.css';

export const metadata = {
  title: 'Art Marketplace',
  description: 'Buy beautiful artwork online',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <header className="header">
          <nav>
            <h1>🎨 Art Store</h1>
            <div>
              <a href="/">Shop</a>
              <a href="/orders">My Orders</a>
              <a href="/admin">Admin</a>
            </div>
          </nav>
        </header>
        <main>{children}</main>
        <footer>
          <p>&copy; 2024 Art Marketplace. All rights reserved.</p>
        </footer>
      </body>
    </html>
  );
}
