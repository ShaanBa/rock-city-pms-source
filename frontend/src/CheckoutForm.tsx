import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { } from '@stripe/stripe-js'
import type React from 'react';
import toast from 'react-hot-toast';

interface CheckoutFormProps {
    setActivePage: (page: string) => void;
}

export function CheckoutForm({ setActivePage }: CheckoutFormProps) {
    const stripe = useStripe();
    const elements = useElements();

    async function handleSubmit(e: React.FormEvent) {
        if (!stripe || !elements) return;
        e.preventDefault()
        const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: window.location.origin
            },
            redirect: 'if_required'
        }
        )
        if (error) {
            toast.error(error.message ?? 'Payment failed')
        } else {
            toast.success('Payment successful!')
            setActivePage('dashboard')
        }
    }
    return (
        <form
            onSubmit={(e) => handleSubmit(e)}
        >
            <PaymentElement />
            <button
                type='submit'
            >
                Pay</button>
        </form>
    )
}