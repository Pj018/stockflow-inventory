import { Request, Response, NextFunction } from 'express';
import { SettingsService } from '../services/settingsService';
import { updateSettingsSchema } from '../validators/settingsValidator';

export class SettingsController {
  static async getSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = req.organizationId!;
      const settings = await SettingsService.getSettings(organizationId);
      return res.status(200).json({
        success: true,
        data: settings,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = req.organizationId!;
      const validated = updateSettingsSchema.parse(req.body);
      const updated = await SettingsService.updateSettings(organizationId, validated);
      return res.status(200).json({
        success: true,
        message: 'Settings updated successfully',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }
}
