import BaseWorker, { Job, JobResult } from "./BaseWorker";
import SendNewLeadNotification from "../services/WbotServices/SendNewLeadNotification";
import SendProposalNotification from "../services/WbotServices/SendProposalNotification";
import SendVisitReminder from "../services/WbotServices/SendVisitReminder";
import logger from "../utils/logger";

interface NotificationJobData {
  type: "new_lead" | "proposal" | "visit_reminder" | "visit_confirmation";
  leadId?: number;
  proposalId?: number;
  visitId?: number;
  phone?: string;
  message?: string;
  metadata?: Record<string, any>;
}

class NotificationWorker extends BaseWorker<NotificationJobData> {
  constructor() {
    super({
      name: "notification",
      concurrency: 5,
      pollInterval: 1000,
      maxRetries: 3,
      retryDelay: 5000,
      timeout: 60000
    });
  }

  async process(job: Job<NotificationJobData>): Promise<JobResult> {
    try {
      logger.info(`Processing notification: ${job.data.type}`);

      let result: any;

      switch (job.data.type) {
        case "new_lead":
          if (!job.data.leadId) {
            throw new Error("leadId is required for new_lead notification");
          }
          result = await SendNewLeadNotification({ leadId: job.data.leadId });
          break;

        case "proposal":
          if (!job.data.proposalId) {
            throw new Error("proposalId is required for proposal notification");
          }
          result = await SendProposalNotification({
            proposalId: job.data.proposalId,
            userId: job.data.metadata?.userId
          });
          break;

        case "visit_reminder":
          result = await SendVisitReminder();
          break;

        case "visit_confirmation":
          if (!job.data.visitId) {
            throw new Error("visitId is required for visit_confirmation");
          }
          break;

        default:
          throw new Error(`Unknown notification type: ${job.data.type}`);
      }

      logger.info(`Notification sent successfully: ${job.data.type}`);

      return {
        success: true,
        data: {
          type: job.data.type,
          result,
          sentAt: new Date().toISOString()
        }
      };
    } catch (error) {
      logger.error(`Failed to send notification:`, error);

      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default NotificationWorker;
