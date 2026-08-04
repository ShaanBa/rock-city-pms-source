import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { lanApiUrl, staffFetch } from "./apiConfig";

export interface ManifestResponse {
    arrivals: ManifestStay[];
    inHouse: ManifestStay[];
    departures: ManifestStay[];
}

export interface ManifestStay {
    room_stays: {
        id: string;
        CheckInDate: string;
        CheckOutDate: string;
        RoomStayStatus: string;
    };
    rooms: {
        RoomNumber: number;
    };
    guests: {
        FirstName: string | null;
        LastName: string | null;
    };
}

export function Manifest() {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [manifest, setManifest] = useState<ManifestResponse | null>(null)

    async function fetchManifest() {
        try {
            const response = await staffFetch(`${lanApiUrl()}/api/reservations/manifest?date=${date}`)
            const data = await response.json()
            setManifest(data)
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to load manifest')
        }
    }
    useEffect(() => {
        fetchManifest()
    }, [date]

    )

    async function handleCheckOut(stayId: string) {
        try {
            const checkOut = await staffFetch(`${lanApiUrl()}/api/roomstays/${stayId}/checkout`, {
                    method: 'PUT',
                }
            );
            if (!checkOut.ok) throw new Error("Failed to check out")
            fetchManifest()
            toast.success("Check out successful!")
        } catch (error) {
            toast.error(`Error: ${error}`)
        }
    }
    return (
        <div className="mx-auto max-w-7xl p-1 sm:p-4">
            {/* HEADER */}
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-3xl font-black text-slate-950">Daily Manifest</h1>
                <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="min-h-12 w-full rounded-lg border-2 border-slate-400 bg-white p-3 text-lg font-semibold text-slate-950 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200 sm:w-auto"
                />
            </div>

            {/* THREE COLUMN GRID */}
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">

                {/* ARRIVALS COLUMN */}
                <div>
                    <h2 className="mb-4 border-b-2 border-blue-200 pb-3 text-xl font-black text-slate-950">
                        Arrivals ({manifest?.arrivals?.length || 0})
                    </h2>
                    <div className="flex flex-col gap-4">
                        {manifest?.arrivals?.map((stay) => (
                            <div key={stay.room_stays.id} className="rounded-lg bg-white p-5 shadow-sm">
                                <p className="text-2xl font-black text-slate-950">Room {stay.rooms.RoomNumber}</p>
                                <p className="mt-1 text-base font-medium text-slate-800">
                                    {stay.guests.FirstName || ''} {stay.guests.LastName || 'Walk-In'}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* IN-HOUSE COLUMN */}
                <div>
                    <h2 className="mb-4 border-b-2 border-violet-200 pb-3 text-xl font-black text-slate-950">
                        In-House ({manifest?.inHouse?.length || 0})
                    </h2>
                    <div className="flex flex-col gap-4">
                        {manifest?.inHouse?.map((stay) => (
                            <div key={stay.room_stays.id} className="rounded-lg bg-white p-5 shadow-sm">
                                <p className="text-2xl font-black text-slate-950">Room {stay.rooms.RoomNumber}</p>
                                <p className="mt-1 text-base font-medium text-slate-800">
                                    {stay.guests.FirstName || ''} {stay.guests.LastName || 'Walk-In'}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* DEPARTURES COLUMN */}
                <div>
                    <h2 className="mb-4 border-b-2 border-amber-200 pb-3 text-xl font-black text-slate-950">
                        Departures ({manifest?.departures?.length || 0})
                    </h2>
                    <div className="flex flex-col gap-4">
                        {manifest?.departures?.map((stay) => (
                            <div key={stay.room_stays.id} className="flex flex-col gap-4 rounded-lg bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-2xl font-black text-slate-950">Room {stay.rooms.RoomNumber}</p>
                                    <p className="mt-1 text-base font-medium text-slate-800">
                                        {stay.guests.FirstName || ''} {stay.guests.LastName || 'Walk-In'}
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleCheckOut(stay.room_stays.id)}
                                    className="min-h-12 w-full rounded-lg bg-blue-700 px-5 py-3 text-base font-bold text-white hover:bg-blue-800 sm:w-auto"
                                >
                                    Check Out
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    )
}