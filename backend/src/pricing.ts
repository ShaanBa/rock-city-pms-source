import { GUEST_TRANSIENT_TAX_RATE, SALES_TAX_RATE } from "./constants";

interface StayPriceReturn {
    roomSubTotal: number,
    additionalFees: number,
    roomTaxAmount: number,
    roomTotalAmount: number
}
export function calculateStayPrice(basePrice: number, nights: number, petCount: number, additionalFees: number, discount: number, numberOfGuests: number, roomType: string): StayPriceReturn {
    let roomSubTotal = 0;
    let extraGuestFees = 0;
    if (roomType === 'Family') {
        roomSubTotal = Number(basePrice) * nights;
        extraGuestFees = Math.max(0, (numberOfGuests - 3) * 5)
    } else {
        roomSubTotal = Number(basePrice) * nights;
        extraGuestFees = Math.max(0, (numberOfGuests - 1) * 5);
    }
    additionalFees += (petCount * 15 * nights) + (extraGuestFees * nights);

    const taxRate = GUEST_TRANSIENT_TAX_RATE + SALES_TAX_RATE;
    const roomTaxAmount = Math.round(roomSubTotal * taxRate * 100) / 100;
    const roomTotalAmount = Math.round((roomSubTotal + additionalFees + roomTaxAmount - discount) * 100) / 100;

    return {
        roomSubTotal, additionalFees, roomTaxAmount, roomTotalAmount
    }
}