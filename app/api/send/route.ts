import { Email } from "@/components/email";
import { EmailTemplate } from "@/components/email-template";
import { NextApiRequest, NextApiResponse } from "next";
import { NextResponse } from "next/server";
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

console.log("Im in hereeeee");
export default async function handler(req: NextApiRequest){
  const data = req.body
  console.log('body', data)
}

export async function POST(request: NextApiRequest, response: NextApiResponse) {
  console.log("im in hereeere")
  try {
    const body = await request.body();
    console.log("body", body)
    const {name, email, message} = body;
    const { data, error } = await resend.emails.send({
      from: 'Acme <onboarding@resend.dev>',
      to: ['delivered@resend.dev'],
      subject: "Hello world",
      react: EmailTemplate({
        Name: name,
        Email: email,
        Message: message,
      }) as React.ReactElement,
    });

    if (error) {
      console.log("first error")
      return response.json({ error });
    }

    return response.json({ data });
  } catch (error) {

    console.log("second error")
    return response.json({ error });

  }
}



// export async function POST(request: { json: () => any; }) {
//   try {
//     const body = await request.json();
//     console.log("body", body)
//     const {name, email, message} = body;
//     const data = await resend.emails.send({
//         from: 'King <king@kingsharif.live>',
//         to: email,
//         subject: 'Contact Us Submission',
//         html: Email({ name: name,  email: email, message: message}),
//     });

//     if(data.status === 'success'){
//         return NextResponse.json({message: 'Email Successfully Sent!'})
//     }
//     return NextResponse.json(data);
//   } catch (error) {
//     console.log('error', error);
//     return Response.json({ error });
//   }
// }
