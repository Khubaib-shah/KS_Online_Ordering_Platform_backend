// ─── Printer Controller ─────────────────────────────────────────────
import { Request, Response } from 'express';
import { pairDeviceByCode, getPendingDevices } from './printer.socket';

export const printerController = {

  // POST /api/v1/printer/pair
  // Body: { pairingCode: string, branchId: string }
  // The tenantId comes from the auth middleware (x-tenant-id header)
  async pairDevice(req: Request, res: Response) {
    try {
      const { pairingCode, branchId } = req.body;
      const tenantId = (req as any).tenantId;

      if (!pairingCode || !branchId) {
        return res.status(400).json({
          error: 'pairingCode and branchId are required',
        });
      }

      if (!tenantId) {
        return res.status(400).json({
          error: 'Tenant context is required. Make sure you are logged in.',
        });
      }

      const result = await pairDeviceByCode(pairingCode, tenantId, branchId);

      if (!result.success) {
        return res.status(404).json({ error: result.message });
      }

      return res.json({
        data: {
          message: result.message,
          deviceId: result.deviceId,
        },
      });
    } catch (error: any) {
      return res.status(500).json({ error: error?.message || 'Internal server error' });
    }
  },

  // GET /api/v1/printer/pending
  // Returns list of pending (unpaired) devices — useful for debugging
  async listPendingDevices(req: Request, res: Response) {
    try {
      const devices = getPendingDevices();
      return res.json({ data: { devices } });
    } catch (error: any) {
      return res.status(500).json({ error: error?.message || 'Internal server error' });
    }
  },
};
