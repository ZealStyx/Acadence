import type { Metadata, Viewport } from 'next';
import './globals.css';
import './workspace-theme.css';
export const viewport: Viewport = {width:'device-width', initialScale:1, viewportFit:'cover'};
export const metadata: Metadata = {title:'Pulso — Your workload, in perspective',description:'A clearer view of your academic workload.'};
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="en"><body>{children}</body></html>}
