import BaseWorker, { Job, JobResult } from "./BaseWorker";
import SendEmailService from "../services/NotificationServices/SendEmailService";
import logger from "../utils/logger";

interface EmailJobData {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  template?: string;
  templateData?: Record<string, any>;
  from?: string;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
  attachments?: Array<{
    filename: string;
    content?: string;
    path?: string;
  }>;
}

class EmailWorker extends BaseWorker<EmailJobData> {
  constructor() {
    super({
      name: "email",
      concurrency: 10,
      pollInterval: 2000,
      maxRetries: 3,
      retryDelay: 10000,
      timeout: 30000
    });
  }

  async process(job: Job<EmailJobData>): Promise<JobResult> {
    try {
      logger.info(`Sending email to ${job.data.to}`);

      await SendEmailService({
        to: job.data.to,
        subject: job.data.subject,
        html: job.data.html,
        text: job.data.text,
        from: job.data.from,
        replyTo: job.data.replyTo,
        cc: job.data.cc,
        bcc: job.data.bcc
      });

      logger.info(`Email sent successfully to ${job.data.to}`);

      return {
        success: true,
        data: {
          to: job.data.to,
          subject: job.data.subject,
          sentAt: new Date().toISOString()
        }
      };
    } catch (error) {
      logger.error(`Failed to send email:`, error);

      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default EmailWorker;
