import { useEffect, useState } from "react";
import type { Room } from "./PhoneBooking";
import toast from "react-hot-toast";
import { cloudApiUrl, importFetch, lanApiUrl, staffFetch } from "./apiConfig";

interface Booking {
    room_stays: {
        id: string;
        ReservationId: string;
        RoomId: number | null;
        CheckInDate: string;
        CheckOutDate: string;
        NumberOfGuests: number;
        PetCount: number;
        RoomTotalAmount: string;
        RoomStayStatus: string;
    };
    reservations: {
        id: string;
        RequestedRoomType: string | null;
        BookingSource: string;
        PaymentStatus: string;
    } | null;
    guests: {
        id: string;
        FirstName: string | null;
        LastName: string | null;
        Phone: string | null;
        Email: string | null;
    } | null;
}



export function WebAssign() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(false);

    async function fetchUnassignedBookings() {
        setLoading(true);
        try {
            const response = await staffFetch(`${cloudApiUrl()}/api/reservations/unassigned`)
            if (!response.ok) throw new Error('Failed to load unassigned bookings')
            const data = await response.json()
            setBookings(Array.isArray(data) ? data : [])
        } catch (error) {
            toast.error(`${error}`)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchUnassignedBookings()
    }, [])
    return (
        <div className="mx-auto max-w-4xl px-1 py-2 sm:px-4 sm:py-6">
            <h1 className="mb-6 text-3xl font-black text-slate-950">Web Assignments</h1>
            {loading && <p className="text-base font-semibold text-slate-800">Loading bookings...</p>}
            {!loading && bookings.length === 0 ? (
                <div className="rounded-xl bg-white p-8 text-center text-slate-900 shadow-sm sm:p-12">
                    <p className="text-xl font-bold">No unassigned bookings found</p>
                    <p className="mt-2 text-base text-slate-800">Direct web bookings with paid status are fully assigned.</p>
                </div>
            ) : (
                <div className="flex flex-col gap-5">
                    {bookings.map((b) => (
                        <UnassignedRow key={b.room_stays.id} booking={b} onAssignSuccess={fetchUnassignedBookings} />
                    ))}
                </div>
            )}
        </div>
    )
}

interface UnassignedRowProps {
    booking: Booking,
    onAssignSuccess: () => void;
}

export function UnassignedRow({ booking, onAssignSuccess }: UnassignedRowProps) {
    const [availableRooms, setAvaiableRooms] = useState<Room[]>([])
    const [selectedRoomId, setSelectedRoomId] = useState<number>(0)
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        async function fetchAvailableRooms() {
            const checkIn = booking.room_stays.CheckInDate.slice(0, 10)
            const checkOut = booking.room_stays.CheckOutDate.slice(0, 10)
            if (!checkIn || !checkOut) return;
            try {
                const response = await staffFetch(`${cloudApiUrl()}/api/rooms/available?checkInDate=${checkIn}&checkOutDate=${checkOut}`)
                if (!response.ok) throw new Error('Failed to get rooms');
                const data: { availableRooms: Room[] } = await response.json()
                const filteredRooms = data.availableRooms.filter((room) => room.RoomType === booking.reservations?.RequestedRoomType)
                setAvaiableRooms(filteredRooms)
                if (response.ok) {
                    toast.success('Rooms fetched successfully!')
                } else {
                    toast.error('Failed to fetch rooms')
                }
            } catch (error) {
                toast.error(`${error}`)
            } finally {
                setLoading(false);
            }
        }

        fetchAvailableRooms()
    }, [booking.room_stays.id])

    async function handleAssign(e: React.MouseEvent<HTMLButtonElement>) {
        e.preventDefault();
        if (selectedRoomId === 0) {
            toast.error("Please select a room!")
            return
        }
        setLoading(true)
        try {
            const cloudResponse = await staffFetch(`${cloudApiUrl()}/api/reservations/${booking.reservations?.id}/assign-room`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    roomId: selectedRoomId,
                    checkInDate: booking.room_stays.CheckInDate,
                    checkOutDate: booking.room_stays.CheckOutDate,
                    numberOfGuests: booking.room_stays.NumberOfGuests,
                    petCount: booking.room_stays.PetCount,
                    additionalFees: 0,
                    discountAmount: 0
                })
            })

            if (!cloudResponse.ok) {
                const errorText = await cloudResponse.text();
                throw new Error(`Cloud assignment failed: ${errorText}`);
            }

            const localResponse = await importFetch(`${lanApiUrl()}/api/reservations/import`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    guest: booking.guests,
                    reservation: booking.reservations,
                    stay: {
                        ...booking.room_stays,
                        RoomId: selectedRoomId
                    }
                })
            });

            if (!localResponse.ok) {
                const errorText = await localResponse.text();
                throw new Error(`Local import failed: ${errorText}`);
            }

            onAssignSuccess()
            toast.success("Assigned room successfully!")
        } catch (error) {
            toast.error(`${error}`)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex flex-col justify-between gap-6 rounded-xl bg-white p-5 shadow-sm md:flex-row md:items-center md:p-6">
            <div className="space-y-3">
                <p className="text-base font-bold uppercase tracking-wide text-blue-800">Web Booking</p>
                <h3 className="text-2xl font-black text-slate-950">
                    {booking.guests?.FirstName} {booking.guests?.LastName}
                </h3>
                <div className="flex flex-col gap-2 text-base text-slate-900 sm:flex-row sm:flex-wrap">
                    <span className="rounded-md bg-slate-100 px-3 py-2 font-semibold text-slate-900">
                        📅 {booking.room_stays.CheckInDate.slice(0, 10)} → {booking.room_stays.CheckOutDate.slice(0, 10)}
                    </span>
                    <span className="rounded-md bg-amber-100 px-3 py-2 font-bold text-amber-950">
                        🛏️ {booking.reservations?.RequestedRoomType}
                    </span>
                    <span className="rounded-md bg-slate-100 px-3 py-2 font-semibold text-slate-900">
                        👤 {booking.room_stays.NumberOfGuests} {booking.room_stays.NumberOfGuests === 1 ? 'guest' : 'guests'}
                    </span>
                    {Number(booking.room_stays.PetCount) > 0 && (
                        <span className="rounded-md bg-orange-100 px-3 py-2 font-bold text-orange-950">
                            🐾 {booking.room_stays.PetCount} {Number(booking.room_stays.PetCount) === 1 ? 'pet' : 'pets'}
                        </span>
                    )}
                </div>
            </div>

            <div className="flex w-full shrink-0 flex-col gap-3 border-t-2 border-slate-200 pt-5 md:w-auto md:min-w-56 md:border-t-0 md:pt-0">
                <select
                    className="min-h-14 w-full rounded-lg border-2 border-slate-400 bg-white p-3 text-lg font-semibold text-slate-950 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    value={selectedRoomId}
                    onChange={(e) => setSelectedRoomId(Number(e.target.value))}
                >
                    <option value={0}>Select Room...</option>
                    {availableRooms.map((room) => {
                        const tier = room.PriorityTier ?? room.priorityTier;
                        const notes = room.ConditionNotes ?? room.conditionNotes;
                        const priorityText = tier && tier >= 2 ? ` · P${tier}${notes ? ` - ${notes}` : ''}` : '';
                        return (
                            <option key={room.id} value={room.id}>
                                Room {room.RoomNumber}{priorityText}
                            </option>
                        );
                    })}
                </select>
                <button
                    className="min-h-14 w-full rounded-lg bg-blue-700 px-5 py-3 text-lg font-bold text-white hover:bg-blue-800 disabled:pointer-events-none disabled:opacity-50"
                    disabled={loading || selectedRoomId === 0}
                    onClick={(e) => handleAssign(e)}
                >
                    {loading ? "Assigning..." : "Assign Room"}
                </button>
            </div>
        </div>
    )
}
