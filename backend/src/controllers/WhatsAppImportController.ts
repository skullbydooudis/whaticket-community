import { Request, Response } from "express";
import ImportLeadsFromWhatsApp from "../services/WbotServices/ImportLeadsFromWhatsApp";
import Whatsapp from "../models/Whatsapp";

export const importLeads = async (req: Request, res: Response): Promise<Response> => {
  const { whatsappId } = req.params;
  const { maxContacts = 100, onlyWithMessages = true } = req.body;

  const whatsapp = await Whatsapp.findByPk(whatsappId);
  if (!whatsapp) {
    return res.status(404).json({ error: "WhatsApp not found" });
  }

  if (whatsapp.status !== "CONNECTED") {
    return res.status(400).json({ error: "WhatsApp is not connected" });
  }

  try {
    const results = await ImportLeadsFromWhatsApp({
      whatsappId: parseInt(whatsappId),
      userId: parseInt(req.user.id),
      maxContacts,
      onlyWithMessages
    });

    return res.status(200).json({
      message: "Import completed successfully",
      totalProcessed: results.length,
      newLeads: results.filter(r => r.isNew).length,
      existingLeads: results.filter(r => !r.isNew).length,
      leads: results.map(r => ({
        leadId: r.lead.id,
        contactName: r.contact.name,
        isNew: r.isNew
      }))
    });

  } catch (error) {
    console.error("Error importing leads:", error);
    return res.status(500).json({
      error: "Failed to import leads",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
};

export const getImportStatus = async (req: Request, res: Response): Promise<Response> => {
  const { whatsappId } = req.params;

  const whatsapp = await Whatsapp.findByPk(whatsappId);
  if (!whatsapp) {
    return res.status(404).json({ error: "WhatsApp not found" });
  }

  return res.status(200).json({
    whatsappId: whatsapp.id,
    name: whatsapp.name,
    status: whatsapp.status,
    canImport: whatsapp.status === "CONNECTED"
  });
};
