import { useEffect } from 'react';
import { PageTransition } from '../components/PageTransition';

export default function News() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <PageTransition>
      <div className="min-h-screen bg-white flex items-center justify-center">
        <main className="max-w-4xl mx-auto px-6 lg:px-8">
          
          {/* Coming Soon Section */}
          <section className="flex flex-col items-center justify-center">
            <h1 className="text-6xl md:text-8xl font-black text-gray-900 uppercase tracking-tight leading-[1] font-serif">
              Coming Soon
            </h1>
          </section>

        </main>

        {/* Footer Bar */}
        <div className="bg-black text-white py-6 px-6 md:px-12 flex flex-col md:flex-row justify-between items-center text-[10px] font-bold tracking-widest uppercase gap-4 text-center md:text-left">
          <span>ALL THE RIGHTS RESERVED</span>
          <span>© 2023 CONDÉ NAST</span>
        </div>
      </div>
    </PageTransition>
  );
}
