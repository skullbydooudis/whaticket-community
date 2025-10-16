interface EmailData {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

const SendEmailService = async (data: EmailData): Promise<void> => {
  console.log("Email would be sent:", {
    to: data.to,
    subject: data.subject,
    from: data.from || process.env.MAIL_FROM
  });
};

export default SendEmailService;
