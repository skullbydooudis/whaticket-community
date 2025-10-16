import { Request, Response } from "express";
import GetDashboardStatsService from "../services/AnalyticsServices/GetDashboardStatsService";

export const dashboard = async (req: Request, res: Response): Promise<Response> => {
  const stats = await GetDashboardStatsService();

  return res.json(stats);
};
