import { format } from 'date-fns';

export async function notifyStaffOnBooking(customerName: string, roomType: string, checkInDate: Date, checkOutDate: Date) {
    const brevoApiKey = process.env.BREVO_API_KEY;
    const staffEmail = process.env.STAFF_NOTIFY_EMAIL;
    const brevoFromEmail = process.env.BREVO_FROM_EMAIL;
    if (!brevoApiKey || !staffEmail || !brevoFromEmail) {
        console.warn('Booking notification credentials are missing. Skipping email send.');
        return;
    }

    try {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-key': brevoApiKey,
            },
            body: JSON.stringify({
                sender: {
                    name: process.env.BREVO_FROM_NAME || 'Booking notifications',
                    email: brevoFromEmail,
                },
                to: [{ email: staffEmail }],
                subject: 'New reservation - Rock City Motel',
                htmlContent: `
                <!doctype html>
                <html lang="en">
                    <body style="margin: 0; padding: 0; background-color: #f1f5f9; color: #0f172a; font-family: Arial, Helvetica, sans-serif;">
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse; background-color: #f1f5f9;">
                            <tr>
                                <td align="center" style="padding: 24px 12px;">
                                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width: 100%; max-width: 560px; border-collapse: collapse; overflow: hidden; border-radius: 12px; background-color: #ffffff;">
                                        <tr>
                                            <td style="padding: 24px; background-color: #172332; color: #ffffff;">
                                                <p style="margin: 0 0 8px; font-size: 16px; font-weight: 700;">Rock City Motel</p>
                                                <h1 style="margin: 0; font-size: 28px; line-height: 1.2;">New online reservation</h1>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 24px;">
                                                <p style="margin: 0 0 20px; font-size: 20px; line-height: 1.4; font-weight: 700;">
                                                    ${customerName}
                                                </p>
                                                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse; font-size: 18px; line-height: 1.5;">
                                                    <tr>
                                                        <td style="padding: 12px 0; border-bottom: 1px solid #cbd5e1; color: #475569;">Room type</td>
                                                        <td align="right" style="padding: 12px 0; border-bottom: 1px solid #cbd5e1; font-weight: 700; color: #0f172a;">${roomType}</td>
                                                    </tr>
                                                    <tr>
                                                        <td style="padding: 12px 0; border-bottom: 1px solid #cbd5e1; color: #475569;">Check-in</td>
                                                        <td align="right" style="padding: 12px 0; border-bottom: 1px solid #cbd5e1; font-weight: 700; color: #0f172a;">${format(checkInDate, 'MMM d')}</td>
                                                    </tr>
                                                    <tr>
                                                        <td style="padding: 12px 0; color: #475569;">Check-out</td>
                                                        <td align="right" style="padding: 12px 0; font-weight: 700; color: #0f172a;">${format(checkOutDate, 'MMM d')}</td>
                                                    </tr>
                                                </table>
                                                <p style="margin: 20px 0 0; padding: 14px 16px; border-radius: 8px; background-color: #dcfce7; color: #14532d; font-size: 18px; line-height: 1.3; font-weight: 700; text-align: center;">
                                                    PAID
                                                </p>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>
                    </body>
                </html>
            `,
            }),
        });
        if (!response.ok) {
            const errorData = await response.text();
            console.error('Failed to send email:', errorData);
        }
    } catch (error) {
        console.error('Error sending email notification:', error);
    }
}
