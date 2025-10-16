import AppError from "../../errors/AppError";
import Visit from "../../models/Visit";
import Property from "../../models/Property";
import Contact from "../../models/Contact";

interface Request {
  propertyId: string;
  contactId: number;
  userId: number;
  scheduledDate: Date;
  notes?: string;
}

const CreateVisitService = async ({
  propertyId,
  contactId,
  userId,
  scheduledDate,
  notes
}: Request): Promise<Visit> => {
  const property = await Property.findByPk(propertyId);
  if (!property) {
    throw new AppError("ERR_NO_PROPERTY_FOUND", 404);
  }

  const contact = await Contact.findByPk(contactId);
  if (!contact) {
    throw new AppError("ERR_NO_CONTACT_FOUND", 404);
  }

  const visit = await Visit.create({
    propertyId,
    contactId,
    userId,
    scheduledDate,
    notes,
    status: "scheduled"
  });

  await visit.reload({
    include: [
      { model: Property, as: "property" },
      { model: Contact, as: "contact" }
    ]
  });

  return visit;
};

export default CreateVisitService;
