import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Initialize Supabase Admin for updates
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);


export async function POST(req: NextRequest) {
    let razorpay_payment_id = '';

    try {
        const { razorpay_payment_id: paymentId, razorpay_order_id, razorpay_signature, plan } = await req.json();
        razorpay_payment_id = paymentId; // Store for refund if needed

        // 1. Verify Signature
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', '6njwAIIYZ5xw1HBm5l9Zu75D') // Razorpay Live Secret
            .update(body.toString())
            .digest('hex');

        const isAuthentic = expectedSignature === razorpay_signature;

        if (!isAuthentic) {
            return NextResponse.json({ error: "Invalid Signature" }, { status: 400 });
        }

        // 2. Fetch order details from Razorpay to get user_id from notes
        // This eliminates the need for cookies entirely!
        const orderResponse = await fetch(`https://api.razorpay.com/v1/orders/${razorpay_order_id}`, {
            headers: {
                'Authorization': `Basic ${Buffer.from(`${process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID}:6njwAIIYZ5xw1HBm5l9Zu75D`).toString('base64')}`
            }
        });

        if (!orderResponse.ok) {
            throw new Error("Failed to fetch order details from Razorpay");
        }

        const orderData = await orderResponse.json();
        const user_id = orderData.notes?.user_id;

        if (!user_id) {
            throw new Error("User ID not found in order notes");
        }

        console.log(`✅ User ID retrieved from order: ${user_id}`);


        // 3. Calculate plan expiry (30 days from now)
        const planExpiry = new Date();
        planExpiry.setDate(planExpiry.getDate() + 30);

        // 4. Update user plan in database
        const { error: updateError } = await supabase
            .from('user_settings')
            .update({
                plan_type: plan,
                is_paid: true,
                plan_expiry: planExpiry.toISOString(),
            })
            .eq('id', user_id);

        if (updateError) {
            console.error("DB Update Error:", updateError);
            throw new Error("Failed to update user plan");
        }

        // 5. Log the payment success
        const { error: paymentError } = await supabase.from('payments').insert({
            user_id: user_id,
            order_id: razorpay_order_id,
            payment_id: razorpay_payment_id,
            amount: plan === 'pro' ? 3000 : 9000,
            status: 'captured',
        });

        if (paymentError) {
            console.error("Payment Log Error:", paymentError);
            // Don't fail the request if logging fails
        }

        console.log(`✅ Payment successful for user ${user_id} - Plan: ${plan}`);

        return NextResponse.json({
            success: true,
            plan: plan,
            expiry: planExpiry.toISOString()
        });

    } catch (error: any) {
        console.error("❌ Payment Verification Error:", error);

        // AUTO-REFUND: If verification failed, initiate refund
        if (razorpay_payment_id) {
            try {
                console.log("🔄 Initiating automatic refund for failed verification...");

                // Trigger refund via Razorpay API
                const refundResponse = await fetch(`https://api.razorpay.com/v1/payments/${razorpay_payment_id}/refund`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Basic ${Buffer.from(`${process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID}:6njwAIIYZ5xw1HBm5l9Zu75D`).toString('base64')}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        speed: 'optimum',
                        notes: {
                            reason: 'Account upgrade failed - automatic refund',
                            error: error.message
                        }
                    })
                });

                if (refundResponse.ok) {
                    const refundData = await refundResponse.json();
                    console.log("✅ Auto-refund successful:", refundData.id);

                    return NextResponse.json({
                        error: "Verification failed. Full refund has been initiated automatically. Money will be returned in 5-7 business days.",
                        refund_id: refundData.id
                    }, { status: 500 });
                } else {
                    console.error("❌ Auto-refund failed:", await refundResponse.text());
                }
            } catch (refundError) {
                console.error("❌ Auto-refund error:", refundError);
            }
        }

        return NextResponse.json({
            error: error.message + ". Please contact support for refund."
        }, { status: 500 });
    }
}
