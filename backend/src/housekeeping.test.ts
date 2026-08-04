import { describe, it, expect } from 'vitest';
import { isHouseKeepingDue } from './housekeeping';

const d = (iso: string) => new Date(iso + 'T00:00:00');

describe('isHouseKeepingDue — Mon check-in, Thu check-out', () => {
    const checkIn = d('2026-06-08');
    const checkOut = d('2026-06-11');

    it('is not due on check-in day', () => {
        expect(isHouseKeepingDue(checkIn, checkOut, d('2026-06-08'))).toBe(false);
    });

    it('is not due on anchor day (first full day after check-in)', () => {
        expect(isHouseKeepingDue(checkIn, checkOut, d('2026-06-09'))).toBe(false);
    });

    it('is due on first service day (Wed)', () => {
        expect(isHouseKeepingDue(checkIn, checkOut, d('2026-06-10'))).toBe(true);
    });

    it('is not due on checkout day', () => {
        expect(isHouseKeepingDue(checkIn, checkOut, d('2026-06-11'))).toBe(false);
    });
});

describe('isHouseKeepingDue — short stays', () => {
    it('is not due on checkout day of a 2-night stay', () => {
        expect(isHouseKeepingDue(d('2026-06-08'), d('2026-06-10'), d('2026-06-10'))).toBe(false);
    });
});

describe('isHouseKeepingDue — alternating service days on longer stay', () => {
    const checkIn = d('2026-06-08'); // Mon
    const checkOut = d('2026-06-15'); // Sun

    it('is due on Wed (first service)', () => {
        expect(isHouseKeepingDue(checkIn, checkOut, d('2026-06-10'))).toBe(true);
    });

    it('is not due on Thu (between service days)', () => {
        expect(isHouseKeepingDue(checkIn, checkOut, d('2026-06-11'))).toBe(false);
    });

    it('is due on Fri (second service)', () => {
        expect(isHouseKeepingDue(checkIn, checkOut, d('2026-06-12'))).toBe(true);
    });
});
