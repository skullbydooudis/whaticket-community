import GetDefaultWhatsApp from "../../helpers/GetDefaultWhatsApp";
import { getWbot } from "../../libs/wbot";
import Contact from "../../models/Contact";
import Message from "../../models/Message";

interface Request {
  contactId: number;
  body: string;
  templateVars?: Record<string, string>;
}

const SendAutomatedMessage = async ({
  contactId,
  body,
  templateVars = {}
}: Request): Promise<Message> => {
  const contact = await Contact.findByPk(contactId);

  if (!contact) {
    throw new Error("Contact not found");
  }

  const defaultWhatsapp = await GetDefaultWhatsApp();
  const wbot = getWbot(defaultWhatsapp.id);

  let finalBody = body;
  Object.entries(templateVars).forEach(([key, value]) => {
    finalBody = finalBody.replace(new RegExp(`{{${key}}}`, "g"), value);
  });

  const number = `${contact.number}@${contact.isGroup ? "g.us" : "s.whatsapp.net"}`;

  const sentMessage = await wbot.sendMessage(number, {
    text: finalBody
  });

  const message = await Message.create({
    id: sentMessage.key.id,
    ticketId: null,
    contactId: contact.id,
    body: finalBody,
    fromMe: true,
    read: true,
    mediaType: "chat",
    quotedMsgId: null,
    ack: 1,
    dataJson: JSON.stringify(sentMessage)
  });

  return message;
};

export default SendAutomatedMessage;
