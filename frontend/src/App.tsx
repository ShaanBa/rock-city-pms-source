import { useState } from "react";
import { Dashboard } from "./Dashboard";
import { WalkIn } from "./WalkIn";
import { PhoneBooking } from "./PhoneBooking";
import { Manifest } from "./Manifest";
import { OtaIntake } from "./OtaIntake";
import { WebAssign } from "./WebAssign";
import { Reservations } from "./Reservations";

const navItems = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'reservations', label: 'Reservations' },
  { id: 'online', label: 'Online' },
  { id: 'walkin', label: 'Walk In' },
  { id: 'phone', label: 'Phone' },
  { id: 'today', label: 'Today' },
  { id: 'unassigned', label: 'Web Assign' }
] as const;

export function App() {
  const [activePage, setActivePage] = useState('dashboard');

  return (
    <div className="flex h-[100dvh] min-h-screen flex-col bg-slate-100 text-slate-950 md:flex-row">
      <nav className="sticky top-0 z-20 flex w-full shrink-0 flex-row overflow-x-auto border-b border-slate-300 bg-white pt-[env(safe-area-inset-top)] shadow-sm md:static md:w-64 md:flex-col md:border-r md:border-b-0 md:pt-0 md:shadow-none">
        {navItems.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            className={`min-h-14 shrink-0 whitespace-nowrap px-5 py-3 text-center text-base font-semibold md:min-h-16 md:flex-none md:px-7 md:py-5 md:text-left md:text-lg ${activePage === id ? 'bg-blue-700 text-white' : 'bg-white text-slate-800 hover:bg-slate-100'}`}
            onClick={() => setActivePage(id)}
          >
            {label}
          </button>
        ))}
      </nav>
      <main className="flex-1 overflow-y-auto p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:p-6">
        {activePage == 'dashboard' && <Dashboard />}
        {activePage == 'reservations' && <Reservations />}
        {activePage == 'online' && <OtaIntake setActivePage={setActivePage} />}
        {activePage == 'walkin' && <WalkIn setActivePage={setActivePage} />}
        {activePage == 'phone' && <PhoneBooking setActivePage={setActivePage} />}
        {activePage == 'today' && <Manifest />}
        {activePage == 'unassigned' && <WebAssign />}
      </main>
    </div>
  )
}