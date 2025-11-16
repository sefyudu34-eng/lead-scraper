import '@/styles/globals.css'; // si tu utilises Tailwind
import type { AppProps } from 'next/app';

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
