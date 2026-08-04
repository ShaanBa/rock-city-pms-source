import { useEffect, useState, } from "react";
import React from "react";
import { toast } from 'react-hot-toast'
import { groupBy } from "./groupBy";
import { lanApiUrl, staffFetch } from "./apiConfig";

export interface OtaRoomRowProps {
    room: OtaBookedRoom;
    index: number;
    defaultCheckIn: string;
    defaultCheckOut: string;
    alreadySelectedRoomIds: number[];
    onChange: (updated: OtaBookedRoom) => void
    onRemove: () => void;
}

interface OtaFormData {
    firstName: string,
    lastName: string,
    phoneNumber: string
    checkInDate: string,
    checkOutDate: string,
    otaSource: string,
    groupName: string,
    otaConfirmed: string,
    vccConfirmed: string
    rooms: OtaBookedRoom[]
}

interface OtaBookedRoom {
    roomId: number,
    numberOfGuests: number,
    petCount: number,
    checkInDate?: string,
    checkOutDate?: string
    roomTaxAmount: number,
    roomTotalAmount: number
}

type cleanstatus = 'Clean' | 'Dirty' | 'OutOfOrder' | 'NotRented';
interface Room {
    id: number,
    RoomNumber: number,
    basePrice: number,
    isSmoking: boolean,
    CleanStatus: cleanstatus,
    priorityTier: number,
    conditionNotes: string,
    RoomType: string
}

interface OtaIntakeProps {
    setActivePage: (page: string) => void;
}

export function OtaIntake({ setActivePage }: OtaIntakeProps) {
    const [formData, setFormData] = useState<OtaFormData>({
        firstName: '',
        lastName: '',
        phoneNumber: '',
        checkInDate: '',
        checkOutDate: '',
        otaSource: 'Expedia',
        groupName: '',
        otaConfirmed: '',
        vccConfirmed: '',
        rooms: [{
            roomId: 0,
            numberOfGuests: 1,
            petCount: 0,
            roomTaxAmount: 0,
            roomTotalAmount: 0
        }]
    })

    function addRoom() {
        setFormData({
            ...formData, rooms: [
                ...formData.rooms,
                {
                    roomId: 0,
                    numberOfGuests: 1,
                    petCount: 0,
                    roomTaxAmount: 0,
                    roomTotalAmount: 0
                }

            ]
        })
    }

    function removeRoom(indexToRemove: number) {
        if (formData.rooms.length <= 1) return;
        setFormData({
            ...formData,
            rooms:
                formData.rooms.filter((_room, index) => index != indexToRemove)
        })
    }

    function handleRoomChange(indexToUpdate: number, updatedRoom: OtaBookedRoom) {
        setFormData({
            ...formData,
            rooms:
                formData.rooms.map((room, index) => {
                    if (index === indexToUpdate) {
                        return updatedRoom
                    } else {
                        return room
                    }
                }

                )
        })
    }

    async function submitBooking(e: React.MouseEvent<HTMLButtonElement>) {
        e.preventDefault()
        try {
            const response = await staffFetch(`${lanApiUrl()}/api/reservations/ota`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData),
                }
            );
            if (!response.ok) throw new Error('Failed to book')
            toast.success('Booking Successful!')
            setActivePage('dashboard')
        }
        catch (error) {
            toast.error(`Error: ${error}`)
        }
    }

    const taxes = formData.rooms.reduce((totalTaxes, room) => totalTaxes + Number(room.roomTaxAmount || 0), 0)
    const totalDue = formData.rooms.reduce((totalDue, room) => totalDue + Number(room.roomTotalAmount || 0), 0)
    const subTotal = totalDue - taxes
    return (
        <form className="mx-auto max-w-5xl">

            <div className="flex flex-col gap-4">
                <label className="text-base font-bold text-slate-900" htmlFor="firstName">First Name:</label>
                <input className="min-h-14 rounded-lg border-2 border-slate-400 bg-white p-4 text-lg text-slate-950 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    type="text"
                    id="firstName"
                    name="firstName"
                    autoComplete="off"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                />

                <label className="text-base font-bold text-slate-900" htmlFor="lastName">Last Name:</label>
                <input className="min-h-14 rounded-lg border-2 border-slate-400 bg-white p-4 text-lg text-slate-950 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    type="text"
                    id="lastName"
                    name="lastName"
                    autoComplete="off"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                />

                <label className="text-base font-bold text-slate-900" htmlFor="phoneNumber">Phone Number:</label>
                <input className="min-h-14 rounded-lg border-2 border-slate-400 bg-white p-4 text-lg text-slate-950 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    type="tel"
                    id="phoneNumber"
                    name="phoneNumber"
                    autoComplete="off"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                />

                <label className="text-base font-bold text-slate-900" htmlFor="checkInDate">Check In Date:</label>
                <input className="min-h-14 rounded-lg border-2 border-slate-400 bg-white p-4 text-lg text-slate-950 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    type="date"
                    id="checkInDate"
                    name="checkInDate"
                    autoComplete="off"
                    value={formData.checkInDate}
                    onChange={(e) => setFormData({ ...formData, checkInDate: e.target.value })}
                />
                <label className="text-base font-bold text-slate-900" htmlFor="checkOutDate">Check Out Date:</label>
                <input className="min-h-14 rounded-lg border-2 border-slate-400 bg-white p-4 text-lg text-slate-950 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    type="date"
                    id="checkOutDate"
                    name="checkOutDate"
                    autoComplete="off"
                    value={formData.checkOutDate}
                    onChange={(e) => setFormData({ ...formData, checkOutDate: e.target.value })}
                />

                {

                    formData.rooms.map((room, index) => (
                        <OtaRoomRow key={index} room={room} index={index} defaultCheckIn={formData.checkInDate} defaultCheckOut={formData.checkOutDate} onChange={(updated) => handleRoomChange(index, updated)} onRemove={() => removeRoom(index)} alreadySelectedRoomIds={
                            formData.rooms.filter((_room, idx) =>
                                idx != index
                            )
                                .map((room) =>
                                    room.roomId
                                )
                        } />
                    )
                    )
                }

                <button
                    type="button"
                    className="min-h-12 w-full rounded-lg border-2 border-dashed border-slate-600 bg-white px-5 py-3 text-base font-bold text-slate-900 hover:bg-slate-100 sm:w-auto"
                    onClick={(_e) => addRoom()}
                >
                    + Add Room
                </button>
                <label className="text-base font-bold text-slate-900" htmlFor="otaConfirmed">Confirmation Number:</label>
                <input className="min-h-14 rounded-lg border-2 border-slate-400 bg-white p-4 text-lg text-slate-950 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    type="text"
                    id="otaConfirmed"
                    name="otaConfirmed"
                    value={formData.otaConfirmed}
                    onChange={(e) => setFormData({ ...formData, otaConfirmed: e.target.value })}
                />

                <label className="text-base font-bold text-slate-900" htmlFor="vccReference">VCC Reference:</label>
                <input className="min-h-14 rounded-lg border-2 border-slate-400 bg-white p-4 text-lg text-slate-950 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    type="text"
                    id="vccReference"
                    name="vccReference"
                    value={formData.vccConfirmed}
                    onChange={(e) => setFormData({ ...formData, vccConfirmed: e.target.value })}
                />

                <label className="text-base font-bold text-slate-900" htmlFor="groupName">Group Name:</label>
                <input className="min-h-14 rounded-lg border-2 border-slate-400 bg-white p-4 text-lg text-slate-950 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    type="text"
                    id="groupName"
                    name="groupName"
                    value={formData.groupName}
                    onChange={(e) => setFormData({ ...formData, groupName: e.target.value })}
                />

                <label className="text-base font-bold text-slate-900" htmlFor='otaSource'>OTA Source:</label>
                <select className="min-h-14 rounded-lg border-2 border-slate-400 bg-white p-4 text-lg text-slate-950 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    id='otaSource'
                    name='otaSource'
                    value={formData.otaSource}
                    onChange={(e) => setFormData({ ...formData, otaSource: e.target.value })}
                >
                    <option value='Expedia'>Expedia</option>
                    <option value='BookingDotCom'>Booking.com</option>
                </select>

                <div className="space-y-1 rounded-lg bg-white p-5 text-base font-semibold text-slate-900 shadow-sm">
                    <p>Room Subtotal: {subTotal.toFixed(2)}</p>
                    <p>Room Taxes: {taxes.toFixed(2)}</p>
                    <p>Room Total: {totalDue.toFixed(2)}</p>
                </div>

                <button className="min-h-14 w-full rounded-lg bg-blue-700 px-6 py-4 text-lg font-black text-white hover:bg-blue-800"
                    type="submit"
                    onClick={(e) => submitBooking(e)}
                >Confirm Booking</button>
            </div>
        </form>
    )
}
export function OtaRoomRow({
    room, defaultCheckIn, defaultCheckOut, alreadySelectedRoomIds, onChange, onRemove
}: OtaRoomRowProps) {
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

    const availableRooms = openRooms.filter(r => !alreadySelectedRoomIds.includes(r.id) || r.id === room.roomId)

    const groupedRooms = groupBy(availableRooms, (r) => r.RoomType)
    return (
        <div className="flex flex-col justify-between gap-5 rounded-xl bg-white p-4 shadow-sm md:flex-row md:items-center sm:p-5">
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
                                {rooms?.map((r) => (
                                    <option key={r.id} value={r.id}>
                                        {r.RoomNumber}
                                    </option>
                                ))}
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
                        onChange={(e) => onChange(e.target.value === "" ? { ...room, numberOfGuests: "" as any } : { ...room, numberOfGuests: Number(e.target.value) })}
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
                    <label className="text-sm font-bold text-slate-800" htmlFor="roomTotalAmount">Total Amount</label>
                    <input className="min-h-12 rounded-lg border-2 border-slate-400 bg-white p-3 text-lg text-slate-950 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        type="number"
                        id="roomTotalAmount"
                        name="roomTotalAmount"
                        value={room.roomTotalAmount}
                        onChange={(e) => onChange(e.target.value === "" ? { ...room, roomTotalAmount: "" as any } : { ...room, roomTotalAmount: Number(e.target.value) })}
                        onBlur={(e) => {
                            if (e.target.value === "") {
                                onChange({ ...room, roomTotalAmount: 0 })
                            }
                        }}
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-slate-800" htmlFor="roomTaxAmount">Tax Amount</label>
                    <input className="min-h-12 rounded-lg border-2 border-slate-400 bg-white p-3 text-lg text-slate-950 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        type="number"
                        id="roomTaxAmount"
                        name="roomTaxAmount"
                        value={room.roomTaxAmount}
                        onChange={(e) => onChange(e.target.value === "" ? { ...room, roomTaxAmount: "" as any } : { ...room, roomTaxAmount: Number(e.target.value) })}
                        onBlur={(e) => {
                            if (e.target.value === "") {
                                onChange({ ...room, roomTaxAmount: 0 })
                            }
                        }}
                    />
                </div>
            </div>

            <div className="flex min-w-[170px] flex-col items-start gap-2 border-t-2 border-slate-200 pt-4 md:items-end md:border-t-0 md:border-l-2 md:pt-0 md:pl-5">
                <div className="text-left text-base font-medium text-slate-800 md:text-right">
                    <p>Subtotal: ${(Number(room.roomTotalAmount || 0) - Number(room.roomTaxAmount || 0)).toFixed(2)}</p>
                    <p>Taxes: ${Number(room.roomTaxAmount || 0).toFixed(2)}</p>
                </div>
                <p className="text-xl font-black text-slate-950">Total: ${Number(room.roomTotalAmount || 0).toFixed(2)}</p>
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
