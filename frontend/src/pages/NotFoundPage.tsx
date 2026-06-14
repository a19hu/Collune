import { ArrowLeft, Compass, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

export const NotFoundPage = () => {
  const content = (
    <>
      <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold uppercase tracking-wide text-slate-500 shadow-sm">
        <Compass className="h-3.5 w-3.5 text-indigo-600" />
        404
      </div>

      <div className="mt-6 space-y-4">
        <h1 className="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
          Page not found
        </h1>
        <p className="mx-auto max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
          This route does not exist in Schoolmate. Check the URL or return to the main workspace.
        </p>
      </div>

      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
      
          <Link
            to="/"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition-colors hover:bg-indigo-500"
          >
            <Home className="h-4 w-4" />
            Go Home
          </Link>
        <button
          type="button"
          onClick={() => window.history.back()}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Go Back
        </button>
      </div>
    </>
  );

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-5 py-12 text-center font-sans selection:bg-indigo-500 selection:text-white">
      <section className="w-full max-w-3xl">{content}</section>
    </main>
  );
};
