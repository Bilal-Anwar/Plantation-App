import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import {
  exportPlantationToExcel,
  parseUploadedExcel,
  TARGET_IMPORT_FIELDS,
  guessColumnMapping,
} from '../utils/excelService';
import { GOOGLE_APPS_SCRIPT_TEMPLATE } from '../utils/sheetSyncService';
import { formatDateTime } from '../utils/dateUtils';
import {
  Download,
  Upload,
  FileSpreadsheet,
  Link as LinkIcon,
  RefreshCw,
  Check,
  Copy,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from 'lucide-react';

export const ExcelHub: React.FC = () => {
  const {
    pineapples,
    nourishments,
    workers,
    workerHisabSummaries,
    settings,
    updateSettings,
    importMergedData,
    syncToSheetNow,
    isSyncingSheet,
    showToast,
  } = useApp();

  // Excel File upload state
  const [file, setFile] = useState<File | null>(null);
  const [rawRows, setRawRows] = useState<Record<string, unknown>[]>([]);
  const [availableHeaders, setAvailableHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [step, setStep] = useState<'idle' | 'map'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Live Sheet Sync Link state
  const [sheetUrlInput, setSheetUrlInput] = useState(settings.sheetSyncUrl || '');
  const [autoSyncToggle, setAutoSyncToggle] = useState(settings.autoSyncToSheet || false);
  const [isCopiedScript, setIsCopiedScript] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  // 1. Export Excel File
  const handleExport = () => {
    exportPlantationToExcel(pineapples, nourishments, workers, workerHisabSummaries, settings);
    showToast('Excel workbook downloaded', 'success');
  };

  // 2. Save Sheet Sync Link
  const handleSaveSheetUrl = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = sheetUrlInput.trim();
    updateSettings({
      sheetSyncUrl: cleanUrl,
      autoSyncToSheet: autoSyncToggle,
    });
    if (cleanUrl) {
      showToast('Google Sheet link save ho gaya!', 'success');
    } else {
      showToast('Link remove kar diya gaya.', 'info');
    }
  };

  // 3. Copy Google Apps Script Template
  const handleCopyScript = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_TEMPLATE);
    setIsCopiedScript(true);
    showToast('Apps Script code clipboard par copy ho gaya!', 'success');
    setTimeout(() => setIsCopiedScript(false), 3000);
  };

  // 4. File Upload for Excel Import
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = e.target.files?.[0];
    if (!uploaded) return;

    try {
      const parsed = await parseUploadedExcel(uploaded);
      setFile(uploaded);
      const rows = parsed.sheetsData[parsed.sheetNames[0]] || [];
      setRawRows(rows);

      if (rows.length > 0) {
        const headers = Object.keys(rows[0]);
        setAvailableHeaders(headers);
        setColumnMapping(guessColumnMapping(headers));
        setStep('map');
      } else {
        showToast('The sheet appears to be empty.', 'warning');
      }
    } catch {
      showToast('Could not read the file. Please upload .xlsx or .csv', 'error');
    }
  };

  const handleConfirmMerge = () => {
    if (!rawRows || rawRows.length === 0) return;

    const newWorkers = Array.from(
      new Set(
        rawRows
          .map(r => String(r[columnMapping['workerName']] || '').trim())
          .filter(Boolean)
      )
    ).map(name => ({ name }));

    const newPineapples = rawRows
      .map((r, idx) => {
        const id = String(r[columnMapping['pineappleId']] || '').trim();
        const name = String(r[columnMapping['pineappleName']] || '').trim();
        const workerName = String(r[columnMapping['workerName']] || '').trim();
        const plantedAt = String(r[columnMapping['plantedAt']] || '').trim();
        const cost = Number(r[columnMapping['plantCost']]) || settings.plantCost;
        const completed = Number(r[columnMapping['completedNourishments']]) || 0;

        return {
          id: id || `PINE-IMP-${idx + 1}`,
          name: name || `Imported Batch ${idx + 1}`,
          workerName: workerName || 'Worker',
          plantedAt: plantedAt || new Date().toISOString(),
          plantCost: cost,
          completedCount: completed,
        };
      })
      .filter(p => p.id && p.workerName);

    importMergedData(newWorkers, newPineapples);
    setStep('idle');
    setFile(null);
    setRawRows([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* 1. LIVE GOOGLE SHEETS / ONLINE EXCEL SYNC LINK FEATURE */}
      <div className="bg-white dark:bg-zinc-900 border-2 border-emerald-500/80 dark:border-emerald-600/70 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center space-x-2">
              <LinkIcon className="w-4 h-4 text-emerald-600" />
              <span>Connect Live Google Sheet / Online Sheet</span>
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Apni Google Sheet ka link add karein taake tamam records usme automatically update hote rahein.
            </p>
          </div>

          {settings.lastSheetSyncTime && (
            <span className="text-[11px] text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md font-mono self-start sm:self-auto">
              Last synced: {formatDateTime(settings.lastSheetSyncTime, settings.timezone)}
            </span>
          )}
        </div>

        {/* URL Input Form */}
        <form onSubmit={handleSaveSheetUrl} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Google Sheet Webhook / Apps Script Web App Link:
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="url"
                value={sheetUrlInput}
                onChange={e => setSheetUrlInput(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="flex-1 px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-mono text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-hidden focus:border-emerald-500"
              />
              <button
                type="submit"
                className="px-3.5 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 text-xs font-semibold cursor-pointer shrink-0"
              >
                Save Link
              </button>
            </div>
            {sheetUrlInput.includes('docs.google.com/spreadsheets') && (
              <div className="mt-1.5 p-2 bg-amber-50 dark:bg-amber-950/40 rounded-md border border-amber-200 dark:border-amber-900 text-[11px] text-amber-900 dark:text-amber-200 flex items-start justify-between gap-2">
                <span>
                  💡 <strong>Tip:</strong> Yeh spreadsheet view link hai. Is sheet mein auto-update receive karne ke liye is sheet ke andar <strong>Extensions → Apps Script</strong> se Web App link banana hota hai (niche guide dekhein).
                </span>
                <a
                  href={sheetUrlInput}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold underline text-amber-800 dark:text-amber-300 hover:text-amber-950 shrink-0 inline-flex items-center space-x-1"
                >
                  <span>Open Sheet</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>

          {/* Auto-Sync Checkbox & Sync Now Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <label className="flex items-center space-x-2 cursor-pointer text-xs text-zinc-700 dark:text-zinc-300">
              <input
                type="checkbox"
                checked={autoSyncToggle}
                onChange={e => {
                  const val = e.target.checked;
                  setAutoSyncToggle(val);
                  updateSettings({ autoSyncToSheet: val });
                }}
                className="rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span>Har nourishment ya new plant par <strong>auto-update</strong> karein</span>
            </label>

            <button
              type="button"
              disabled={isSyncingSheet || !settings.sheetSyncUrl}
              onClick={() => syncToSheetNow()}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs transition-colors shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingSheet ? 'animate-spin' : ''}`} />
              <span>{isSyncingSheet ? 'Updating Sheet...' : 'Sync Now (Update Sheet)'}</span>
            </button>
          </div>
        </form>

        {/* Collapsible 1-Minute Setup Guide */}
        <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs">
          <button
            type="button"
            onClick={() => setShowInstructions(!showInstructions)}
            className="flex items-center justify-between w-full text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 font-medium cursor-pointer py-1"
          >
            <span>Apni Google Sheet ka link kaise hasil karein? (1 minute guide)</span>
            {showInstructions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showInstructions && (
            <div className="mt-3 p-3.5 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl space-y-2.5 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
              <ol className="list-decimal list-inside space-y-1 text-[11px] leading-relaxed">
                <li>Google Sheets mein ek new spreadsheet banayein.</li>
                <li>Top menu mein <strong>Extensions → Apps Script</strong> par click karein.</li>
                <li>Pehle se maujood code mita kar niche diya gaya script paste karein:</li>
              </ol>

              <button
                type="button"
                onClick={handleCopyScript}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] flex items-center space-x-1.5 cursor-pointer"
              >
                {isCopiedScript ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isCopiedScript ? '✓ Copied to Clipboard!' : 'Copy Apps Script Code'}</span>
              </button>

              <ol start={4} className="list-decimal list-inside space-y-1 text-[11px] leading-relaxed">
                <li>Apps Script mein upar <strong>Deploy → New deployment</strong> dabayein.</li>
                <li>Type mein <strong>Web app</strong> select karein. <em>Who has access:</em> <strong>Anyone</strong> select karein.</li>
                <li>Deploy dabane ke baad milne wala <strong>Web App URL</strong> copy karein aur upar box mein paste kar dein!</li>
              </ol>
            </div>
          )}
        </div>
      </div>

      {/* 2. EXPORT EXCEL FILE (.xlsx) */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 space-y-3">
        <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center space-x-2">
          <Download className="w-4 h-4 text-emerald-600" />
          <span>Manual Export to Excel (.xlsx)</span>
        </h3>
        <p className="text-xs text-zinc-500 leading-relaxed">
          Offline .xlsx file download karein jisme 5 sheets hongi: <strong>Pineapples, Nourishments, Workers, Worker Summary (Hisab)</strong>, aur <strong>Totals</strong> with formulas.
        </p>

        <button
          onClick={handleExport}
          className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center space-x-1.5 cursor-pointer transition-colors"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Download Excel Workbook</span>
        </button>
      </div>

      {/* 3. IMPORT EXISTING EXCEL SHEET */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 space-y-4">
        <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center space-x-2">
          <Upload className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
          <span>Import from Excel or CSV</span>
        </h3>
        <p className="text-xs text-zinc-500">
          Upload an existing sheet to merge pineapples and workers into the app. Duplicate IDs are automatically skipped.
        </p>

        {step === 'idle' ? (
          <div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-medium cursor-pointer"
            >
              Choose .xlsx or .csv file
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            <div className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">
              Loaded: <strong>{file?.name}</strong> ({rawRows.length} rows)
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {TARGET_IMPORT_FIELDS.map(target => (
                <div key={target.key} className="space-y-1">
                  <label className="font-medium text-zinc-700 dark:text-zinc-300">
                    {target.label} {target.required && '*'}
                  </label>
                  <select
                    value={columnMapping[target.key] || ''}
                    onChange={e =>
                      setColumnMapping(prev => ({ ...prev, [target.key]: e.target.value }))
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs"
                  >
                    <option value="">-- Skip --</option>
                    {availableHeaders.map(h => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <button
                onClick={handleConfirmMerge}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer"
              >
                Confirm & Import Records
              </button>
              <button
                onClick={() => {
                  setStep('idle');
                  setFile(null);
                }}
                className="px-3 py-2 text-xs text-zinc-500 hover:text-zinc-800 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
