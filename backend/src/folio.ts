type FolioStayInput = {
    RoomStayStatus: string;
    RoomTotalAmount: string;
};

type FolioPaymentInput = {
    TransactionType: string;
    Amount: string;
};

export function computeFolioTotals(stays: FolioStayInput[], payments: FolioPaymentInput[]) {
    const folioTotal = stays.reduce((acc, stay) => {
        if (stay.RoomStayStatus === 'Cancelled') return acc;
        return acc + (parseFloat(stay.RoomTotalAmount) || 0);
    }, 0);

    const paidTotal = payments.reduce((acc, payment) => {
        if (payment.TransactionType === 'Refund') return acc;
        return acc + (parseFloat(payment.Amount) || 0);
    }, 0);

    return {
        folioTotal,
        paidTotal,
        balanceDue: folioTotal - paidTotal,
    };
}
