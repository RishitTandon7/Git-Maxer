import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Admin for updates
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
    try {
        const { razorpay_payment_id, razorpay_order_id, razorpay_signature, plan } = await req.json();

        // 1. Verify Signature
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
            .update(body.toString())
            .digest('hex');

        const isAuthentic = expectedSignature === razorpay_signature;

        if (!isAuthentic) {
            return NextResponse.json({ error: "Invalid Signature" }, { status: 400 });
        }

        // 2. Identify and Update User (Mocked for MVP due to auth complexity in simple routes)
        // IMPORTANT: In production, we MUST verify 'who' the user is.
        // For now, we update based on user_id passed or created.
        // Since this is a prototype, we'll assume the frontend will be secured or we just log valid payments.

        // We log the payment success.

        const { error } = await supabase.from('payments').insert({
            order_id: razorpay_order_id,
            payment_id: razorpay_payment_id,
            amount: plan === 'pro' ? 3000 : 9000,
            status: 'captured',
            // user_id: '...' // Missing user context
        });

        if (error) console.error("DB Log Error:", error)

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Payment Verification Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
