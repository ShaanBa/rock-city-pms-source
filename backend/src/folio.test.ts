import { describe, it, expect } from 'vitest';
import { computeFolioTotals } from './folio';

describe('computeFolioTotals', () => {
    it('sums two stays and two charges (Expedia 29/30 pattern)', () => {
        const result = computeFolioTotals(
            [
                { RoomStayStatus: 'CheckedIn', RoomTotalAmount: '471.92' },
                { RoomStayStatus: 'CheckedIn', RoomTotalAmount: '471.92' },
            ],
            [
                { TransactionType: 'Charge', Amount: '471.92' },
                { TransactionType: 'Charge', Amount: '471.92' },
            ]
        );
        expect(result.folioTotal).toBe(943.84);
        expect(result.paidTotal).toBe(943.84);
        expect(result.balanceDue).toBe(0);
    });

    it('excludes Cancelled stays from folio total', () => {
        const result = computeFolioTotals(
            [
                { RoomStayStatus: 'CheckedIn', RoomTotalAmount: '100.00' },
                { RoomStayStatus: 'Cancelled', RoomTotalAmount: '50.00' },
            ],
            [{ TransactionType: 'Charge', Amount: '100.00' }]
        );
        expect(result.folioTotal).toBe(100);
        expect(result.balanceDue).toBe(0);
    });

    it('ignores Refund rows in paid total (current v1 behavior)', () => {
        const result = computeFolioTotals(
            [{ RoomStayStatus: 'CheckedIn', RoomTotalAmount: '100.00' }],
            [
                { TransactionType: 'Charge', Amount: '100.00' },
                { TransactionType: 'Refund', Amount: '25.00' },
            ]
        );
        expect(result.paidTotal).toBe(100);
        expect(result.balanceDue).toBe(0);
    });
});
