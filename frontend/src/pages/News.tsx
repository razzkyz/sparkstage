import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PageTransition } from '../components/PageTransition';

export default function News() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <PageTransition>
      <div className="min-h-screen bg-white flex items-center justify-center">
        <main className="max-w-4xl mx-auto px-6 lg:px-8 py-20">
          
          {/* Coming Soon Section */}
          <section className="flex flex-col items-center justify-center gap-12 text-center">
            
            {/* Top Divider Line */}
            <div className="w-24 h-px bg-gray-300"></div>
            
            {/* Main Content */}
            <div className="space-y-8">
              {/* Subtitle */}
              <div className="flex justify-center">
                <span className="text-[11px] font-bold uppercase tracking-[3px] text-gray-500 border border-gray-300 px-4 py-2 rounded-full">
                  News & Insights
                </span>
              </div>
              
              {/* Main Heading */}
              <h1 className="text-6xl md:text-8xl font-black text-gray-900 uppercase tracking-tighter leading-[1] font-serif">
                Coming<br />Soon
              </h1>
              
              {/* Description */}
              <div className="max-w-md mx-auto space-y-4">
                <p className="text-sm md:text-base text-gray-600 font-light tracking-wide leading-relaxed">
                  We're curating exclusive stories, trends, and inspiring content from the world of fashion, beauty, and lifestyle.
                </p>
              </div>
              
              {/* CTA Button */}
              <div className="pt-6 flex justify-center">
                <Link 
                  to="/on-stage" 
                  className="bg-black text-white px-12 py-3 text-[11px] font-bold uppercase tracking-widest rounded-full hover:bg-[#ff4b86] transition-all duration-300 shadow-md hover:shadow-lg"
                >
                  Explore Our Stages
                </Link>
              </div>
            </div>
            
            {/* Bottom Divider Line */}
            <div className="w-24 h-px bg-gray-300 mt-4"></div>
            
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
