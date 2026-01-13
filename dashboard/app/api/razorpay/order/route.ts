import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
    try {
        // Razorpay instance with credentials from environment variables
        const razorpay = new Razorpay({
            key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
            key_secret: process.env.RAZORPAY_KEY_SECRET || '',
        });

        const { amount, plan, user_id } = await req.json();

        const options = {
            amount: amount, // Received from frontend (3000 or 9000)
            currency: "INR",
            receipt: "receipt_" + Math.random().toString(36).substring(7),
            notes: {
                plan,
                user_id  // Store user_id to bypass cookie issues during verification
            },
        };

        const order = await razorpay.orders.create(options);

        return NextResponse.json(order);
    } catch (error: any) {
        console.error("Razorpay Order Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to create order" },
            { status: 500 }
        );
    }
}
