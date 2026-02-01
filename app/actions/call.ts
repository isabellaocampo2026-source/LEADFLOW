'use server'

import twilio from 'twilio'

export async function initiateCall(leadPhone: string) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const fromNumber = process.env.TWILIO_PHONE_NUMBER
    const myNumber = process.env.MY_PHONE_NUMBER // The user's real phone number

    if (!accountSid || !authToken || !fromNumber || !myNumber) {
        return { success: false, error: "Twilio credentials not configured" }
    }

    const client = twilio(accountSid, authToken)

    try {
        // This creates a call to YOUR phone first.
        // When you answer, it executes the TwiML to dial the lead.
        const call = await client.calls.create({
            url: `${process.env.NEXT_PUBLIC_APP_URL}/api/voice/connect?leadPhone=${encodeURIComponent(leadPhone)}`,
            to: myNumber,
            from: fromNumber,
        })

        return { success: true, callSid: call.sid }
    } catch (error) {
        console.error("Twilio error:", error)
        return { success: false, error: "Failed to initiate call" }
    }
}
