import * as XLSX from 'xlsx';
import { Pineapple, Nourishment, Worker, Payment, AppSettings, WorkerHisabSummary } from '../types';
import { formatDateTime } from './dateUtils';

/**
 * Generates an Excel workbook with 5 structured sheets and formulas
 */
export function exportPlantationToExcel(
  pineapples: Pineapple[],
  nourishments: Nourishment[],
  workers: Worker[],
  workerSummaries: WorkerHisabSummary[],
  settings: AppSettings
) {
  const wb = XLSX.utils.book_new();
  const workerMap = new Map(workers.map(w => [w.id, w.name]));

  // 1. Sheet: Pineapples
  const pineappleRows = pineapples.map(p => {
    const pNourishments = nourishments.filter(n => n.pineappleId === p.id);
    const completedCount = pNourishments.filter(n => n.status === 'done').length;
    const totalSpent = p.plantCost + pNourishments.filter(n => n.status === 'done').reduce((acc, curr) => acc + curr.cost, 0);

    return {
      'Pineapple ID': p.id,
      'Batch / Name': p.name,
      'Planted By': workerMap.get(p.plantedByWorkerId) || 'Unknown Worker',
      'Planted Date & Time': formatDateTime(p.plantedAt, settings.timezone),
      'Plant Cost': p.plantCost,
      'Status': p.status.toUpperCase(),
      'Nourishments Completed': `${completedCount}/${p.totalNourishmentsRequired}`,
      'Nourishment Interval (hrs)': p.intervalHours,
      'Total Spent So Far': totalSpent,
      'Completed Date': p.completedAt ? formatDateTime(p.completedAt, settings.timezone) : '-'
    };
  });
  const wsPineapples = XLSX.utils.json_to_sheet(pineappleRows);
  XLSX.utils.book_append_sheet(wb, wsPineapples, 'Pineapples');

  // 2. Sheet: Nourishments
  const nourishmentRows = nourishments.map(n => {
    const parentPineapple = pineapples.find(p => p.id === n.pineappleId);
    return {
      'Nourishment ID': n.id,
      'Pineapple ID': n.pineappleId,
      'Pineapple Name': parentPineapple ? parentPineapple.name : '-',
      'Slot #': `Nourish #${n.slotNumber}`,
      'Due Date & Time': formatDateTime(n.dueAt, settings.timezone),
      'Status': n.status.toUpperCase(),
      'Executed By Worker': n.workerId ? (workerMap.get(n.workerId) || 'Unknown') : '-',
      'Completed Date & Time': n.doneAt ? formatDateTime(n.doneAt, settings.timezone) : '-',
      'Cost': n.cost,
      'Notes': n.notes || ''
    };
  });
  const wsNourishments = XLSX.utils.json_to_sheet(nourishmentRows);
  XLSX.utils.book_append_sheet(wb, wsNourishments, 'Nourishments');

  // 3. Sheet: Workers
  const workerRows = workers.map(w => ({
    'Worker ID': w.id,
    'Worker Name': w.name,
    'Phone': w.phone || '-',
    'Notes / Role': w.notes || '-',
    'Registered Date': formatDateTime(w.createdAt, settings.timezone)
  }));
  const wsWorkers = XLSX.utils.json_to_sheet(workerRows);
  XLSX.utils.book_append_sheet(wb, wsWorkers, 'Workers');

  // 4. Sheet: Worker Summary (Hisab)
  const hisabRows = workerSummaries.map((s, idx) => {
    const rowNum = idx + 2; // header is row 1
    return {
      'Worker ID': s.worker.id,
      'Worker Name': s.worker.name,
      'Plantings Count': s.plantingsCount,
      'Plantings Earnings': s.plantingsEarnings,
      'Nourishments Done': s.nourishmentsCount,
      'Nourishments Earnings': s.nourishmentsEarnings,
      'Total Earned': s.totalEarnings,
      'Total Paid': s.totalPaid,
      'Pending Balance': s.pendingBalance,
      // Formula placeholder in column J
      'Formula Check': { f: `G${rowNum}-H${rowNum}` }
    };
  });
  const wsHisab = XLSX.utils.json_to_sheet(hisabRows);
  XLSX.utils.book_append_sheet(wb, wsHisab, 'Worker Summary');

  // 5. Sheet: Totals & Financial Summary
  const totalPineapples = pineapples.length;
  const activePineapples = pineapples.filter(p => p.status === 'active').length;
  const completedPineapples = pineapples.filter(p => p.status === 'completed').length;
  const totalPlantCost = pineapples.reduce((sum, p) => sum + p.plantCost, 0);
  const totalNourishCostDone = nourishments.filter(n => n.status === 'done').reduce((sum, n) => sum + n.cost, 0);
  const totalInvestment = totalPlantCost + totalNourishCostDone;
  const totalPaidWorkers = workerSummaries.reduce((sum, w) => sum + w.totalPaid, 0);
  const totalPendingBalance = workerSummaries.reduce((sum, w) => sum + w.pendingBalance, 0);

  const totalsData = [
    { 'Metric': 'Business Name', 'Value': settings.businessName },
    { 'Metric': 'Export Date & Time', 'Value': formatDateTime(new Date().toISOString(), settings.timezone) },
    { 'Metric': 'Currency', 'Value': settings.currency },
    { 'Metric': 'Total Pineapples Planted', 'Value': totalPineapples },
    { 'Metric': 'Active Pineapples', 'Value': activePineapples },
    { 'Metric': 'Completed Pineapples', 'Value': completedPineapples },
    { 'Metric': 'Total Plant Investment Cost', 'Value': totalPlantCost },
    { 'Metric': 'Total Nourishment Cost Incurred', 'Value': totalNourishCostDone },
    { 'Metric': 'Grand Total Plantation Cost', 'Value': totalInvestment },
    { 'Metric': 'Total Paid to Workers', 'Value': totalPaidWorkers },
    { 'Metric': 'Total Pending Worker Hisab', 'Value': totalPendingBalance },
  ];
  const wsTotals = XLSX.utils.json_to_sheet(totalsData);
  XLSX.utils.book_append_sheet(wb, wsTotals, 'Totals');

  // Trigger download
  const dateStr = new Date().toISOString().slice(0, 10);
  const fileName = `Pineapple_Plantation_${dateStr}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

/**
 * Reads an uploaded file (.xlsx, .xls, .csv) and extracts sheets and raw row objects
 */
export async function parseUploadedExcel(file: File): Promise<{
  sheetNames: string[];
  sheetsData: Record<string, Record<string, unknown>[]>;
}> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });

  const sheetsData: Record<string, Record<string, unknown>[]> = {};
  for (const name of workbook.SheetNames) {
    const ws = workbook.Sheets[name];
    const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });
    sheetsData[name] = json;
  }

  return {
    sheetNames: workbook.SheetNames,
    sheetsData,
  };
}

/**
 * Standard app field definitions for mapping
 */
export const TARGET_IMPORT_FIELDS = [
  { key: 'pineappleId', label: 'Pineapple / Batch ID', required: true, example: 'PINE-101' },
  { key: 'pineappleName', label: 'Pineapple Name / Lot', required: false, example: 'Smooth Cayenne Field 1' },
  { key: 'workerName', label: 'Planted By Worker Name', required: true, example: 'Tariq Mehmood' },
  { key: 'plantedAt', label: 'Plant Date & Time', required: false, example: '2026-10-15 08:00' },
  { key: 'plantCost', label: 'Plant Cost ($)', required: false, example: '50000' },
  { key: 'completedNourishments', label: 'Nourishments Completed (0 to 7)', required: false, example: '4' },
];

/**
 * Helper to auto-suggest column mapping based on header names
 */
export function guessColumnMapping(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};

  headers.forEach(h => {
    const clean = h.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (clean.includes('id') && (clean.includes('pine') || clean.includes('batch'))) {
      mapping['pineappleId'] = h;
    } else if (clean.includes('batch') || clean.includes('lot') || clean.includes('name')) {
      if (!mapping['pineappleName']) mapping['pineappleName'] = h;
    } else if (clean.includes('worker') || clean.includes('planter') || clean.includes('by')) {
      if (!mapping['workerName']) mapping['workerName'] = h;
    } else if (clean.includes('date') || clean.includes('planted') || clean.includes('time')) {
      if (!mapping['plantedAt']) mapping['plantedAt'] = h;
    } else if (clean.includes('cost') || clean.includes('price') || clean.includes('rate')) {
      if (!mapping['plantCost']) mapping['plantCost'] = h;
    } else if (clean.includes('nourish') || clean.includes('completed') || clean.includes('done')) {
      if (!mapping['completedNourishments']) mapping['completedNourishments'] = h;
    }
  });

  return mapping;
}
