export type DateValidationResult =
    | { isValid: false; error: string }
    | { isValid: true; checkIn: Date; checkOut: Date };

export function validateAndParseDates(checkInStr?: string, checkOutStr?: string): DateValidationResult {
    if (!(checkInStr && checkOutStr)) {
        return {
            isValid: false,
            error: 'Check-in or check-out date is missing!'
        }
    }

    const checkIn = new Date(checkInStr + 'T00:00:00')
    const checkOut = new Date(checkOutStr + 'T00:00:00')

    if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
        return {
            isValid: false,
            error: 'Invalid date format provided!'
        }
    }

    if (checkOut <= checkIn) {
        return {
            isValid: false,
            error: 'Check-out date must be after check-in date!'
        }
    }

    return { isValid: true, checkIn, checkOut }
}
