import Lead from "../../models/Lead";
import Contact from "../../models/Contact";
import SendEmailService from "./SendEmailService";

interface Request {
  leadId: number;
  type: "welcome" | "followup" | "qualification" | "matching";
  matchingProperties?: any[];
}

const SendLeadNotificationEmail = async ({ leadId, type, matchingProperties }: Request): Promise<void> => {
  const lead = await Lead.findByPk(leadId, {
    include: [{ model: Contact, as: "contact" }]
  });

  if (!lead || !lead.contact || !lead.email) {
    console.log("Lead or email not found");
    return;
  }

  const templates = {
    welcome: {
      subject: "Bem-vindo ao MaisCRM",
      html: `
        <h1>Olá ${lead.name}!</h1>
        <p>Seja bem-vindo! Estamos muito felizes em ajudá-lo a encontrar o imóvel perfeito.</p>
        <p>Nossa equipe entrará em contato em breve para entender melhor suas necessidades.</p>
        <p>Atenciosamente,<br/>Equipe MaisCRM</p>
      `
    },
    followup: {
      subject: "Acompanhamento - Encontre seu imóvel ideal",
      html: `
        <h1>Olá ${lead.name}!</h1>
        <p>Estamos entrando em contato para saber se você ainda está buscando um imóvel.</p>
        <p>Temos várias opções que podem interessá-lo. Gostaria de agendar uma conversa?</p>
        <p>Atenciosamente,<br/>Equipe MaisCRM</p>
      `
    },
    qualification: {
      subject: "Seu perfil foi qualificado!",
      html: `
        <h1>Ótimas notícias, ${lead.name}!</h1>
        <p>Analisamos seu perfil e identificamos que você está pronto para encontrar seu imóvel ideal.</p>
        <p>Nossa equipe preparou uma seleção especial de imóveis para você.</p>
        <p>Em breve entraremos em contato com as melhores opções!</p>
        <p>Atenciosamente,<br/>Equipe MaisCRM</p>
      `
    },
    matching: {
      subject: `${matchingProperties?.length || 0} imóveis perfeitos para você!`,
      html: `
        <h1>Olá ${lead.name}!</h1>
        <p>Encontramos ${matchingProperties?.length || 0} imóveis que correspondem perfeitamente ao seu perfil!</p>
        ${matchingProperties?.slice(0, 3).map(p => `
          <div style="border: 1px solid #ddd; padding: 15px; margin: 10px 0;">
            <h3>${p.title}</h3>
            <p><strong>Localização:</strong> ${p.city}</p>
            <p><strong>Preço:</strong> R$ ${p.price?.toLocaleString('pt-BR')}</p>
            <p><strong>Match:</strong> ${p.matchScore}%</p>
          </div>
        `).join('') || ''}
        <p>Entre em contato conosco para agendar visitas!</p>
        <p>Atenciosamente,<br/>Equipe MaisCRM</p>
      `
    }
  };

  const template = templates[type];

  await SendEmailService({
    to: lead.email,
    subject: template.subject,
    html: template.html
  });
};

export default SendLeadNotificationEmail;
