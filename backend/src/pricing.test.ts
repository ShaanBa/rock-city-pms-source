import { describe, it, expect } from 'vitest';
import { calculateStayPrice } from './pricing';

const TAX_RATE = 0.085 + 0.05; // SALES_TAX + GUEST_TRANSIENT — same as pricing.ts

describe('standard double room pricing', () => {
    it('should calculate 2 nights at base 100 with 2 guests', () => {
        const { roomSubTotal, additionalFees, roomTaxAmount, roomTotalAmount } = calculateStayPrice(
            100, 2, 0, 0, 0, 2, 'Double'
        );
        // room: 100 × 2 = 200 · extra guests: (2−1) × $5 × 2 nights = 10
        expect(roomSubTotal).toBeCloseTo(200);
        expect(additionalFees).toBeCloseTo(10);
        expect(roomTaxAmount).toBeCloseTo(200 * TAX_RATE);
        expect(roomTotalAmount).toBeCloseTo(200 + 10 + 200 * TAX_RATE);
    });

    it('should calculate 3 nights with 2 pets and 3 guests at base 100', () => {
        const { roomSubTotal, additionalFees, roomTaxAmount, roomTotalAmount } = calculateStayPrice(
            100, 3, 2, 0, 0, 3, 'Double'
        );
        // room: 300 · pets: 2 × 15 × 3 = 90 · extra guests: (3−1) × 5 × 3 = 30
        expect(roomSubTotal).toBeCloseTo(300);
        expect(additionalFees).toBeCloseTo(120);
        expect(roomTaxAmount).toBeCloseTo(300 * TAX_RATE);
        expect(roomTotalAmount).toBeCloseTo(300 + 120 + 300 * TAX_RATE);
    });

    it('Double — 2 guests, 1 night: extra guest fee starts at 2nd person', () => {
        const { roomSubTotal, additionalFees, roomTaxAmount, roomTotalAmount } = calculateStayPrice(
            100, 1, 0, 0, 0, 2, 'Double'
        );
        // room: 100 × 1 = 100 · extra: (2−1) × $5 × 1 night = 5
        expect(roomSubTotal).toBeCloseTo(100);
        expect(additionalFees).toBeCloseTo(5);
        expect(roomTaxAmount).toBeCloseTo(100 * TAX_RATE);
        expect(roomTotalAmount).toBeCloseTo(100 + 5 + 100 * TAX_RATE);
    });
});

describe('Room 17 family room pricing', () => {
    const FAMILY_BASE = 130 / 1.135; // tax-included $130 target for 3 guests

    it('Family — 3 guests, 1 night: $130 total tax included', () => {
        const { roomSubTotal, additionalFees, roomTaxAmount, roomTotalAmount } = calculateStayPrice(
            FAMILY_BASE, 1, 0, 0, 0, 3, 'Family'
        );
        expect(roomSubTotal).toBeCloseTo(FAMILY_BASE);
        expect(additionalFees).toBeCloseTo(0);
        expect(roomTaxAmount).toBeCloseTo(FAMILY_BASE * TAX_RATE);
        expect(roomTotalAmount).toBeCloseTo(130);
    });

    it('Family — 4 guests, 1 night: $135 total tax included', () => {
        const { roomSubTotal, additionalFees, roomTaxAmount, roomTotalAmount } = calculateStayPrice(
            FAMILY_BASE, 1, 0, 0, 0, 4, 'Family'
        );
        expect(roomSubTotal).toBeCloseTo(FAMILY_BASE);
        expect(additionalFees).toBeCloseTo(5);
        expect(roomTaxAmount).toBeCloseTo(FAMILY_BASE * TAX_RATE);
        expect(roomTotalAmount).toBeCloseTo(135);
    });
});
