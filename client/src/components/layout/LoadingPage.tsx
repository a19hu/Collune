const LoadingPage = () => (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-5 py-12 text-center font-sans">
        <div>
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600"></div>
            <p className="mt-4 text-sm font-bold text-slate-600">Checking workspace...</p>
        </div>
    </main>
);

export default LoadingPage;