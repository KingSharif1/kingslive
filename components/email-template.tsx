import * as React from 'react';
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Tailwind,
  Text,
} from "@react-email/components";

interface EmailTemplateProps {
  Name: string;
  Email: string;
  Message: string;
}

export const EmailTemplate: React.FC<Readonly<EmailTemplateProps>> = ({
  Name,
  Email,
  Message,
}) => {
  return (
    <Html>
      <Head />
      <Tailwind>
        <Body className="mx-auto my-auto bg-white font-sans">
          <Container className="mx-auto my-[40px] w-[465px] rounded border border-solid border-[#eaeaea] p-[20px]">
            <Heading className="mx-0 my-[30px] p-0 text-center text-[24px] font-normal text-black">
              You got a message!
            </Heading>
            <Text className="text-[14px] leading-[24px] text-black">
              Hello King,
            </Text>
            <Text className="text-[14px] leading-[24px] text-black">
              You got an email from <strong>{Name}</strong>. Their email is{" "}
              {Email}. The message: <br />
              {Message}
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
  // <div>
  //   <h1>Welcome, {Name}!</h1>
  // </div>
};
