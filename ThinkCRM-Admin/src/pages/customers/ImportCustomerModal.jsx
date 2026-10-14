import React, { useState } from "react";
import Modal from "@/components/ui/Modal";
import Icon from "@/components/ui/Icon";
import Button from "@/components/ui/Button";
import { toast } from "react-toastify";
import { useImportCustomersMutation } from "@/store/api/customers/customersApiSlice";

/**
 * Professional CSV Customer Import Modal:
 * - Clean drag-and-drop or file upload area
 * - Client-side validation & preview table (first 5 records)
 * - Required fields check (fullName, phone)
 * - Backend duplicate detection & batch processing
 * - Accurate breakdown report: imported, skipped, failed
 * - Pure flat design: subtle borders, no shadows
 */
const ImportCustomerModal = ({ isOpen, onClose, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [parseErrors, setParseErrors] = useState([]);
  const [importResult, setImportResult] = useState(null);

  const [importCustomers, { isLoading }] = useImportCustomersMutation();

  const resetState = () => {
    setFile(null);
    setParsedData([]);
    setParseErrors([]);
    setImportResult(null);
  };

  const handleModalClose = () => {
    resetState();
    onClose();
  };

  // Helper to parse CSV text into array of objects
  const parseCSV = (text) => {
    const lines = text
      .split(/\r\n|\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length < 2) {
      throw new Error("CSV file must contain at least a header row and one customer record.");
    }

    // Parse header row
    const headers = lines[0].split(",").map((h) => h.replace(/^["']|["']$/g, "").trim());

    const records = [];
    const errors = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      // Regex handling quoted CSV values
      const regex = /(?:,|\n|^)("(?:(?:"")*[^"]*)*"|[^",\n]*|(?:\n|$))/g;
      const values = [];
      let match;
      while ((match = regex.exec(line)) !== null && values.length < headers.length) {
        let val = match[1] || "";
        val = val.replace(/^["']|["']$/g, "").trim();
        values.push(val);
      }

      if (values.length === 0 || (values.length === 1 && !values[0])) continue;

      const record = {};
      headers.forEach((header, index) => {
        record[header] = values[index] || "";
      });

      // Normalization of common header keys
      const fullName =
        record["Full Name"] ||
        record["fullName"] ||
        record["Name"] ||
        record["name"] ||
        record["Customer Name"] ||
        "";
      const phone =
        record["Phone"] ||
        record["phone"] ||
        record["Phone Number"] ||
        record["Mobile"] ||
        "";
      const email = record["Email"] || record["email"] || "";
      const projectType =
        record["Project Type"] ||
        record["projectType"] ||
        record["Project"] ||
        "Modular Kitchen";
      const totalValue =
        record["Total Value"] || record["totalValue"] || record["Budget"] || 0;
      const status = record["Status"] || record["status"] || "active";
      const city = record["City"] || record["city"] || "";
      const location = record["Location"] || record["location"] || city || "";
      const address = record["Address"] || record["address"] || "";

      if (!fullName) {
        errors.push(`Row ${i + 1}: Missing customer name.`);
      }
      if (!phone) {
        errors.push(`Row ${i + 1}: Missing phone number.`);
      }

      records.push({
        fullName,
        phone,
        email,
        projectType,
        totalValue: Number(totalValue) || 0,
        status: status.toLowerCase(),
        city,
        location,
        address,
      });
    }

    return { records, errors };
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith(".csv")) {
      toast.error("Please select a valid CSV (.csv) file");
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error("File size must be under 5MB");
      return;
    }

    setFile(selectedFile);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result;
        if (typeof text === "string") {
          const { records, errors } = parseCSV(text);
          setParsedData(records);
          setParseErrors(errors);
        }
      } catch (err) {
        toast.error(err.message || "Failed to parse CSV file");
        setParsedData([]);
      }
    };
    reader.readAsText(selectedFile);
  };

  const handleDownloadSample = () => {
    const sampleHeaders = [
      "Full Name",
      "Phone",
      "Email",
      "Project Type",
      "Total Value",
      "Status",
      "City",
      "Address",
    ];
    const sampleRows = [
      ["Rajesh Sharma", "+91 98765 43210", "rajesh.sharma@example.com", "Modular Kitchen", "450000", "active", "Mumbai", "120 Linking Road, Bandra West"],
      ["Pooja Patel", "+91 98220 12345", "pooja.patel@example.com", "Full Home", "1200000", "in_progress", "Pune", "Flat 402, Green Acres, Baner"],
      ["Vikram Singh", "+91 97110 56789", "vikram.singh@example.com", "Wardrobe", "280000", "active", "Delhi", "B-14 Greater Kailash 1"],
    ];

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [sampleHeaders.join(","), ...sampleRows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "ThinkCRM_Customer_Import_Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExecuteImport = async () => {
    if (parsedData.length === 0) {
      toast.error("No valid customer records to import.");
      return;
    }

    try {
      const response = await importCustomers(parsedData).unwrap();
      const result = response.data || response;
      setImportResult(result);
      toast.success(
        `Import completed: ${result.imported} imported, ${result.skipped} skipped, ${result.failed} failed`
      );
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      toast.error(err?.data?.message || "Import failed. Please check your data and retry.");
    }
  };

  return (
    <Modal
      title="Import Customers via CSV"
      activeModal={isOpen}
      onClose={isLoading ? () => {} : handleModalClose}
      className="max-w-3xl font-inter"
    >
      <div className="space-y-5 pt-1">
        {/* Step 1: Upload or Download Template */}
        {!importResult && (
          <>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Upload Customer CSV File
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Import multiple customers at once with automatic duplicate checking
                </p>
              </div>
              <button
                type="button"
                onClick={handleDownloadSample}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
              >
                <Icon icon="heroicons-outline:arrow-down-tray" className="text-sm text-slate-500" />
                <span>Sample CSV Template</span>
              </button>
            </div>

            {/* Drag & Drop Area */}
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-6 text-center hover:border-primary-500 transition-colors bg-slate-50/50 dark:bg-slate-900/30">
              <Icon
                icon="heroicons-outline:arrow-up-tray"
                className="text-4xl text-slate-400 mx-auto mb-2.5"
              />
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                {file ? file.name : "Drag & drop your CSV file here, or browse"}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Supported format: .csv (Max 5MB)
              </p>
              <label className="mt-3.5 inline-block">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition">
                  <Icon icon="heroicons-outline:folder-open" className="text-sm" />
                  <span>Select CSV File</span>
                </span>
              </label>
            </div>

            {/* Validation & Preview Section */}
            {parsedData.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <span>
                    Detected: <span className="font-bold text-primary-600">{parsedData.length} records</span>
                  </span>
                  {parseErrors.length > 0 && (
                    <span className="text-amber-600 dark:text-amber-400">
                      ⚠ {parseErrors.length} warning(s) detected
                    </span>
                  )}
                </div>

                {/* Preview Table: First 5 rows */}
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-semibold">
                      <tr>
                        <th className="py-2 px-3">#</th>
                        <th className="py-2 px-3">Name</th>
                        <th className="py-2 px-3">Phone</th>
                        <th className="py-2 px-3">Email</th>
                        <th className="py-2 px-3">Project Type</th>
                        <th className="py-2 px-3">Total Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 bg-white dark:bg-slate-800">
                      {parsedData.slice(0, 5).map((row, i) => (
                        <tr key={i} className="hover:bg-slate-50/50">
                          <td className="py-2 px-3 text-slate-400 font-mono">{i + 1}</td>
                          <td className="py-2 px-3 font-semibold text-slate-800 dark:text-slate-200">
                            {row.fullName || "—"}
                          </td>
                          <td className="py-2 px-3 text-slate-600 dark:text-slate-300 font-mono">
                            {row.phone || "—"}
                          </td>
                          <td className="py-2 px-3 text-slate-500">{row.email || "—"}</td>
                          <td className="py-2 px-3 text-slate-600 dark:text-slate-300">
                            {row.projectType}
                          </td>
                          <td className="py-2 px-3 font-semibold text-slate-800 dark:text-slate-200">
                            ₹{Number(row.totalValue).toLocaleString("en-IN")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {parsedData.length > 5 && (
                  <p className="text-[11px] text-slate-400 text-center">
                    Showing first 5 of {parsedData.length} records in preview
                  </p>
                )}
              </div>
            )}
          </>
        )}

        {/* Step 2: Post-Import Results Breakdown */}
        {importResult && (
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/20">
                <span className="block text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {importResult.imported || 0}
                </span>
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                  Imported
                </span>
              </div>
              <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-950/20">
                <span className="block text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {importResult.skipped || 0}
                </span>
                <span className="text-xs font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
                  Skipped (Duplicate)
                </span>
              </div>
              <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50/60 dark:bg-rose-950/20">
                <span className="block text-2xl font-bold text-rose-600 dark:text-rose-400">
                  {importResult.failed || 0}
                </span>
                <span className="text-xs font-semibold text-rose-700 dark:text-rose-300 uppercase tracking-wider">
                  Failed
                </span>
              </div>
            </div>

            {importResult.errors && importResult.errors.length > 0 && (
              <div className="p-3 rounded-lg border border-rose-200 dark:border-rose-800 bg-rose-50/40 text-xs text-rose-700 dark:text-rose-300 space-y-1 max-h-32 overflow-y-auto">
                <span className="font-bold block">Import Errors:</span>
                {importResult.errors.map((err, idx) => (
                  <p key={idx}>
                    Row {err.row}: {err.error}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-700">
          <button
            type="button"
            className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs md:text-sm font-semibold transition"
            onClick={handleModalClose}
            disabled={isLoading}
          >
            {importResult ? "Close" : "Cancel"}
          </button>

          {!importResult && (
            <button
              type="button"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white text-xs md:text-sm font-semibold transition disabled:opacity-60"
              onClick={handleExecuteImport}
              disabled={isLoading || parsedData.length === 0}
            >
              {isLoading && <Icon icon="heroicons-outline:arrow-path" className="animate-spin text-sm" />}
              <span>{isLoading ? "Importing..." : `Import ${parsedData.length || ""} Customers`}</span>
            </button>
          )}

          {importResult && (
            <button
              type="button"
              className="px-5 py-2.5 rounded-xl border border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-950/40 dark:text-primary-300 dark:border-primary-800 hover:bg-primary-100 text-xs md:text-sm font-semibold transition"
              onClick={resetState}
            >
              Import More
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ImportCustomerModal;
