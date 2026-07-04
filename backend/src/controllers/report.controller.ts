import { Request, Response, NextFunction } from 'express';
import { reportService } from '../services/report.service';
import { ReportFilterDto } from '../types';

// Controller - xử lý HTTP request cho module Báo cáo
export class ReportController {
  getRevenue = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filter: ReportFilterDto = {
        period: (req.query.period as 'day' | 'month' | 'year') || 'month',
        date: req.query.date as string | undefined,
      };
      const data = await reportService.getRevenueReport(filter);
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  };

  getTaxReport = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filter: ReportFilterDto = {
        period: (req.query.period as 'day' | 'month' | 'year') || 'month',
        date: req.query.date as string | undefined,
      };
      const data = await reportService.getTaxReport(filter);
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  };

  exportTaxReport = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filter: ReportFilterDto = {
        period: (req.query.period as 'day' | 'month' | 'year') || 'month',
        date: req.query.date as string | undefined,
      };
      const data = await reportService.exportTaxReport(filter);
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  };
}

export const reportController = new ReportController();
