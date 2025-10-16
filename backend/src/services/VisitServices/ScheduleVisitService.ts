import Visit from "../../models/Visit";
import Property from "../../models/Property";
import Contact from "../../models/Contact";
import User from "../../models/User";
import Activity from "../../models/Activity";
import SendAutomatedMessage from "../WbotServices/SendAutomatedMessage";
import { Op } from "sequelize";

interface Request {
  propertyId: number;
  contactId: number;
  leadId?: number;
  scheduledDate: Date;
  notes?: string;
  userId: number;
}

interface ScheduleResult {
  visit: Visit;
  conflicts: Visit[];
  suggestions: Date[];
}

const ScheduleVisitService = async (data: Request): Promise<ScheduleResult> => {
  const property = await Property.findByPk(data.propertyId);
  if (!property) {
    throw new Error("Property not found");
  }

  const contact = await Contact.findByPk(data.contactId);
  if (!contact) {
    throw new Error("Contact not found");
  }

  const scheduledDate = new Date(data.scheduledDate);
  const hourStart = new Date(scheduledDate);
  hourStart.setMinutes(0, 0, 0);
  const hourEnd = new Date(scheduledDate);
  hourEnd.setMinutes(59, 59, 999);

  const conflicts = await Visit.findAll({
    where: {
      propertyId: data.propertyId,
      scheduledDate: {
        [Op.gte]: hourStart,
        [Op.lte]: hourEnd
      },
      status: {
        [Op.in]: ["scheduled", "in_progress"]
      }
    }
  });

  if (conflicts.length > 0) {
    const suggestions = generateAlternativeTimes(scheduledDate, conflicts);
    return {
      visit: null as any,
      conflicts,
      suggestions
    };
  }

  const visit = await Visit.create({
    propertyId: data.propertyId,
    contactId: data.contactId,
    leadId: data.leadId,
    scheduledDate: data.scheduledDate,
    status: "scheduled",
    notes: data.notes
  });

  await Activity.create({
    type: "visit_scheduled",
    description: `Visita agendada ao imóvel ${property.title}`,
    entityType: "visit",
    entityId: visit.id,
    userId: data.userId,
    metadata: {
      propertyId: data.propertyId,
      contactId: data.contactId,
      scheduledDate: data.scheduledDate
    }
  });

  try {
    const scheduledTime = new Date(data.scheduledDate).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });

    await SendAutomatedMessage({
      contactId: data.contactId,
      body: `Olá ${contact.name}! 👋

Sua visita foi agendada com sucesso!

🏠 *Imóvel:* ${property.title}
📍 *Endereço:* ${property.address}, ${property.city}
📅 *Data e Hora:* ${scheduledTime}

${data.notes ? `📝 *Observações:* ${data.notes}\n` : ""}
Aguardamos você! Em caso de dúvidas, estamos à disposição.`
    });
  } catch (error) {
    console.error("Error sending visit confirmation:", error);
  }

  return {
    visit,
    conflicts: [],
    suggestions: []
  };
};

const generateAlternativeTimes = (requestedDate: Date, conflicts: Visit[]): Date[] => {
  const suggestions: Date[] = [];
  const baseDate = new Date(requestedDate);
  baseDate.setMinutes(0, 0, 0);

  for (let hourOffset = 1; hourOffset <= 4; hourOffset++) {
    const suggestion = new Date(baseDate);
    suggestion.setHours(baseDate.getHours() + hourOffset);

    const hasConflict = conflicts.some(conflict => {
      const conflictDate = new Date(conflict.scheduledDate);
      return Math.abs(suggestion.getTime() - conflictDate.getTime()) < 60 * 60 * 1000;
    });

    if (!hasConflict) {
      suggestions.push(suggestion);
    }

    if (suggestions.length >= 3) break;
  }

  return suggestions;
};

export default ScheduleVisitService;
