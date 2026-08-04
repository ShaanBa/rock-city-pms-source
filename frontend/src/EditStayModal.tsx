import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { lanApiUrl, staffFetch } from "./apiConfig";
import type { Room } from "./PhoneBooking";
import { groupBy } from "./groupBy";

interface EditStayModalProps {
    roomStayId: string;
    onClose: () => void;
    onSuccess: () => void;
}

export function EditStayModal({ roomStayId, onClose, onSuccess }: EditStayModalProps) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [phone, setPhone] = useState("");
    const [checkInDate, setCheckInDate] = useState("");
    const [checkOutDate, setCheckOutDate] = useState("");
    const [numberOfGuests, setNumberOfGuests] = useState(1);
    const [petCount, setPetCount] = useState(0);
    const [roomSubTotal, setRoomSubTotal] = useState("0.00");
    const [roomTaxAmount, setRoomTaxAmount] = useState("0.00");
    const [roomTotalAmount, setRoomTotalAmount] = useState("0.00");
    const [priorityTier, setPriorityTier] = useState(1);
    const [conditionNotes, setConditionNotes] = useState("");

    const [bookingSource, setBookingSource] = useState("");
    const [paymentStatus, setPaymentStatus] = useState("");
    const [roomNumber, setRoomNumber] = useState<number | null>(null);
    const [roomId, setRoomId] = useState<number | null>(null);
    const [initialRoom, setInitialRoom] = useState<Room | null>(null);
    const [availableRooms, setAvailableRooms] = useState<Room[]>([]);

    useEffect(() => {
        async function loadStayDetails() {
            try {
                const response = await staffFetch(`${lanApiUrl()}/api/roomstays/${roomStayId}/details`);
                if (!response.ok) throw new Error("Failed to load stay details");
                const data = await response.json();

                if (data.guest) {
                    setFirstName(data.guest.firstName || "");
                    setLastName(data.guest.lastName || "");
                    setPhone(data.guest.phone || "");
                }

                if (data.stay) {
                    setCheckInDate(data.stay.checkInDate ? data.stay.checkInDate.substring(0, 10) : "");
                    setCheckOutDate(data.stay.checkOutDate ? data.stay.checkOutDate.substring(0, 10) : "");
                    setNumberOfGuests(data.stay.numberOfGuests || 1);
                    setPetCount(data.stay.petCount || 0);
                    setRoomSubTotal(data.stay.roomSubTotal || "0.00");
                    setRoomTaxAmount(data.stay.roomTaxAmount || "0.00");
                    setRoomTotalAmount(data.stay.roomTotalAmount || "0.00");
                    setRoomId(data.stay.roomId ?? null);
                }

                if (data.room) {
                    setRoomNumber(data.room.roomNumber);
                    setPriorityTier(data.room.priorityTier || 1);
                    setConditionNotes(data.room.conditionNotes || "");
                    setInitialRoom({
                        id: data.room.id,
                        RoomNumber: data.room.roomNumber,
                        RoomType: data.room.roomType,
                        priorityTier: data.room.priorityTier,
                        conditionNotes: data.room.conditionNotes,
                        CleanStatus: data.room.cleanStatus,
                        basePrice: 0,
                        isSmoking: false
                    });
                }

                if (data.reservation) {
                    setBookingSource(data.reservation.bookingSource || "WalkIn");
                    setPaymentStatus(data.reservation.paymentStatus || "Unpaid");
                }
            } catch (error) {
                toast.error(`Error loading stay: ${error}`);
            } finally {
                setLoading(false);
            }
        }

        loadStayDetails();
    }, [roomStayId]);

    useEffect(() => {
        async function fetchAvailableRooms() {
            if (!checkInDate || !checkOutDate) return;
            try {
                const response = await staffFetch(`${lanApiUrl()}/api/rooms/available?checkInDate=${checkInDate}&checkOutDate=${checkOutDate}`);
                if (!response.ok) throw new Error("Failed to load available rooms");
                const data: { availableRooms: Room[] } = await response.json();
                setAvailableRooms(data.availableRooms);
            } catch (error) {
                console.error(error);
            }
        }
        fetchAvailableRooms();
    }, [checkInDate, checkOutDate]);

    const allRoomOptions = [...availableRooms];
    if (initialRoom && !allRoomOptions.some((r) => r.id === initialRoom.id)) {
        allRoomOptions.push(initialRoom);
    }
    allRoomOptions.sort((a, b) => (a.RoomNumber || 0) - (b.RoomNumber || 0));

    useEffect(() => {
        if (!checkInDate || !checkOutDate || availableRooms.length === 0 || !roomId) return;
        const isStillAvailable = availableRooms.some((r) => r.id === roomId) || (initialRoom && initialRoom.id === roomId);
        if (!isStillAvailable) {
            toast.error("Assigned room is unavailable for the selected date range.");
        }
    }, [availableRooms, checkInDate, checkOutDate]);

    const currentSelectedRoom = allRoomOptions.find((r) => r.id === roomId);
    const displayRoomNumber = currentSelectedRoom ? currentSelectedRoom.RoomNumber : roomNumber;

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        try {
            const response = await staffFetch(`${lanApiUrl()}/api/roomstays/${roomStayId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    firstName,
                    lastName,
                    phone,
                    checkInDate,
                    checkOutDate,
                    numberOfGuests: Number(numberOfGuests),
                    petCount: Number(petCount),
                    roomSubTotal,
                    roomTaxAmount,
                    roomTotalAmount,
                    priorityTier: Number(priorityTier),
                    conditionNotes,
                    roomId: roomId !== null ? Number(roomId) : undefined
                })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || "Failed to update stay");
            }

            toast.success("Stay updated successfully!");
            onSuccess();
        } catch (error: any) {
            toast.error(`${error.message || error}`);
        } finally {
            setSaving(false);
        }
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-6"
            onClick={onClose}
        >
            <div
                className="max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-xl bg-white p-5 shadow-2xl sm:p-7"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-3">
                    <div>
                        <h2 className="text-2xl font-black text-slate-950">
                            Edit Stay {displayRoomNumber ? `· Room ${displayRoomNumber}` : ""}
                        </h2>
                        <div className="mt-1 flex items-center gap-2 text-sm font-semibold">
                            <span className="rounded-md bg-slate-200 px-2 py-0.5 text-slate-800">
                                {bookingSource}
                            </span>
                            <span className="rounded-md bg-blue-100 px-2 py-0.5 text-blue-900">
                                {paymentStatus}
                            </span>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 font-bold"
                    >
                        ✕
                    </button>
                </div>

                {loading ? (
                    <div className="py-12 text-center text-lg font-bold text-slate-600">
                        Loading stay details...
                    </div>
                ) : (
                    <form onSubmit={handleSave} className="flex flex-col gap-4">
                        {/* Guest Section */}
                        <div className="rounded-lg bg-slate-50 p-4 border border-slate-200">
                            <h3 className="mb-3 text-sm font-black uppercase tracking-wide text-slate-700">
                                Guest Information
                            </h3>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700">First Name</label>
                                    <input
                                        type="text"
                                        className="mt-1 w-full rounded-md border-2 border-slate-300 p-2 text-base font-semibold focus:border-blue-700 focus:outline-none"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700">Last Name</label>
                                    <input
                                        type="text"
                                        className="mt-1 w-full rounded-md border-2 border-slate-300 p-2 text-base font-semibold focus:border-blue-700 focus:outline-none"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                    />
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-bold text-slate-700">Phone Number</label>
                                    <input
                                        type="text"
                                        className="mt-1 w-full rounded-md border-2 border-slate-300 p-2 text-base font-semibold focus:border-blue-700 focus:outline-none"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Assigned Room Section */}
                        <div className="rounded-lg bg-slate-50 p-4 border border-slate-200">
                            <h3 className="mb-3 text-sm font-black uppercase tracking-wide text-slate-700">
                                Assigned Room
                            </h3>
                            <div>
                                <label className="block text-xs font-bold text-slate-700">Room</label>
                                <select
                                    className="mt-1 w-full rounded-md border-2 border-slate-300 p-2 text-base font-semibold focus:border-blue-700 focus:outline-none"
                                    value={roomId ?? ""}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        const newId = val ? Number(val) : null;
                                        setRoomId(newId);
                                        const selected = allRoomOptions.find((r) => r.id === newId);
                                        if (selected) {
                                            setPriorityTier(selected.PriorityTier ?? selected.priorityTier ?? 1);
                                            setConditionNotes(selected.ConditionNotes ?? selected.conditionNotes ?? "");
                                        }
                                    }}
                                >
                                    <option value="">Unassigned</option>
                                    {Object.entries(groupBy(allRoomOptions, (r) => r.RoomType || "Other")).map(([roomType, rooms]) => (
                                        <optgroup key={roomType} label={roomType}>
                                            {rooms.map((r) => {
                                                const tier = r.PriorityTier ?? r.priorityTier;
                                                const notes = r.ConditionNotes ?? r.conditionNotes;
                                                const priorityText = tier && tier >= 2 ? ` · P${tier}${notes ? ` - ${notes}` : ""}` : "";
                                                return (
                                                    <option key={r.id} value={r.id}>
                                                        Room {r.RoomNumber}{priorityText}
                                                    </option>
                                                );
                                            })}
                                        </optgroup>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Dates & Guests */}
                        <div className="rounded-lg bg-slate-50 p-4 border border-slate-200">
                            <h3 className="mb-3 text-sm font-black uppercase tracking-wide text-slate-700">
                                Dates & Occupancy
                            </h3>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700">Check-In Date</label>
                                    <input
                                        type="date"
                                        className="mt-1 w-full rounded-md border-2 border-slate-300 p-2 text-base font-semibold focus:border-blue-700 focus:outline-none"
                                        value={checkInDate}
                                        onChange={(e) => setCheckInDate(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700">Check-Out Date</label>
                                    <input
                                        type="date"
                                        className="mt-1 w-full rounded-md border-2 border-slate-300 p-2 text-base font-semibold focus:border-blue-700 focus:outline-none"
                                        value={checkOutDate}
                                        onChange={(e) => setCheckOutDate(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700">Guests</label>
                                    <input
                                        type="number"
                                        min={1}
                                        className="mt-1 w-full rounded-md border-2 border-slate-300 p-2 text-base font-semibold focus:border-blue-700 focus:outline-none"
                                        value={numberOfGuests}
                                        onChange={(e) => setNumberOfGuests(Number(e.target.value))}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700">Pets</label>
                                    <input
                                        type="number"
                                        min={0}
                                        className="mt-1 w-full rounded-md border-2 border-slate-300 p-2 text-base font-semibold focus:border-blue-700 focus:outline-none"
                                        value={petCount}
                                        onChange={(e) => setPetCount(Number(e.target.value))}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Folio Override */}
                        <div className="rounded-lg bg-amber-50 p-4 border border-amber-200">
                            <h3 className="mb-1 text-sm font-black uppercase tracking-wide text-amber-950">
                                Folio Overrides
                            </h3>
                            <p className="mb-3 text-xs text-amber-800">
                                Manual price adjustments for storm surge or special rates (no auto-recalc).
                            </p>
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-amber-900">Subtotal ($)</label>
                                    <input
                                        type="text"
                                        className="mt-1 w-full rounded-md border-2 border-amber-300 bg-white p-2 text-base font-bold focus:border-blue-700 focus:outline-none"
                                        value={roomSubTotal}
                                        onChange={(e) => setRoomSubTotal(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-amber-900">Tax ($)</label>
                                    <input
                                        type="text"
                                        className="mt-1 w-full rounded-md border-2 border-amber-300 bg-white p-2 text-base font-bold focus:border-blue-700 focus:outline-none"
                                        value={roomTaxAmount}
                                        onChange={(e) => setRoomTaxAmount(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-amber-900">Total ($)</label>
                                    <input
                                        type="text"
                                        className="mt-1 w-full rounded-md border-2 border-amber-300 bg-white p-2 text-base font-bold focus:border-blue-700 focus:outline-none"
                                        value={roomTotalAmount}
                                        onChange={(e) => setRoomTotalAmount(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Room Priority & Notes */}
                        <div className="rounded-lg bg-slate-50 p-4 border border-slate-200">
                            <h3 className="mb-3 text-sm font-black uppercase tracking-wide text-slate-700">
                                Room Condition & Tier
                            </h3>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700">Priority Tier</label>
                                    <select
                                        className="mt-1 w-full rounded-md border-2 border-slate-300 p-2 text-base font-semibold focus:border-blue-700 focus:outline-none"
                                        value={priorityTier}
                                        onChange={(e) => setPriorityTier(Number(e.target.value))}
                                    >
                                        <option value={1}>Tier 1 (Normal)</option>
                                        <option value={2}>Tier 2 (Minor quirks)</option>
                                        <option value={3}>Tier 3 (Last resort)</option>
                                    </select>
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-bold text-slate-700">Condition Notes</label>
                                    <input
                                        type="text"
                                        maxLength={255}
                                        placeholder="e.g. poor AC, TV remote missing"
                                        className="mt-1 w-full rounded-md border-2 border-slate-300 p-2 text-base font-semibold focus:border-blue-700 focus:outline-none"
                                        value={conditionNotes}
                                        onChange={(e) => setConditionNotes(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Submit Buttons */}
                        <div className="mt-2 flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                            <button
                                type="button"
                                onClick={onClose}
                                className="rounded-lg bg-slate-200 px-5 py-3 text-base font-bold text-slate-800 hover:bg-slate-300"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="rounded-lg bg-blue-700 px-5 py-3 text-base font-bold text-white hover:bg-blue-800 disabled:opacity-50"
                            >
                                {saving ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
