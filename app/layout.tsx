import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'RepoForge',
  description: 'GitHub repository analyzer for technical and commercial MVP recreation insights.',
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <div className="app-frame">
          <header className="site-header">
            <div>
              <p className="eyebrow">RepoForge</p>
              <h1>GitHub repository analyzer</h1>
            </div>
            <p className="site-tagline">Technical plus commercial reports for public repositories, designed for product diligence and MVP recreation.</p>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
