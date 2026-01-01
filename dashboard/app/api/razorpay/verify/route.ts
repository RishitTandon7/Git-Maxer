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
    try {
        const { razorpay_payment_id, razorpay_order_id, razorpay_signature, plan } = await req.json();

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

        // 2. Get authenticated user from cookies
        const cookieStore = await cookies();
        const supabaseClient = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder',
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll();
                    },
                    setAll(cookiesToSet: any[]) {
                        // We don't need to set cookies here
                    },
                },
            }
        );

        const { data: { user }, error: userError } = await supabaseClient.auth.getUser();

        if (userError || !user) {
            console.error("User authentication error:", userError);
            return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
        }


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
            .eq('id', user.id);

        if (updateError) {
            console.error("DB Update Error:", updateError);
            return NextResponse.json({ error: "Failed to update user plan" }, { status: 500 });
        }

        // 5. Log the payment success
        const { error: paymentError } = await supabase.from('payments').insert({
            user_id: user.id,
            order_id: razorpay_order_id,
            payment_id: razorpay_payment_id,
            amount: plan === 'pro' ? 3000 : 9000,
            status: 'captured',
        });

        if (paymentError) {
            console.error("Payment Log Error:", paymentError);
            // Don't fail the request if logging fails
        }

        console.log(`✅ Payment successful for user ${user.id} - Plan: ${plan}`);

        return NextResponse.json({
            success: true,
            plan: plan,
            expiry: planExpiry.toISOString()
        });

    } catch (error: any) {
        console.error("Payment Verification Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
