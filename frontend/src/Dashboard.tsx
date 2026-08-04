import { useEffect, useState } from "react"
import { toast } from 'react-hot-toast'
import { lanApiUrl, staffFetch } from './apiConfig'
import { EditStayModal } from "./EditStayModal"

type CleanStatus = 'Clean' | 'Dirty' | 'OutOfOrder' | 'NotRented'

type RoomStayStatus = 'Confirmed' | 'CheckedIn' | 'CheckedOut' | 'Cancelled'

interface RoomRow {
    rooms: {
        id: number
        RoomNumber: number
        cleanStatus: CleanStatus
        RoomType: string,
        IsSmoking: boolean,
        ConditionNotes: string | null;
        PriorityTier: number;
    }
    room_stays: {
        id: string,
        RoomStayStatus: RoomStayStatus,
        CheckInDate: string
        CheckOutDate: string
    } | null;
    housekeepingDue?: boolean
}

export function Dashboard() {
    const [roomData, setRoomData] = useState<RoomRow[]>([])
    const [selectedRoom, setSelectedRoom] = useState<RoomRow | null>(null)


    const fetchRooms = async () => {
        try {
            const response = await staffFetch(`${lanApiUrl()}/api/rooms`);
            if (!response.ok) throw new Error("Failed to get rooms.")
            const rooms: RoomRow[] = await response.json();
            setRoomData(rooms);
        } catch (error) {
            toast.error(`Error: ${error}`)
        }
    }


    useEffect(() => {
        const interval = setInterval(() => {
            if (document.visibilityState === 'visible') {
                fetchRooms()
            }
        }, 60000)
        return () => clearInterval(interval)
    }, [])

    useEffect(() => {
        function handleFocus() {
            if (document.visibilityState === 'visible') {
                fetchRooms()
            }
        }
        const cleanFocus = () => document.removeEventListener("visibilitychange", handleFocus)
        document.addEventListener("visibilitychange", handleFocus)
        fetchRooms()
        return cleanFocus
    }, [])

    function roomStatusColor(room: RoomRow) {
        if (room.room_stays === null) {
            if (room.rooms.cleanStatus === 'Clean') {
                return 'bg-green-500';
            } else if (room.rooms.cleanStatus === 'Dirty') {
                return 'bg-yellow-500';
            } else {
                return 'bg-gray-500';
            }
        } else {
            if (room.room_stays.RoomStayStatus == 'Confirmed') {
                return "bg-blue-700 after:content-['RESERVED']"
            } else if (room.room_stays.RoomStayStatus == 'CheckedIn') {
                if (room.rooms.cleanStatus == 'Dirty') {
                    return 'bg-red-600'
                } else {
                    return 'bg-violet-600'
                }
            } else if (room.room_stays.RoomStayStatus == 'CheckedOut') {
                return "bg-green-700 after:content-['CHECKED_OUT']"
            } else if (room.room_stays.RoomStayStatus == 'Cancelled') {
                return "bg-slate-600 after:content-['CANCELLED']"
            } else {
                return 'bg-black'
            }
        }
    }

    function checksOutToday(room: RoomRow) {
        if ((!room.room_stays) || (room.room_stays.RoomStayStatus !== 'Confirmed' && room.room_stays.RoomStayStatus !== 'CheckedIn')) {
            return false
        } else {
            const date = room.room_stays.CheckOutDate.slice(0, 10)
            if (date === new Date().toLocaleDateString('en-CA')) {
                return true
            } else {
                return false
            }
        }
    }

    async function markClean(e: React.MouseEvent<HTMLButtonElement>) {
        try {
            e.preventDefault()
            if (!(selectedRoom) || !(selectedRoom.rooms)) return
            const write = await staffFetch(`${lanApiUrl()}/api/rooms/${selectedRoom.rooms.id}/clean`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        roomId: selectedRoom.rooms.id,
                    })
                }
            );
            if (!write.ok) throw new Error('Could not mark room clean')
            toast.success("Room marked Clean!")
            setSelectedRoom(null)
            fetchRooms()
        } catch (error) {
            toast.error(`Error: ${error}`)
        }
    }
    async function checkInRoom(e: React.MouseEvent<HTMLButtonElement>) {
        try {
            e.preventDefault()
            if (!(selectedRoom) || !(selectedRoom.room_stays)) return
            const checkIn = await staffFetch(`${lanApiUrl()}/api/roomstays/${selectedRoom.room_stays.id}/checkin`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        roomStaysId: selectedRoom.room_stays.id,
                    })
                }
            );
            if (!checkIn.ok) throw new Error("Failed to check in!")
            toast.success("Checked in successfully!")
            setSelectedRoom(null)
            fetchRooms()
        } catch (error) {
            toast.error(`Error: ${error}`)
        }
    }
    async function checkOutRoom(e: React.MouseEvent<HTMLButtonElement>) {
        try {
            e.preventDefault()
            if (!(selectedRoom) || !(selectedRoom.room_stays)) return
            const checkOut = await staffFetch(`${lanApiUrl()}/api/roomstays/${selectedRoom.room_stays.id}/checkout`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        roomStaysId: selectedRoom.room_stays.id,
                    })
                }
            );
            if (!checkOut.ok) throw new Error("Failed to check out")
            toast.success("Check out successful!")
            setSelectedRoom(null)
            fetchRooms()
        } catch (error) {
            toast.error(`Error: ${error}`)
        }
    }
    interface GuestInfo {
        firstName: string,
        lastName: string,
        reservationId: string,
        totalAmount: number
    }

    interface Folio {
        reservation: {
            id: string;
            GroupName: string | null;
            PaymentStatus: "Unpaid" | "Partial" | "Paid";
            BookingSource: "Phone" | "DirectWeb" | "WalkIn" | "Expedia" | "BookingDotCom";
            Status: "Active" | "Completed" | "Cancelled";
        },
        payments: {
            id: string;
            Amount: string;
            TransactionType: "Charge" | "Refund";
            PaymentMethod: "Stripe" | "PhysicalCreditCard" | "VirtualCreditCard" | "Cash";
            PayerType: "Expedia" | "BookingDotCom" | "Guest" | "OtherCorporate";
            Timestamp: string;
        }[],
        stays: {
            roomNumber: number | undefined;
            checkIn: string;
            checkOut: string;
            roomTotalAmount: string;
            roomStayStatus: "Cancelled" | "Confirmed" | "CheckedIn" | "CheckedOut";
            id: string;
        }[],
        folioTotal: string,
        paidTotal: string,
        balanceDue: string

    }
    const [guestDetails, setGuestDetails] = useState<GuestInfo | null>(null)
    const [folio, setFolio] = useState<Folio | null>(null)

    const [isEditingStay, setIsEditingStay] = useState(false);
    const [isEditingVacantNotes, setIsEditingVacantNotes] = useState(false);
    const [editVacantTier, setEditVacantTier] = useState<number>(1);
    const [editVacantNotes, setEditVacantNotes] = useState<string>("");
    const [editVacantStatus, setEditVacantStatus] = useState<string>("Clean");
    const [savingVacantRoom, setSavingVacantRoom] = useState<boolean>(false);

    useEffect(() => {
        if (selectedRoom && !selectedRoom.room_stays) {
            setEditVacantTier(selectedRoom.rooms.PriorityTier || 1);
            setEditVacantNotes(selectedRoom.rooms.ConditionNotes || "");
            setEditVacantStatus(selectedRoom.rooms.cleanStatus || "Clean");
            setIsEditingVacantNotes(false);
        }
    }, [selectedRoom]);

    async function handleSaveVacantRoom(e: React.FormEvent) {
        e.preventDefault();
        if (!selectedRoom) return;
        setSavingVacantRoom(true);
        try {
            const response = await staffFetch(`${lanApiUrl()}/api/rooms/${selectedRoom.rooms.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    priorityTier: Number(editVacantTier),
                    conditionNotes: editVacantNotes,
                    cleanStatus: editVacantStatus
                })
            });
            if (!response.ok) throw new Error("Failed to update room details");
            toast.success("Room condition updated!");
            setIsEditingVacantNotes(false);
            setSelectedRoom(null);
            fetchRooms();
        } catch (error) {
            toast.error(`Error: ${error}`);
        } finally {
            setSavingVacantRoom(false);
        }
    }

    async function fetchGuestDetails() {
        try {
            if (!(selectedRoom) || !(selectedRoom.room_stays)) return
            const response = await staffFetch(`${lanApiUrl()}/api/roomstays/${selectedRoom.room_stays.id}/details`);
            if (!response.ok) throw new Error("Failed to get guest details")
            const details: GuestInfo = await response.json();
            setGuestDetails(details);
            if (details.reservationId) {
                const folioResponse = await staffFetch(`${lanApiUrl()}/api/reservations/${details.reservationId}/folio`)
                if (!folioResponse.ok) throw new Error("Failed to get folio")
                const folioDetails: Folio = await folioResponse.json();
                setFolio(folioDetails)
            } else {
                setFolio(null)
            }
        } catch (error) {
            toast.error(`Error: ${error}`)
        }
    }
    useEffect(() => {
        if (!selectedRoom?.room_stays) {
            setGuestDetails(null)
            setFolio(null)
            return
        }
        fetchGuestDetails()
    }, [selectedRoom])

    async function markRoomDirty(_e: React.MouseEvent<HTMLButtonElement>) {
        try {
            if ((!selectedRoom) || !(selectedRoom.room_stays) || !(selectedRoom.rooms.cleanStatus === 'Clean')) return
            const markDirty = await staffFetch(`${lanApiUrl()}/api/rooms/${selectedRoom.rooms.id}/dirty`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        roomId: selectedRoom.rooms.id,
                    })
                }
            )
            if (!markDirty.ok) throw new Error('Could not mark dirty!')
            toast.success("Room marked Dirty!")
            setSelectedRoom(null)
            fetchRooms()
        } catch (error) {
            toast.error(`Error: ${error}`)
        }
    }
    return (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:gap-5">
            {roomData.map((room) => (
                <div
                    onClick={(_e) => {
                        setSelectedRoom(room)
                    }}
                    className={`relative flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-lg p-4 text-center font-bold text-white shadow-sm after:absolute after:bottom-3 after:rounded-md after:bg-black/25 after:px-2 after:py-1 after:text-base after:font-black after:tracking-wide ${roomStatusColor(room)}`}



                    key={room.rooms.id}>
                    <h1 className="text-5xl font-black leading-none sm:text-6xl">
                        {room.rooms.RoomNumber}
                    </h1>
                    {
                        checksOutToday(room) && (
                            <p
                                className="absolute top-2 left-2 max-w-[calc(100%-1rem)] rounded-md bg-yellow-300 px-2 py-1 text-base font-black leading-tight text-slate-950"
                            >
                                Checks out Today!
                            </p>
                        )
                    }
                    {
                        !room.room_stays && room.rooms.PriorityTier >= 2 && (
                            <span className="absolute top-2 right-2 rounded-md bg-black/30 px-2 py-0.5 text-sm font-black">
                                P{room.rooms.PriorityTier}
                            </span>
                        )
                    }
                    <p className="mt-2 text-base font-bold">{room.rooms.RoomType}</p>
                    {
                        !room.room_stays && room.rooms.PriorityTier >= 2 && room.rooms.ConditionNotes && (
                            <p className="text-xs text-white/80 italic mt-0.5 max-w-[90%] truncate">
                                {room.rooms.ConditionNotes}
                            </p>
                        )
                    }
                    {
                        room.rooms.IsSmoking && (
                            <p className="text-xl">🚬</p>
                        )
                    }
                    {
                        !room.room_stays && (
                            <p className="text-base font-black uppercase tracking-wide">{room.rooms.cleanStatus}</p>
                        )
                    }
                    {
                        room.room_stays?.RoomStayStatus === 'CheckedIn' && room.rooms.cleanStatus === 'Clean' && (
                            <p className="text-base font-black uppercase tracking-wide">Guest in</p>
                        )
                    }
                    {
                        room.room_stays?.RoomStayStatus === 'CheckedIn' && room.rooms.cleanStatus === 'Dirty' && (
                            <p className="text-base font-black uppercase tracking-wide">Needs clean</p>
                        )
                    }
                    {
                        (room.room_stays?.RoomStayStatus === 'CheckedIn' && room.rooms.cleanStatus === 'Clean' && room.housekeepingDue && (
                            <div className="absolute top-2 right-2 max-w-[calc(100%-1rem)] rounded-md bg-white px-2 py-1 text-base font-black leading-tight text-slate-950">Housekeeping Needed!</div>
                        )
                        )
                    }
                </div>
            ))}
            {selectedRoom && selectedRoom.room_stays && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-6"
                    onClick={() => setSelectedRoom(null)}>
                    <div
                        className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-xl bg-amber-50 p-5 shadow-xl sm:p-7"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {selectedRoom.room_stays.RoomStayStatus === 'CheckedIn' && selectedRoom.rooms.cleanStatus === 'Dirty' && (
                            <div className="mb-5 rounded-lg bg-red-700 p-4 text-center text-base font-black text-white">
                                GUEST IN ROOM — NEEDS CLEANING · NO KEY
                            </div>
                        )}
                        {selectedRoom.room_stays.RoomStayStatus === 'CheckedIn' && selectedRoom.rooms.cleanStatus === 'Clean' && (
                            <div className="mb-5 rounded-lg bg-violet-700 p-4 text-center text-base font-black text-white">
                                GUEST IN ROOM — DO NOT ASSIGN KEY
                            </div>
                        )}
                        {selectedRoom.room_stays.RoomStayStatus === 'Confirmed' && (
                            <div className="mb-5 rounded-lg bg-blue-700 p-4 text-center text-base font-black text-white">
                                ROOM IS RESERVED — NO KEY
                            </div>
                        )}
                        <p className="mb-1 text-base font-bold uppercase tracking-wide text-slate-700">Guest</p>
                        <p className="mb-2 text-2xl font-black text-slate-950">
                            {!guestDetails?.firstName && !guestDetails?.lastName
                                ? 'Walk-In Guest'
                                : `${guestDetails?.firstName ?? ''} ${guestDetails?.lastName ?? ''}`.trim()}
                        </p>
                        <p className="mb-5 text-base font-medium text-slate-800">
                            Room {selectedRoom.rooms.RoomNumber} ·{' '}
                            {selectedRoom.room_stays.CheckInDate.substring(0, 10)} →{' '}
                            {selectedRoom.room_stays.CheckOutDate.substring(0, 10)}
                        </p>

                        {selectedRoom.rooms.ConditionNotes && (
                            <div className="mb-5 rounded-lg border-2 border-amber-300 bg-amber-100 p-4 text-base italic text-amber-950">
                                <span className="mb-1 block text-base font-black not-italic uppercase tracking-wide text-amber-950">Room Notes</span>
                                {selectedRoom.rooms.ConditionNotes}
                            </div>
                        )}


                        {!folio && guestDetails && (
                            <p className="mb-5 text-base text-slate-900">
                                Room total: <span className="font-semibold">${Number(guestDetails.totalAmount).toFixed(2)}</span>
                            </p>
                        )}

                        {folio && (
                            <div className="mb-5 rounded-lg bg-white p-4 text-base shadow-sm">
                                <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
                                    <p className="font-semibold text-slate-900">Folio</p>
                                    <span className="rounded-md bg-slate-200 px-2 py-1 text-base font-semibold text-slate-900">
                                        {folio.reservation.BookingSource} · {folio.reservation.PaymentStatus}
                                    </span>
                                </div>
                                {folio.reservation.GroupName && (
                                    <p className="text-slate-700 mb-3">{folio.reservation.GroupName}</p>
                                )}

                                <p className="mb-2 text-base font-bold uppercase tracking-wide text-slate-700">Rooms</p>
                                <ul className="divide-y divide-slate-100 mb-4">
                                    {folio.stays.map((stay) => (
                                        <li
                                            key={stay.id}
                                            className={`py-2 flex justify-between gap-3 ${stay.roomNumber === selectedRoom.rooms.RoomNumber
                                                ? 'bg-amber-50 -mx-2 px-2 rounded'
                                                : ''}`}
                                        >
                                            <span className="text-slate-800">
                                                <span className="font-medium">Room {stay.roomNumber}</span>
                                                <span className="block text-base text-slate-700">
                                                    {stay.checkIn.substring(0, 10)} → {stay.checkOut.substring(0, 10)} · {stay.roomStayStatus}
                                                </span>
                                            </span>
                                            <span className="font-medium tabular-nums">${Number(stay.roomTotalAmount).toFixed(2)}</span>
                                        </li>
                                    ))}
                                </ul>

                                {folio.payments.length > 0 && (
                                    <>
                                        <p className="mb-2 text-base font-bold uppercase tracking-wide text-slate-700">Payments</p>
                                        <ul className="divide-y divide-slate-100 mb-4">
                                            {folio.payments.map((payment) => (
                                                <li key={payment.id} className="py-2 flex justify-between gap-3 text-slate-700">
                                                    <span>
                                                        {payment.TransactionType} · {payment.PaymentMethod} · {payment.PayerType}
                                                    </span>
                                                    <span className="tabular-nums font-medium">${Number(payment.Amount).toFixed(2)}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </>
                                )}

                                <div className="border-t border-slate-200 pt-3 space-y-1 font-medium">
                                    <div className="flex justify-between">
                                        <span>Folio total</span>
                                        <span className="tabular-nums">${Number(folio.folioTotal).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-700">
                                        <span>Paid</span>
                                        <span className="tabular-nums">${Number(folio.paidTotal).toFixed(2)}</span>
                                    </div>
                                    <div className={`flex justify-between ${Number(folio.balanceDue) > 0 ? 'text-red-700' : 'text-green-800'}`}>
                                        <span>Balance due</span>
                                        <span className="tabular-nums">${Number(folio.balanceDue).toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {selectedRoom.room_stays.RoomStayStatus === 'Confirmed' ? (
                                <button className="min-h-14 rounded-lg bg-blue-700 px-5 py-3 text-base font-bold text-white hover:bg-blue-800"
                                    type="submit"
                                    onClick={(e) => checkInRoom(e)}
                                >
                                    Check in to Room
                                </button>
                            ) : (
                                <button className="min-h-14 rounded-lg bg-blue-700 px-5 py-3 text-base font-bold text-white hover:bg-blue-800"
                                    type="submit"
                                    onClick={(e) => checkOutRoom(e)}
                                >
                                    Check Out
                                </button>
                            )}
                            {['Confirmed', 'CheckedIn'].includes(selectedRoom.room_stays.RoomStayStatus) && (
                                <button
                                    className="min-h-12 rounded-lg bg-amber-600 px-5 py-3 text-base font-bold text-white hover:bg-amber-700"
                                    type="button"
                                    onClick={() => setIsEditingStay(true)}
                                >
                                    Edit Stay
                                </button>
                            )}
                            <button className="min-h-12 rounded-lg bg-slate-700 px-5 py-3 text-base font-bold text-white hover:bg-slate-800"
                                onClick={(_e) => setSelectedRoom(null)}
                            >
                                Close
                            </button>
                            {selectedRoom.rooms.cleanStatus === 'Clean' && (
                                <button className="min-h-12 rounded-lg bg-slate-900 px-5 py-3 text-base font-bold text-white hover:bg-black"
                                    type="submit"
                                    onClick={(e) => markRoomDirty(e)}>
                                    Mark Dirty
                                </button>
                            )}
                            {selectedRoom.rooms.cleanStatus === 'Dirty' && (
                                <button className="min-h-12 rounded-lg bg-green-700 px-5 py-3 text-base font-bold text-white hover:bg-green-800"
                                    type="submit"
                                    onClick={(e) => markClean(e)}>
                                    Mark Clean
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )
            }

            {isEditingStay && selectedRoom?.room_stays && (
                <EditStayModal
                    roomStayId={selectedRoom.room_stays.id}
                    onClose={() => setIsEditingStay(false)}
                    onSuccess={() => {
                        setIsEditingStay(false);
                        setSelectedRoom(null);
                        fetchRooms();
                    }}
                />
            )}

            {
                selectedRoom && !selectedRoom.room_stays && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-6"
                        onClick={() => setSelectedRoom(null)}>
                        <div
                            className="w-full max-w-lg rounded-xl bg-amber-50 p-5 shadow-xl sm:p-7"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 className="mb-2 text-3xl font-black text-slate-950">Room {selectedRoom.rooms.RoomNumber} Details</h3>
                            <p className="mb-5 text-base font-medium text-slate-800">
                                Status: <span className="font-semibold text-slate-800">{selectedRoom.rooms.cleanStatus}</span> · Type: <span className="font-semibold text-slate-800">{selectedRoom.rooms.RoomType}</span>
                            </p>
                            
                            {selectedRoom.rooms.ConditionNotes && !isEditingVacantNotes && (
                                <div className="mb-5 rounded-lg border-2 border-amber-300 bg-amber-100 p-4 text-base italic text-amber-950">
                                    <span className="mb-1 block text-base font-black not-italic uppercase tracking-wide text-amber-950">Room Notes</span>
                                    {selectedRoom.rooms.ConditionNotes}
                                </div>
                            )}

                            {!isEditingVacantNotes ? (
                                <div className="mb-5">
                                    <button
                                        type="button"
                                        className="w-full rounded-lg bg-amber-700/20 py-2.5 text-sm font-bold text-amber-900 hover:bg-amber-700/30 border border-amber-300"
                                        onClick={() => setIsEditingVacantNotes(true)}
                                    >
                                        ✏️ Edit room notes
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleSaveVacantRoom} className="mb-5 rounded-lg border border-amber-300 bg-amber-100/60 p-4 text-left">
                                    <div className="mb-3 flex items-center justify-between">
                                        <span className="text-xs font-black uppercase tracking-wide text-amber-950">Edit Room Details</span>
                                        <button
                                            type="button"
                                            onClick={() => setIsEditingVacantNotes(false)}
                                            className="text-xs font-bold text-slate-600 hover:text-slate-900"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                    <div className="mb-3">
                                        <label className="block text-xs font-bold text-amber-900 mb-1">Room Status</label>
                                        <select
                                            className="w-full rounded-md border-2 border-amber-300 bg-white p-2 text-sm font-semibold text-slate-950 focus:border-blue-700 focus:outline-none"
                                            value={editVacantStatus}
                                            onChange={(e) => setEditVacantStatus(e.target.value)}
                                        >
                                            <option value="Clean">Clean</option>
                                            <option value="Dirty">Dirty</option>
                                            <option value="OutOfOrder">Out Of Order</option>
                                            <option value="NotRented">Not Rented</option>
                                        </select>
                                    </div>
                                    <div className="mb-3">
                                        <label className="block text-xs font-bold text-amber-900 mb-1">Priority Tier</label>
                                        <select
                                            className="w-full rounded-md border-2 border-amber-300 bg-white p-2 text-sm font-semibold text-slate-950 focus:border-blue-700 focus:outline-none"
                                            value={editVacantTier}
                                            onChange={(e) => setEditVacantTier(Number(e.target.value))}
                                        >
                                            <option value={1}>Tier 1 (Normal)</option>
                                            <option value={2}>Tier 2 (Minor quirks)</option>
                                            <option value={3}>Tier 3 (Last resort)</option>
                                        </select>
                                    </div>
                                    <div className="mb-3">
                                        <label className="block text-xs font-bold text-amber-900 mb-1">Condition Notes</label>
                                        <input
                                            type="text"
                                            maxLength={255}
                                            placeholder="e.g. poor AC, TV remote weird"
                                            className="w-full rounded-md border-2 border-amber-300 bg-white p-2 text-sm font-semibold text-slate-950 focus:border-blue-700 focus:outline-none"
                                            value={editVacantNotes}
                                            onChange={(e) => setEditVacantNotes(e.target.value)}
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={savingVacantRoom}
                                        className="w-full rounded-md bg-amber-800 py-2.5 text-sm font-bold text-white hover:bg-amber-900 disabled:opacity-50"
                                    >
                                        {savingVacantRoom ? "Saving..." : "Save Room Notes"}
                                    </button>
                                </form>
                            )}

                            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                {selectedRoom.rooms.cleanStatus === 'Dirty' ? (
                                    <button 
                                        className="min-h-14 rounded-lg bg-green-700 px-5 py-3 text-base font-bold text-white hover:bg-green-800"
                                        type="submit"
                                        onClick={(e) => markClean(e)}
                                    >
                                        Mark Clean
                                    </button>
                                ) : (
                                    <button 
                                        className="min-h-14 rounded-lg bg-slate-900 px-5 py-3 text-base font-bold text-white hover:bg-black"
                                        onClick={(e) => markRoomDirty(e)}
                                    >
                                        Mark Dirty
                                    </button>
                                )}
                                <button 
                                    className="min-h-12 rounded-lg border-2 border-slate-400 bg-white px-5 py-3 text-base font-bold text-slate-900 hover:bg-slate-100"
                                    onClick={(_e) => setSelectedRoom(null)}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div>
    )
}