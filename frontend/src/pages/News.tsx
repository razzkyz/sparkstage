import { useEffect } from 'react';
import { PageTransition } from '../components/PageTransition';

export default function News() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <PageTransition>
      <div className="min-h-screen bg-white flex items-center justify-center">
        <h1 className="text-6xl md:text-8xl font-black text-gray-900 uppercase tracking-tight font-serif">
          Coming Soon
        </h1>
      </div>
    </PageTransition>
  );
}
