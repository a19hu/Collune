import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { Button } from "@/components/ui/button"

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div className="min-h-svh w-screen bg-gradient-to-br from-amber-200 via-amber-300 to-orange-300 flex items-center justify-center p-6">
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl">

    {/* Card 1 */}
    <div className="col-span-1 md:col-span-2 bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg hover:scale-[1.02] transition">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">🚀 Dashboard</h2>
      <p className="text-gray-600">
        Clean bento-style layout using Tailwind CSS. Perfect for hackathons.
      </p>
      <button className="mt-4 px-5 py-2 rounded-lg bg-amber-500 text-white font-semibold hover:bg-amber-600 transition">
        Explore
      </button>
    </div>

    {/* Card 2 */}
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg hover:scale-[1.02] transition">
      <h3 className="font-semibold text-lg text-gray-800">📊 Stats</h3>
      <p className="text-3xl font-bold mt-4 text-amber-600">128</p>
      <p className="text-gray-500 text-sm">Active Tasks</p>
    </div>

    {/* Card 3 */}
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg hover:scale-[1.02] transition">
      <h3 className="font-semibold text-lg text-gray-800">⚡ Speed</h3>
      <p className="text-gray-600 mt-2">
        Built with Vite + React + Tailwind
      </p>
    </div>

    {/* Card 4 */}
    <div className="col-span-1 md:col-span-2 bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg hover:scale-[1.02] transition">
      <h3 className="font-semibold text-lg text-gray-800">🎯 Actions</h3>
      <div className="flex gap-4 mt-4">
        <button className="px-4 py-2 rounded-lg bg-black text-white hover:opacity-80 transition">
          Create
        </button>
        <button className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition">
          View All
        </button>
      </div>
    </div>

  </div>
</div>

    </>
  )
}

export default App
