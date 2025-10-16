import { proto } from "@whiskeysockets/baileys";
import Contact from "../../models/Contact";
import Lead from "../../models/Lead";
import User from "../../models/User";
import Whatsapp from "../../models/Whatsapp";
import LeadUser from "../../models/LeadUser";
import Activity from "../../models/Activity";
import CreateOrUpdateContactService from "../ContactServices/CreateOrUpdateContactService";
import CalculateLeadScoreService from "../LeadServices/CalculateLeadScoreService";
import UpdateLeadScoreService from "../LeadServices/UpdateLeadScoreService";

interface MessageData {
  messageId: string;
  whatsappId: number;
  contactNumber: string;
  contactName: string;
  body: string;
  timestamp: number;
  isGroup: boolean;
}

const ProcessIncomingMessage = async (data: MessageData): Promise<Lead | null> => {
  if (data.isGroup) {
    return null;
  }

  try {
    const whatsapp = await Whatsapp.findByPk(data.whatsappId);
    if (!whatsapp) {
      console.error("WhatsApp not found");
      return null;
    }

    const contact = await CreateOrUpdateContactService({
      number: data.contactNumber,
      name: data.contactName,
      email: "",
      profilePicUrl: ""
    });

    let lead = await Lead.findOne({
      where: { contactId: contact.id },
      include: ["assignedUsers"]
    });

    const assignedUserIds: number[] = [];

    if (lead) {
      await UpdateLeadScoreService({
        leadId: lead.id,
        userId: 1
      });

      await Activity.create({
        type: "contact",
        description: `Nova mensagem recebida: "${data.body.substring(0, 50)}${data.body.length > 50 ? '...' : ''}"`,
        entityType: "lead",
        entityId: lead.id,
        userId: 1,
        metadata: {
          messageId: data.messageId,
          source: "whatsapp",
          whatsappId: data.whatsappId
        }
      });

      if (lead.assignedUsers && lead.assignedUsers.length > 0) {
        assignedUserIds.push(...lead.assignedUsers.map((u: any) => u.id));
      }
    } else {
      const keywords = [
        "comprar", "alugar", "imóvel", "imovel", "apartamento", "casa",
        "terreno", "cobertura", "interesse", "informação", "informacao",
        "visita", "visitar", "preço", "preco", "valor", "disponível", "disponivel"
      ];

      const messageBodyLower = data.body.toLowerCase();
      const isRealEstateLead = keywords.some(keyword => messageBodyLower.includes(keyword));

      if (!isRealEstateLead && data.body.length < 10) {
        return null;
      }

      const initialScore = CalculateLeadScoreService({
        phone: data.contactNumber,
        source: "whatsapp",
        daysAsLead: 0
      });

      lead = await Lead.create({
        name: data.contactName,
        phone: data.contactNumber,
        source: "whatsapp",
        status: "new",
        score: initialScore,
        contactId: contact.id,
        notes: `Primeiro contato: ${data.body}`
      });

      const usersWithWhatsapp = await User.findAll({
        where: { whatsappId: data.whatsappId }
      });

      if (usersWithWhatsapp.length > 0) {
        for (const user of usersWithWhatsapp) {
          await LeadUser.create({
            leadId: lead.id,
            userId: user.id,
            role: "assigned",
            isPrimary: usersWithWhatsapp[0].id === user.id,
            canEdit: true,
            receiveNotifications: true
          });
          assignedUserIds.push(user.id);
        }
      } else {
        const defaultUser = await User.findOne({
          where: { profile: "director" }
        });

        if (defaultUser) {
          await LeadUser.create({
            leadId: lead.id,
            userId: defaultUser.id,
            role: "owner",
            isPrimary: true,
            canEdit: true,
            receiveNotifications: true
          });
          assignedUserIds.push(defaultUser.id);
        }
      }

      await Activity.create({
        type: "lead_created",
        description: `Lead criado automaticamente via WhatsApp`,
        entityType: "lead",
        entityId: lead.id,
        userId: assignedUserIds[0] || 1,
        metadata: {
          source: "whatsapp_auto",
          whatsappId: data.whatsappId,
          firstMessage: data.body,
          assignedUsers: assignedUserIds
        }
      });
    }

    return lead;

  } catch (error) {
    console.error("Error processing incoming message:", error);
    return null;
  }
};

export default ProcessIncomingMessage;
