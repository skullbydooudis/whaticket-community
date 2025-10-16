import ProcessIncomingMessage from "./ProcessIncomingMessage";

interface IncomingMessage {
  messageId: string;
  whatsappId: number;
  from: string;
  body: string;
  timestamp: number;
  name?: string;
}

const HandleIncomingLeadMessage = async (message: IncomingMessage): Promise<void> => {
  try {
    if (!message.from || message.from.includes("@g.us")) {
      return;
    }

    const contactNumber = message.from.replace("@s.whatsapp.net", "").replace("@c.us", "");
    const contactName = message.name || contactNumber;

    await ProcessIncomingMessage({
      messageId: message.messageId,
      whatsappId: message.whatsappId,
      contactNumber,
      contactName,
      body: message.body,
      timestamp: message.timestamp,
      isGroup: message.from.includes("@g.us")
    });

  } catch (error) {
    console.error("Error in HandleIncomingLeadMessage:", error);
  }
};

export default HandleIncomingLeadMessage;
