import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Admin (Server-side only)
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

export async function POST(req: Request) {
    try {
        // Razorpay instance with credentials from environment variables
        const razorpay = new Razorpay({
            key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
            key_secret: process.env.RAZORPAY_KEY_SECRET || '',
        });

        const { amount, plan } = await req.json();

        const options = {
            amount: amount, // Received from frontend (3000 or 9000)
            currency: "INR",
            receipt: "receipt_" + Math.random().toString(36).substring(7),
            notes: { plan }, // Store plan in notes for reference
        };

        const order = await razorpay.orders.create(options);

        // Optional: Log intent in DB if needed

        return NextResponse.json(order);
    } catch (error: any) {
        console.error("Razorpay Order Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to create order" },
            { status: 500 }
        );
    }
}
