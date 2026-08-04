import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { lanApiUrl, staffFetch } from "./apiConfig";
import { EditStayModal } from "./EditStayModal";

export interface ReservationStay {
    stayId: string;
    reservationId: string;
    guestName: string;
    guestPhone: string;
    roomNumber: number | null;
    checkIn: string;
    checkOut: string;
    bookingSource: string;
    paymentStatus: string;
    roomStayStatus: string;
    roomTotalAmount: string;
}

export function Reservations() {
    const today = new Date();
    const defaultFrom = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const defaultTo = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const [from, setFrom] = useState(defaultFrom);
    const [to, setTo] = useState(defaultTo);
    const [source, setSource] = useState("");
    const [status, setStatus] = useState("");
    const [room, setRoom] = useState("");
    const [q, setQ] = useState("");
    const [showCancelled, setShowCancelled] = useState(false);

    const [stays, setStays] = useState<ReservationStay[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);

    const [selectedStayId, setSelectedStayId] = useState<string | null>(null);
    const [cancelStayTarget, setCancelStayTarget] = useState<ReservationStay | null>(null);
    const [cancelling, setCancelling] = useState(false);

    async function fetchReservations() {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (from) params.set("from", from);
            if (to) params.set("to", to);
            if (source) params.set("source", source);
            if (status) params.set("status", status);
            if (room) params.set("room", room);
            if (q) params.set("q", q);
            if (showCancelled) params.set("showCancelled", "true");
            params.set("limit", "50");

            const res = await staffFetch(`${lanApiUrl()}/api/reservations?${params.toString()}`);
            if (!res.ok) throw new Error("Failed to fetch reservations");
            const data = await res.json();
            setStays(data.stays || []);
            setTotal(data.total || 0);
        } catch (error) {
            toast.error(`Error loading reservations: ${error}`);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchReservations();
    }, [from, to, source, status, room, q, showCancelled]);

    async function handleConfirmCancel() {
        if (!cancelStayTarget) return;
        setCancelling(true);
        try {
            const res = await staffFetch(`${lanApiUrl()}/api/roomstays/${cancelStayTarget.stayId}/cancel`, {
                method: "PUT",
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || "Failed to cancel stay");
            }
            toast.success("Stay cancelled successfully!");
            setCancelStayTarget(null);
            fetchReservations();
        } catch (error: any) {
            toast.error(`${error.message || error}`);
        } finally {
            setCancelling(false);
        }
    }

    const formatDate = (isoStr: string) => {
        if (!isoStr) return "";
        const dateStr = isoStr.slice(0, 10);
        const [year, month, day] = dateStr.split('-');
        if (!year || !month || !day) return isoStr;
        const dateObj = new Date(Number(year), Number(month) - 1, Number(day));
        return dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    };

    const getStatusBadge = (statusStr: string) => {
        switch (statusStr) {
            case 'Confirmed':
                return 'bg-blue-100 text-blue-900 border-blue-300';
            case 'CheckedIn':
                return 'bg-emerald-100 text-emerald-900 border-emerald-300';
            case 'CheckedOut':
                return 'bg-slate-200 text-slate-800 border-slate-300';
            case 'Cancelled':
                return 'bg-rose-100 text-rose-900 border-rose-300';
            default:
                return 'bg-slate-100 text-slate-800 border-slate-200';
        }
    };

    return (
        <div className="mx-auto max-w-7xl p-1 sm:p-4">
            {/* Header */}
            <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-950">Reservations Registry</h1>
                    <p className="text-sm font-semibold text-slate-600">
                        Browse, filter, edit, and cancel past, present, and upcoming stays.
                    </p>
                </div>
                <div className="text-right font-bold text-slate-700">
                    Total Found: <span className="text-slate-950">{total}</span>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="mb-6 rounded-xl border border-slate-300 bg-white p-4 shadow-sm">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-700">From Date</label>
                        <input
                            type="date"
                            value={from}
                            onChange={(e) => setFrom(e.target.value)}
                            className="mt-1 w-full rounded-lg border-2 border-slate-300 bg-white p-2.5 text-base font-semibold text-slate-950 focus:border-blue-700 focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-700">To Date</label>
                        <input
                            type="date"
                            value={to}
                            onChange={(e) => setTo(e.target.value)}
                            className="mt-1 w-full rounded-lg border-2 border-slate-300 bg-white p-2.5 text-base font-semibold text-slate-950 focus:border-blue-700 focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-700">Booking Source</label>
                        <select
                            value={source}
                            onChange={(e) => setSource(e.target.value)}
                            className="mt-1 w-full rounded-lg border-2 border-slate-300 bg-white p-2.5 text-base font-semibold text-slate-950 focus:border-blue-700 focus:outline-none"
                        >
                            <option value="">All Sources</option>
                            <option value="WalkIn">WalkIn</option>
                            <option value="Phone">Phone</option>
                            <option value="DirectWeb">DirectWeb</option>
                            <option value="Expedia">Expedia</option>
                            <option value="BookingDotCom">BookingDotCom</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-700">Stay Status</label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="mt-1 w-full rounded-lg border-2 border-slate-300 bg-white p-2.5 text-base font-semibold text-slate-950 focus:border-blue-700 focus:outline-none"
                        >
                            <option value="">All Active Statuses</option>
                            <option value="Confirmed">Confirmed</option>
                            <option value="CheckedIn">CheckedIn</option>
                            <option value="CheckedOut">CheckedOut</option>
                            <option value="Cancelled">Cancelled</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-700">Room #</label>
                        <input
                            type="number"
                            placeholder="e.g. 14"
                            value={room}
                            onChange={(e) => setRoom(e.target.value)}
                            className="mt-1 w-full rounded-lg border-2 border-slate-300 bg-white p-2.5 text-base font-semibold text-slate-950 focus:border-blue-700 focus:outline-none"
                        />
                    </div>
                    <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-700">Guest Search (Name / Phone)</label>
                        <input
                            type="text"
                            placeholder="e.g. Jane or 555-0123"
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            className="mt-1 w-full rounded-lg border-2 border-slate-300 bg-white p-2.5 text-base font-semibold text-slate-950 focus:border-blue-700 focus:outline-none"
                        />
                    </div>
                    <div className="flex items-end pb-2">
                        <label className="flex items-center gap-2 font-bold text-slate-800 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={showCancelled}
                                onChange={(e) => setShowCancelled(e.target.checked)}
                                className="h-5 w-5 rounded border-slate-300 text-blue-700 focus:ring-blue-700"
                            />
                            Show Cancelled
                        </label>
                    </div>
                </div>
            </div>

            {/* List / Cards */}
            {loading ? (
                <div className="py-12 text-center text-lg font-bold text-slate-600">
                    Loading reservations...
                </div>
            ) : stays.length === 0 ? (
                <div className="rounded-xl bg-white p-8 text-center text-slate-600 shadow-sm border border-slate-200">
                    <p className="text-lg font-bold">No reservations found matching current filters.</p>
                    <p className="mt-1 text-sm">Try broadening your date range or clearing filters.</p>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {stays.map((stay) => {
                        const isCancelDisabled = stay.roomStayStatus === 'CheckedOut' || stay.roomStayStatus === 'Cancelled';
                        return (
                            <div
                                key={stay.stayId}
                                className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md sm:flex-row sm:items-center"
                            >
                                <div className="flex flex-col gap-2">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <span className="text-2xl font-black text-slate-950">
                                            {stay.roomNumber ? `Room ${stay.roomNumber}` : 'Unassigned'}
                                        </span>
                                        <span className={`rounded-md border px-2.5 py-0.5 text-xs font-bold ${getStatusBadge(stay.roomStayStatus)}`}>
                                            {stay.roomStayStatus}
                                        </span>
                                        <span className="rounded-md bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-800 border border-slate-300">
                                            {stay.bookingSource}
                                        </span>
                                        <span className={`rounded-md px-2.5 py-0.5 text-xs font-bold ${stay.paymentStatus === 'Paid' ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100 text-amber-900'}`}>
                                            {stay.paymentStatus}
                                        </span>
                                    </div>

                                    <div className="text-base font-bold text-slate-900">
                                        {stay.guestName} {stay.guestPhone ? `· ${stay.guestPhone}` : ''}
                                    </div>

                                    <div className="text-sm font-semibold text-slate-600">
                                        {formatDate(stay.checkIn)} → {formatDate(stay.checkOut)}
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
                                    <div className="mr-2 text-right">
                                        <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Total</div>
                                        <div className="text-xl font-black text-slate-950">${stay.roomTotalAmount}</div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => setSelectedStayId(stay.stayId)}
                                        className="min-h-12 rounded-lg bg-blue-700 px-5 py-2.5 text-base font-bold text-white hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-300"
                                    >
                                        View / Edit
                                    </button>

                                    <button
                                        type="button"
                                        disabled={isCancelDisabled}
                                        onClick={() => setCancelStayTarget(stay)}
                                        className="min-h-12 rounded-lg border-2 border-rose-300 bg-rose-50 px-4 py-2.5 text-base font-bold text-rose-800 hover:bg-rose-100 hover:text-rose-900 focus:outline-none disabled:opacity-40 disabled:hover:bg-rose-50 disabled:cursor-not-allowed"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Edit Modal */}
            {selectedStayId && (
                <EditStayModal
                    roomStayId={selectedStayId}
                    onClose={() => setSelectedStayId(null)}
                    onSuccess={() => {
                        setSelectedStayId(null);
                        fetchReservations();
                    }}
                />
            )}

            {/* Cancel Confirmation Modal */}
            {cancelStayTarget && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
                    onClick={() => setCancelStayTarget(null)}
                >
                    <div
                        className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-2xl font-black text-slate-950">Cancel Stay?</h2>
                        <p className="mt-2 text-base font-medium text-slate-700">
                            Are you sure you want to soft-cancel the stay for <span className="font-bold text-slate-950">{cancelStayTarget.guestName}</span> ({cancelStayTarget.roomNumber ? `Room ${cancelStayTarget.roomNumber}` : 'Unassigned'})?
                        </p>
                        {cancelStayTarget.roomStayStatus === 'CheckedIn' && (
                            <div className="mt-3 rounded-lg bg-amber-50 p-3 border border-amber-200 text-xs font-bold text-amber-950">
                                ⚠️ This stay is currently CheckedIn. Soft-cancelling will mark Room {cancelStayTarget.roomNumber} as Dirty on the Dashboard.
                            </div>
                        )}
                        <div className="mt-6 flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setCancelStayTarget(null)}
                                className="rounded-lg bg-slate-200 px-4 py-2.5 text-base font-bold text-slate-800 hover:bg-slate-300"
                            >
                                Keep Stay
                            </button>
                            <button
                                type="button"
                                disabled={cancelling}
                                onClick={handleConfirmCancel}
                                className="rounded-lg bg-rose-700 px-5 py-2.5 text-base font-bold text-white hover:bg-rose-800 disabled:opacity-50"
                            >
                                {cancelling ? "Cancelling..." : "Confirm Soft Cancel"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
