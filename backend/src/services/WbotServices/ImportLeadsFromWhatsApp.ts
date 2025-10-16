import { WASocket } from "@whiskeysockets/baileys";
import Contact from "../../models/Contact";
import Lead from "../../models/Lead";
import User from "../../models/User";
import Whatsapp from "../../models/Whatsapp";
import LeadUser from "../../models/LeadUser";
import Activity from "../../models/Activity";
import CreateOrUpdateContactService from "../ContactServices/CreateOrUpdateContactService";
import CalculateLeadScoreService from "../LeadServices/CalculateLeadScoreService";

interface ImportedLead {
  contact: Contact;
  lead: Lead;
  isNew: boolean;
}

interface ImportOptions {
  whatsappId: number;
  userId: number;
  maxContacts?: number;
  onlyWithMessages?: boolean;
}

const ImportLeadsFromWhatsApp = async ({
  whatsappId,
  userId,
  maxContacts = 100,
  onlyWithMessages = true
}: ImportOptions): Promise<ImportedLead[]> => {
  const whatsapp = await Whatsapp.findByPk(whatsappId);
  if (!whatsapp) {
    throw new Error("WhatsApp not found");
  }

  const user = await User.findByPk(userId);
  if (!user) {
    throw new Error("User not found");
  }

  const wbot = global.wbot[whatsappId];
  if (!wbot) {
    throw new Error("WhatsApp session not active");
  }

  const results: ImportedLead[] = [];

  try {
    const chats = await wbot.store.chats.all();
    const contactsToImport = chats
      .filter(chat => {
        if (chat.id.includes("@g.us")) return false;
        if (onlyWithMessages && (!chat.conversationTimestamp || chat.conversationTimestamp === 0)) {
          return false;
        }
        return true;
      })
      .slice(0, maxContacts);

    for (const chat of contactsToImport) {
      try {
        const contactNumber = chat.id.replace("@s.whatsapp.net", "");

        let contactName = chat.name || chat.notify || contactNumber;
        if (chat.id in wbot.store.contacts) {
          const waContact = wbot.store.contacts[chat.id];
          contactName = waContact.name || waContact.notify || contactName;
        }

        const contact = await CreateOrUpdateContactService({
          number: contactNumber,
          name: contactName,
          email: "",
          profilePicUrl: ""
        });

        const existingLead = await Lead.findOne({
          where: { contactId: contact.id }
        });

        let lead: Lead;
        let isNew = false;

        if (existingLead) {
          lead = existingLead;

          const isUserAlreadyAssigned = await LeadUser.findOne({
            where: {
              leadId: lead.id,
              userId: userId
            }
          });

          if (!isUserAlreadyAssigned) {
            await LeadUser.create({
              leadId: lead.id,
              userId: userId,
              role: "assigned",
              isPrimary: false,
              canEdit: true,
              receiveNotifications: true
            });

            await Activity.create({
              type: "lead_user_assigned",
              description: `${user.name} importou lead do WhatsApp`,
              entityType: "lead",
              entityId: lead.id,
              userId: userId,
              metadata: {
                source: "whatsapp_import",
                whatsappId: whatsappId
              }
            });
          }
        } else {
          const initialScore = CalculateLeadScoreService({
            phone: contactNumber,
            source: "whatsapp",
            daysAsLead: 0
          });

          lead = await Lead.create({
            name: contactName,
            phone: contactNumber,
            source: "whatsapp",
            status: "new",
            score: initialScore,
            contactId: contact.id
          });

          await LeadUser.create({
            leadId: lead.id,
            userId: userId,
            role: "owner",
            isPrimary: true,
            canEdit: true,
            receiveNotifications: true
          });

          await Activity.create({
            type: "lead_created",
            description: `Lead ${lead.name} importado do WhatsApp`,
            entityType: "lead",
            entityId: lead.id,
            userId: userId,
            metadata: {
              source: "whatsapp_import",
              whatsappId: whatsappId,
              contactNumber: contactNumber
            }
          });

          isNew = true;
        }

        results.push({
          contact,
          lead,
          isNew
        });

      } catch (error) {
        console.error(`Error importing contact from WhatsApp:`, error);
      }
    }

    await Activity.create({
      type: "whatsapp_import_completed",
      description: `Importação do WhatsApp concluída: ${results.length} contatos processados, ${results.filter(r => r.isNew).length} novos leads`,
      entityType: "system",
      entityId: whatsappId,
      userId: userId,
      metadata: {
        totalProcessed: results.length,
        newLeads: results.filter(r => r.isNew).length,
        existingLeads: results.filter(r => !r.isNew).length,
        whatsappId: whatsappId
      }
    });

  } catch (error) {
    console.error("Error during WhatsApp import:", error);
    throw error;
  }

  return results;
};

export default ImportLeadsFromWhatsApp;
