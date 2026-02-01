import { NextRequest, NextResponse } from 'next/server'
import VoiceResponse from 'twilio/lib/twiml/VoiceResponse'

export async function POST(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const leadPhone = searchParams.get('leadPhone')

    const response = new VoiceResponse()

    if (!leadPhone) {
        response.say('Sorry, no phone number was provided to call.')
    } else {
        response.say('Connecting you to the lead now. Good luck!')
        response.dial(leadPhone)
    }

    return new NextResponse(response.toString(), {
        headers: {
            'Content-Type': 'text/xml',
        },
    })
}
