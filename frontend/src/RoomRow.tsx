import { useEffect, useState } from "react";
import type { RoomRowProps, Room, Pricing } from "./PhoneBooking";
import toast from "react-hot-toast";
import { groupBy } from "./groupBy";
import { lanApiUrl, staffFetch } from "./apiConfig";

export function RoomRow({
    room, defaultCheckIn, defaultCheckOut, alreadySelectedRoomIds, onChange, onPriceChange, onRemove
}: RoomRowProps) {
    const checkIn = room.checkInDate || defaultCheckIn;
    const checkOut = room.checkOutDate || defaultCheckOut;
    const [openRooms, setOpenRooms] = useState<Room[]>([])
    useEffect(() => {
        async function fetchAvailableRooms() {
            if (!checkIn || !checkOut) return;
            try {
                const response = await staffFetch(`${lanApiUrl()}/api/rooms/available?checkInDate=${checkIn}&checkOutDate=${checkOut}`)
                if (!response.ok) throw new Error('Failed to get rooms');
                const data: { availableRooms: Room[] } = await response.json()
                setOpenRooms(data.availableRooms)
            } catch (error) {
                console.error(error);
            }
        }
        fetchAvailableRooms();
    }, [checkIn, checkOut])

    const selectedIdsKey = alreadySelectedRoomIds.join(',');
    useEffect(() => {
        const availableRooms = openRooms.filter(r => !alreadySelectedRoomIds.includes(r.id) || r.id === room.roomId)
        if (room.roomId === 0 && availableRooms.length > 0) {
            onChange({ ...room, roomId: availableRooms[0].id })
        }
    }, [openRooms, room.roomId, selectedIdsKey])

    const [priceTotals, setPriceTotals] = useState<Pricing | null>(null)
    useEffect(() => {
        if (!room.roomId || !checkIn || !checkOut) {
            onPriceChange(null);
            return
        }
        const fetchPrices = async () => {
            try {
                const response = await staffFetch(`${lanApiUrl()}/api/pricing/calculate`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            ...room,
                            checkInDate: checkIn,
                            checkOutDate: checkOut
                        })
                    }
                );
                if (!response.ok) throw new Error('Failed to get prices');
                const prices = await response.json();
                setPriceTotals(prices);
                onPriceChange(prices)
            } catch (error) {
                toast.error(`Error: ${error}`)
            }
        }
        fetchPrices();
    }, [
        room.roomId,
        room.numberOfGuests,
        room.petCount,
        room.additionalFees,
        room.discountAmount,
        checkIn,
        checkOut,
    ])

    const availableRooms = openRooms.filter(r => !alreadySelectedRoomIds.includes(r.id) || r.id === room.roomId)

    const groupedRooms = groupBy(availableRooms, (r) => r.RoomType)
    return (

        <div className="flex flex-col justify-between gap-5 rounded-xl bg-white p-4 shadow-sm sm:p-5 md:flex-row md:items-center">
            <div className="grid flex-grow grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <div className="flex flex-col gap-2 sm:col-span-2 lg:col-span-1">
                    <label className="text-sm font-bold text-slate-800" htmlFor="rooms">Room</label>
                    <select
                        className="min-h-12 rounded-lg border-2 border-slate-400 bg-white p-3 text-lg text-slate-950 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        name="rooms"
                        id="rooms"
                        value={room.roomId}
                        onChange={(e) => onChange({ ...room, roomId: Number(e.target.value) })}
                    >
                        {Object.entries(groupedRooms).map(([roomType, rooms]) => (
                            <optgroup key={roomType} label={roomType}>
                                {rooms?.map((r) => {
                                    const tier = r.PriorityTier ?? r.priorityTier;
                                    const notes = r.ConditionNotes ?? r.conditionNotes;
                                    const priorityText = tier && tier >= 2 ? ` · P${tier}${notes ? ` - ${notes}` : ''}` : '';
                                    return (
                                        <option key={r.id} value={r.id}>
                                            {r.RoomNumber}{priorityText}
                                        </option>
                                    );
                                })}
                            </optgroup>
                        ))}
                    </select>
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-slate-800" htmlFor="numberOfGuests">Guests</label>
                    <input className="min-h-12 rounded-lg border-2 border-slate-400 bg-white p-3 text-lg text-slate-950 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        type="number"
                        id="numberOfGuests"
                        name="numberOfGuests"
                        value={room.numberOfGuests}
                        onChange={(e) => onChange(
                            e.target.value === ""
                                ? { ...room, numberOfGuests: "" as any }
                                : { ...room, numberOfGuests: Number(e.target.value) }
                        )}
                        onBlur={(e) => {
                            if (e.target.value === "") {
                                onChange({ ...room, numberOfGuests: 1 })
                            }
                        }}
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-slate-800" htmlFor="petCount">Pets</label>
                    <input className="min-h-12 rounded-lg border-2 border-slate-400 bg-white p-3 text-lg text-slate-950 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        type="number"
                        id="petCount"
                        name="petCount"
                        value={room.petCount}
                        onChange={(e) => onChange(e.target.value === "" ? { ...room, petCount: "" as any } : { ...room, petCount: Number(e.target.value) })}
                        onBlur={(e) => {
                            if (e.target.value === "") {
                                onChange({ ...room, petCount: 0 })
                            }
                        }}
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-slate-800" htmlFor="additonalFees">Extra Fees</label>
                    <input className="min-h-12 rounded-lg border-2 border-slate-400 bg-white p-3 text-lg text-slate-950 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        type="number"
                        id="additonalFees"
                        name="additonalFees"
                        value={room.additionalFees}
                        onChange={(e) => onChange(e.target.value === "" ? { ...room, additionalFees: "" as any } : { ...room, additionalFees: Number(e.target.value) })}
                        onBlur={(e) => {
                            if (e.target.value === "") {
                                onChange({ ...room, additionalFees: 0 })
                            }
                        }}
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-slate-800" htmlFor="discountAmount">Discount</label>
                    <input className="min-h-12 rounded-lg border-2 border-slate-400 bg-white p-3 text-lg text-slate-950 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        type="number"
                        id="discountAmount"
                        name="discountAmount"
                        value={room.discountAmount}
                        onChange={(e) => onChange(e.target.value === "" ? { ...room, discountAmount: "" as any } : { ...room, discountAmount: Number(e.target.value) })}
                        onBlur={(e) => {
                            if (e.target.value === "") {
                                onChange({ ...room, discountAmount: 0 })
                            }
                        }}
                    />
                </div>
            </div>

            <div className="flex min-w-[170px] flex-col items-start gap-2 border-t-2 border-slate-200 pt-4 md:items-end md:border-t-0 md:border-l-2 md:pt-0 md:pl-5">
                <div className="text-left text-base font-medium text-slate-800 md:text-right">
                    <p>Subtotal: ${priceTotals?.roomSubTotal.toFixed(2)}</p>
                    <p>Taxes: ${priceTotals?.roomTaxAmount.toFixed(2)}</p>
                    <p>Fees: ${priceTotals?.additionalFees.toFixed(2)}</p>
                </div>
                <p className="text-xl font-black text-slate-950">Total: ${priceTotals?.roomTotalAmount.toFixed(2)}</p>
                <button
                    type="button"
                    className="min-h-12 w-full rounded-lg border-2 border-red-700 bg-white px-4 py-3 text-base font-bold text-red-800 hover:bg-red-50 md:w-auto"
                    onClick={() => onRemove()}
                >
                    Remove Room
                </button>
            </div>
        </div>
    )
}
