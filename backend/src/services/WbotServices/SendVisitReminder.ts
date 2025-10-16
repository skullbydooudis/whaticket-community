import Visit from "../../models/Visit";
import Contact from "../../models/Contact";
import Property from "../../models/Property";
import SendAutomatedMessage from "./SendAutomatedMessage";
import { Op } from "sequelize";

const SendVisitReminder = async (): Promise<void> => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const dayAfterTomorrow = new Date(tomorrow);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

  const visits = await Visit.findAll({
    where: {
      scheduledDate: {
        [Op.gte]: tomorrow,
        [Op.lt]: dayAfterTomorrow
      },
      status: "scheduled"
    },
    include: [
      { model: Contact, as: "contact" },
      { model: Property, as: "property" }
    ]
  });

  for (const visit of visits) {
    if (visit.contact && visit.property) {
      const scheduledTime = new Date(visit.scheduledDate).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit"
      });

      const message = `Olá ${visit.contact.name}! 👋

Lembrando que amanhã você tem uma visita agendada ao imóvel:

📍 ${visit.property.title}
🏠 ${visit.property.address}, ${visit.property.city}
⏰ Horário: ${scheduledTime}

Estamos à disposição para qualquer dúvida!`;

      try {
        await SendAutomatedMessage({
          contactId: visit.contact.id,
          body: message
        });

        visit.reminderSent = true;
        await visit.save();
      } catch (error) {
        console.error(`Error sending reminder for visit ${visit.id}:`, error);
      }
    }
  }
};

export default SendVisitReminder;
