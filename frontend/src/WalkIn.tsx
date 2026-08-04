import { useState } from "react";
import React from "react";
import { toast } from 'react-hot-toast'
import type { PhoneBookedRoom, Pricing } from './PhoneBooking';
import { RoomRow } from "./RoomRow";
import { lanApiUrl, staffFetch } from "./apiConfig";
type paymentmethod = 'Cash' | 'PhysicalCreditCard'
interface WalkInFormData {
    checkInDate: string,
    checkOutDate: string,
    paymentMethod: paymentmethod,
    rooms: PhoneBookedRoom[]
}

interface WalkInProps {
    setActivePage: (page: string) => void;
}
export function WalkIn({ setActivePage }: WalkInProps) {
    const [formData, setFormData] = useState<WalkInFormData>({
        checkInDate: '',
        checkOutDate: '',
        paymentMethod: 'PhysicalCreditCard',
        rooms: [
            {
                roomId: 0,
                numberOfGuests: 1,
                petCount: 0,
                additionalFees: 0,
                discountAmount: 0,
            }
        ]
    })

    function addRoom() {
        setFormData({
            ...formData, rooms: [
                ...formData.rooms,
                {
                    roomId: 0,
                    numberOfGuests: 1,
                    petCount: 0,
                    additionalFees: 0,
                    discountAmount: 0
                }

            ]
        })

        setRoomPrices([...roomPrices, null])
    }

    function removeRoom(indexToRemove: number) {
        if (formData.rooms.length <= 1) return;
        setFormData({
            ...formData,
            rooms:
                formData.rooms.filter((_room, index) => index != indexToRemove)
        })

        setRoomPrices(
            roomPrices.filter((_price, index) => index != indexToRemove)
        )
    }

    function handleRoomChange(indexToUpdate: number, updatedRoom: PhoneBookedRoom) {
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

    function handleRoomPriceChange(indexToUpdate: number, pricing: Pricing | null) {
        setRoomPrices(roomPrices.map((price, index) => {
            if (index === indexToUpdate) {
                return pricing
            } else {
                return price
            }
        })
        )
    }
    const [roomPrices, setRoomPrices] = useState<(Pricing | null)[]>([null])

    async function submitBooking(e: React.MouseEvent<HTMLButtonElement>) {
        e.preventDefault()
        try {
            const response = await staffFetch(`${lanApiUrl()}/api/reservations/walkin`,
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
        } catch (error) {
            toast.error(`${error}`)
        }
    }

    const subtotal = roomPrices.reduce((sum, price) => sum + (price?.roomSubTotal || 0), 0)
    const taxes = roomPrices.reduce((sum, price) => sum + (price?.roomTaxAmount || 0), 0)
    const additionalFees = roomPrices.reduce((sum, price) => sum + (price?.additionalFees || 0), 0)
    const totalDue = roomPrices.reduce((sum, price) => sum + (price?.roomTotalAmount || 0), 0)


    return (
        <form className="mx-auto max-w-4xl">
            <div className="flex flex-col gap-4">
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
                        <RoomRow key={index} room={room} index={index} defaultCheckIn={formData.checkInDate} defaultCheckOut={formData.checkOutDate} onChange={(updated) => handleRoomChange(index, updated)} onPriceChange={(updatedPrice) => handleRoomPriceChange(index, updatedPrice)} onRemove={() => removeRoom(index)} alreadySelectedRoomIds={
                            formData.rooms.filter((_room, idx) =>
                                idx != index
                            )
                                .map((r) =>
                                    r.roomId
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

                {roomPrices && (
                    <div className="space-y-1 rounded-lg bg-white p-5 text-base font-semibold text-slate-900 shadow-sm">
                        <p>Subtotal: ${subtotal.toFixed(2)}</p>
                        <p>Taxes: ${taxes.toFixed(2)}</p>
                        <p>Additional Fees: ${additionalFees.toFixed(2)}</p>
                        <p>Total Due: ${totalDue.toFixed(2)}</p>
                    </div>
                )}
                <label className="text-base font-bold text-slate-900" htmlFor="paymentMethod">Payment Method</label>
                <select className="min-h-14 rounded-lg border-2 border-slate-400 bg-white p-4 text-lg text-slate-950 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    onChange={(e) => setFormData({ ...formData, paymentMethod: (e.target.value as paymentmethod) })}>
                    <option
                        value={'Cash'}
                    >
                        Cash
                    </option>
                    <option
                        value={'PhysicalCreditCard'}
                    >
                        Card
                    </option>
                </select>
                <button className="min-h-14 w-full rounded-lg bg-blue-700 px-6 py-4 text-lg font-black text-white hover:bg-blue-800"
                    type="submit"
                    onClick={(e) => submitBooking(e)}
                >Confirm Booking</button>
            </div>


        </ form>
    )
}