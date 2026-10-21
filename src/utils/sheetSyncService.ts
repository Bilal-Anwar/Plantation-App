import { Pineapple, Nourishment, Worker, Payment, AppSettings, WorkerHisabSummary } from '../types';
import { formatDateTime } from './dateUtils';

export interface SheetSyncPayload {
  businessName: string;
  syncedAt: string;
  timezone: string;
  currency: string;
  summary: {
    totalPineapples: number;
    activePineapples: number;
    completedPineapples: number;
    totalPlantCost: number;
    totalNourishCost: number;
    totalSpent: number;
    totalPaidWorkers: number;
    pendingBalance: number;
  };
  pineapples: Array<{
    id: string;
    name: string;
    plantedBy: string;
    plantedAt: string;
    plantCost: number;
    status: string;
    nourishmentsCompleted: number;
    totalRequired: number;
    completedAt?: string;
  }>;
  nourishments: Array<{
    id: string;
    pineappleId: string;
    slotNumber: number;
    dueAt: string;
    status: string;
    workerName: string;
    doneAt: string;
    cost: number;
  }>;
  workers: Array<{
    id: string;
    name: string;
    phone: string;
    plantingsCount: number;
    nourishmentsCount: number;
    totalEarnings: number;
    totalPaid: number;
    pendingBalance: number;
  }>;
}

/**
 * Builds the standard JSON payload for syncing to Google Sheets / Online Sheet Webhook
 */
export function buildSheetSyncPayload(
  pineapples: Pineapple[],
  nourishments: Nourishment[],
  workers: Worker[],
  workerSummaries: WorkerHisabSummary[],
  settings: AppSettings
): SheetSyncPayload {
  const workerMap = new Map(workers.map(w => [w.id, w.name]));

  const totalPlantCost = pineapples.reduce((sum, p) => sum + p.plantCost, 0);
  const totalNourishCost = nourishments.filter(n => n.status === 'done').reduce((sum, n) => sum + n.cost, 0);
  const totalPaidWorkers = workerSummaries.reduce((sum, w) => sum + w.totalPaid, 0);
  const totalEarnings = workerSummaries.reduce((sum, w) => sum + w.totalEarnings, 0);

  return {
    businessName: settings.businessName,
    syncedAt: new Date().toISOString(),
    timezone: settings.timezone,
    currency: settings.currency,
    summary: {
      totalPineapples: pineapples.length,
      activePineapples: pineapples.filter(p => p.status === 'active').length,
      completedPineapples: pineapples.filter(p => p.status === 'completed').length,
      totalPlantCost,
      totalNourishCost,
      totalSpent: totalPlantCost + totalNourishCost,
      totalPaidWorkers,
      pendingBalance: totalEarnings - totalPaidWorkers,
    },
    pineapples: pineapples.map(p => {
      const pSlots = nourishments.filter(n => n.pineappleId === p.id);
      const completedSlots = pSlots.filter(n => n.status === 'done').length;
      return {
        id: p.id,
        name: p.name,
        plantedBy: workerMap.get(p.plantedByWorkerId) || 'Worker',
        plantedAt: formatDateTime(p.plantedAt, settings.timezone),
        plantCost: p.plantCost,
        status: p.status.toUpperCase(),
        nourishmentsCompleted: completedSlots,
        totalRequired: p.totalNourishmentsRequired,
        completedAt: p.completedAt ? formatDateTime(p.completedAt, settings.timezone) : '-',
      };
    }),
    nourishments: nourishments.map(n => ({
      id: n.id,
      pineappleId: n.pineappleId,
      slotNumber: n.slotNumber,
      dueAt: formatDateTime(n.dueAt, settings.timezone),
      status: n.status.toUpperCase(),
      workerName: n.workerId ? (workerMap.get(n.workerId) || 'Worker') : '-',
      doneAt: n.doneAt ? formatDateTime(n.doneAt, settings.timezone) : '-',
      cost: n.cost,
    })),
    workers: workerSummaries.map(s => ({
      id: s.worker.id,
      name: s.worker.name,
      phone: s.worker.phone || '-',
      plantingsCount: s.plantingsCount,
      nourishmentsCount: s.nourishmentsCount,
      totalEarnings: s.totalEarnings,
      totalPaid: s.totalPaid,
      pendingBalance: s.pendingBalance,
    })),
  };
}

/**
 * Pushes payload to user's Google Sheet Web App / Webhook URL
 */
export async function pushToSheetUrl(url: string, payload: SheetSyncPayload): Promise<boolean> {
  if (!url || !url.trim().startsWith('http')) {
    throw new Error('Valid URL required');
  }

  try {
    // Sending as text/plain avoids CORS preflight error on Google Apps Script Web App endpoints
    await fetch(url.trim(), {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });
    return true;
  } catch (err) {
    console.warn('Sync attempt encountered an error:', err);
    throw err;
  }
}

/**
 * Ready-to-copy Google Apps Script code for the user to paste into their Google Sheet
 */
export const GOOGLE_APPS_SCRIPT_TEMPLATE = `// Pineapple Plantation Tracker - Google Apps Script
// Instructions:
// 1. Open your Google Sheet -> Click "Extensions" -> "Apps Script"
// 2. Delete any existing code and paste this entire code
// 3. Click "Deploy" -> "New deployment"
// 4. Select type: "Web app"
// 5. Execute as: "Me" | Who has access: "Anyone"
// 6. Click "Deploy", copy the Web App URL, and paste it into the Pineapple Tracker app!

function doPost(e) {
  try {
    var raw = e.postData.contents;
    var data = JSON.parse(raw);
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. Update/Create Pineapples Sheet
    var pSheet = ss.getSheetByName("Pineapples") || ss.insertSheet("Pineapples");
    pSheet.clear();
    pSheet.appendRow(["Batch ID", "Name / Lot", "Planted By", "Plant Date", "Plant Cost", "Status", "Nourishments Done", "Total Required", "Completed Date"]);
    data.pineapples.forEach(function(p) {
      pSheet.appendRow([p.id, p.name, p.plantedBy, p.plantedAt, p.plantCost, p.status, p.nourishmentsCompleted, p.totalRequired, p.completedAt || "-"]);
    });

    // 2. Update/Create Nourishments Sheet
    var nSheet = ss.getSheetByName("Nourishments") || ss.insertSheet("Nourishments");
    nSheet.clear();
    nSheet.appendRow(["Batch ID", "Slot #", "Due Time", "Status", "Worker", "Done Time", "Cost"]);
    data.nourishments.forEach(function(n) {
      nSheet.appendRow([n.pineappleId, "Slot #" + n.slotNumber, n.dueAt, n.status, n.workerName, n.doneAt, n.cost]);
    });

    // 3. Update/Create Workers (Hisab) Sheet
    var wSheet = ss.getSheetByName("Workers_Hisab") || ss.insertSheet("Workers_Hisab");
    wSheet.clear();
    wSheet.appendRow(["Worker ID", "Name", "Phone", "Plantings Done", "Nourishments Done", "Total Earned", "Total Paid", "Pending Balance"]);
    data.workers.forEach(function(w) {
      wSheet.appendRow([w.id, w.name, w.phone, w.plantingsCount, w.nourishmentsCount, w.totalEarnings, w.totalPaid, w.pendingBalance]);
    });

    // 4. Update/Create Summary Sheet
    var sSheet = ss.getSheetByName("Plantation_Summary") || ss.insertSheet("Plantation_Summary");
    sSheet.clear();
    sSheet.appendRow(["Metric", "Value"]);
    sSheet.appendRow(["Business Name", data.businessName]);
    sSheet.appendRow(["Last Synced At", data.syncedAt]);
    sSheet.appendRow(["Total Pineapples", data.summary.totalPineapples]);
    sSheet.appendRow(["Active Batches", data.summary.activePineapples]);
    sSheet.appendRow(["Completed Batches", data.summary.completedPineapples]);
    sSheet.appendRow(["Total Investment Spent", data.summary.totalSpent]);
    sSheet.appendRow(["Total Paid to Workers", data.summary.totalPaidWorkers]);
    sSheet.appendRow(["Total Pending Labor Hisab", data.summary.pendingBalance]);

    return ContentService.createTextOutput(JSON.stringify({ status: "success", syncedAt: data.syncedAt }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
`;
