import { PageTransition } from '../components/PageTransition';

const SparkClub = () => {
  return (
    <PageTransition>
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center space-y-6 max-w-2xl">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-main-100 mb-4">
            <span className="material-symbols-outlined text-5xl text-main-600">
              groups
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 uppercase tracking-tight">
            Spark Club
          </h1>
        </div>
      </div>
    </PageTransition>
  );
};

export default SparkClub;
