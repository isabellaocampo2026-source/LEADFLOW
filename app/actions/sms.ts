'use server'

import twilio from 'twilio'

export interface SMSResult {
    success: boolean
    messageId?: string
    error?: string
}

export async function sendSMS(to: string, message: string): Promise<SMSResult> {
    try {
        const accountSid = process.env.TWILIO_ACCOUNT_SID
        const authToken = process.env.TWILIO_AUTH_TOKEN
        const fromNumber = process.env.TWILIO_PHONE_NUMBER

        if (!accountSid || !authToken || !fromNumber) {
            console.error('Twilio credentials missing')
            return { success: false, error: 'Twilio not configured' }
        }

        const client = twilio(accountSid, authToken)

        console.log(`📨 Sending SMS to ${to}: ${message.substring(0, 50)}...`)

        const response = await client.messages.create({
            body: message,
            from: fromNumber,
            to: to
        })

        console.log('✅ SMS Sent:', response.sid)

        return {
            success: true,
            messageId: response.sid
        }
    } catch (error: any) {
        console.error('❌ SMS Failed:', error)
        return {
            success: false,
            error: error.message || 'Failed to send SMS'
        }
    }
}
