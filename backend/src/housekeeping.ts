import { addDays, differenceInCalendarDays } from 'date-fns'

export function isHouseKeepingDue(checkInDate: Date, checkOutDate: Date, today: Date) {
    const anchor = addDays(checkInDate, 1)
    const daysSinceAnchor: number = differenceInCalendarDays(today, anchor)
    if ((daysSinceAnchor >= 0) && (daysSinceAnchor % 2 === 1) && (today < checkOutDate)) {
        return true
    } else {
        return false
    }

}