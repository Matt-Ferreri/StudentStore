import nodemailer from "nodemailer";

export async function sendMail(input: {
  to: string;
  subject: string;
  text: string;
}): Promise<boolean> {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_APP_PASSWORD;
  if (!user || !pass) {
    return false;
  }

  const transport = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user, pass },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 10_000,
  });

  await transport.sendMail({
    from: `StudentStore <${user}>`,
    to: input.to,
    subject: input.subject,
    text: input.text,
  });

  return true;
}
