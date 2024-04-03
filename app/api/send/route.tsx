import { Email } from "@/components/email";
import { NextResponse } from "next/server";
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  try {
    const body = await request.json();
    console.log("body", body)
    const {name, email, message} = body;
    const data = await resend.emails.send({
        from: 'King <king@kingsharif.live>',
        to: email,
        subject: 'Contact Us Submission',
        html: Email({ Name: name,  Email: email, Message: message}),
    });

    if(data.status === 'success'){
        return NextResponse.json({message: 'Email Successfully Sent!'})
    }
    return NextResponse.json(data);
  } catch (error) {
    console.log('error', error);
    return Response.json({ error });
  }
}
