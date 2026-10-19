import React, { useState, useRef } from "react";
import Modal from "@/components/ui/Modal";
import Icon from "@/components/ui/Icon";
import { toast } from "react-toastify";
import { useImportLeadsMutation } from "@/store/api/leads/leadsApiSlice";
import { validatePhone, validateEmail } from "@/utils/validation";

/**
 * Professional CSV Lead Import Modal
 * Reuses the existing ThinkCRM import modal layout, drag-and-drop area,
 * client-side CSV parser, validation preview table, duplicate detection summary,
 * and post-import breakdown report.
 */
const ImportLeadModal = ({ isOpen, onClose, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [parseErrors, setParseErrors] = useState([]);
  const [inFileDataDuplicates, setInFileDataDuplicates] = useState(0);
  const [importResult, setImportResult] = useState(null);
  const fileInputRef = useRef(null);

  const [importLeads, { isLoading }] = useImportLeadsMutation();

  const resetState = () => {
    setFile(null);
    setParsedData([]);
    setParseErrors([]);
    setInFileDataDuplicates(0);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleModalClose = () => {
    resetState();
    onClose();
  };

  // Helper to parse CSV text into array of structured lead objects
  const parseCSV = (text) => {
    const lines = text
      .split(/\r\n|\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length < 2) {
      throw new Error("CSV file must contain at least a header row and one lead record.");
    }

    // Parse header row
    const headers = lines[0].split(",").map((h) => h.replace(/^["']|["']$/g, "").trim());

    const records = [];
    const errors = [];
    const seenPhones = new Set();
    const seenEmails = new Set();
    let dupCount = 0;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      // Regex handling quoted CSV values containing commas
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
        record["Lead Name"] ||
        "";
      const phone =
        record["Phone"] ||
        record["phone"] ||
        record["Phone Number"] ||
        record["Mobile"] ||
        record["Mobile Number"] ||
        "";
      const alternatePhone =
        record["Alternate Phone"] ||
        record["alternatePhone"] ||
        record["Alt Phone"] ||
        "";
      const email = record["Email"] || record["email"] || "";
      const projectType =
        record["Project Type"] ||
        record["projectType"] ||
        record["Project"] ||
        "Modular Kitchen";
      const leadSource =
        record["Source"] ||
        record["source"] ||
        record["Lead Source"] ||
        record["leadSource"] ||
        "Website";
      const status = record["Status"] || record["status"] || "new";
      const priority = record["Priority"] || record["priority"] || "medium";
      const budget =
        record["Budget"] ||
        record["budget"] ||
        record["Budget Range"] ||
        record["budgetRange"] ||
        "";
      const requirement =
        record["Requirement"] ||
        record["requirement"] ||
        record["Project Description"] ||
        record["projectDescription"] ||
        "";
      const timeline =
        record["Preferred Timeline"] ||
        record["preferredTimeline"] ||
        record["Timeline"] ||
        record["timeline"] ||
        "";
      const city = record["City"] || record["city"] || "";
      const location = record["Location"] || record["location"] || city || "";
      const address = record["Address"] || record["address"] || "";
      const notes = record["Notes"] || record["notes"] || "";
      const assignedStaff =
        record["Assigned Staff"] ||
        record["assignedStaff"] ||
        record["Assigned To"] ||
        record["assignedTo"] ||
        "";

      // Row-level validation
      if (!fullName || fullName.trim().length < 2) {
        errors.push(`Row ${i + 1}: Name must be at least 2 characters.`);
      }
      if (!phone) {
        errors.push(`Row ${i + 1}: Missing phone number.`);
      } else {
        const phoneValidation = validatePhone(phone);
        if (!phoneValidation.isValid) {
          errors.push(`Row ${i + 1}: Invalid phone number "${phone}" (${phoneValidation.error}).`);
        } else {
          // In-file duplicate check using normalized phone
          const normPhone = phoneValidation.normalized || phone.replace(/\D/g, "");
          if (seenPhones.has(normPhone)) {
            dupCount++;
            errors.push(`Row ${i + 1}: Duplicate phone number "${phone}" detected in file.`);
          } else {
            seenPhones.add(normPhone);
          }
        }
      }

      if (email && email.trim()) {
        const emailValidation = validateEmail(email);
        if (!emailValidation.isValid) {
          errors.push(`Row ${i + 1}: Invalid email address format "${email}".`);
        } else {
          const normEmail = emailValidation.normalized || email.toLowerCase().trim();
          if (seenEmails.has(normEmail)) {
            dupCount++;
            errors.push(`Row ${i + 1}: Duplicate email "${email}" detected in file.`);
          } else {
            seenEmails.add(normEmail);
          }
        }
      }

      records.push({
        fullName,
        phone,
        alternatePhone,
        email,
        projectType,
        leadSource,
        status: status.toLowerCase(),
        priority: priority.toLowerCase(),
        budget,
        requirement,
        preferredTimeline: timeline,
        city,
        location,
        address,
        notes,
        assignedStaff,
      });
    }

    return { records, errors, inFileDataDuplicates: dupCount };
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.toLowerCase().endsWith(".csv")) {
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
          const { records, errors, inFileDataDuplicates } = parseCSV(text);
          setParsedData(records);
          setParseErrors(errors);
          setInFileDataDuplicates(inFileDataDuplicates);
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
      "Source",
      "Status",
      "Priority",
      "Budget",
      "Requirement",
      "Preferred Timeline",
      "City",
      "Location",
      "Address",
      "Notes",
      "Assigned Staff",
    ];

    const sampleRows = [
      [
        "Amit Verma",
        "+91 98765 43210",
        "amit.verma@example.com",
        "Modular Kitchen",
        "Website",
        "new",
        "medium",
        "500000",
        "L-shaped acrylic modular kitchen with island",
        "1-2 Months",
        "Mumbai",
        "Andheri West",
        "B-204 Crystal Plaza",
        "Prefers weekend consultation",
        "",
      ],
      [
        "Sneha Kulkarni",
        "+91 98220 54321",
        "sneha.k@example.com",
        "Full Home",
        "Instagram",
        "contacted",
        "high",
        "1500000",
        "Complete 3BHK interior renovation",
        "Immediate",
        "Pune",
        "Kothrud",
        "Flat 12, Mayur Colony",
        "Requested site measurement",
        "",
      ],
    ];

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [sampleHeaders.join(","), ...sampleRows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "ThinkCRM_Leads_Import_Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExecuteImport = async () => {
    if (parsedData.length === 0) {
      toast.error("No valid lead records to import.");
      return;
    }

    try {
      const response = await importLeads(parsedData).unwrap();
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
      title="Import Leads via CSV"
      activeModal={isOpen}
      onClose={isLoading ? () => {} : handleModalClose}
      className="max-w-3xl font-inter"
    >
      <div className="space-y-5 pt-1">
        {/* Step 1: Upload or Download Template */}
        {!importResult && (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-700">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Upload Leads CSV File
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Upload a CSV file to import multiple leads with validation and duplicate checking.
                </p>
              </div>
              <button
                type="button"
                onClick={handleDownloadSample}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition self-start sm:self-auto cursor-pointer whitespace-nowrap flex-shrink-0"
              >
                <Icon icon="heroicons-outline:arrow-down-tray" className="text-sm text-slate-500 flex-shrink-0" />
                <span className="whitespace-nowrap">Download Sample Leads CSV</span>
              </button>
            </div>

            {/* Drag & Drop Area */}
            {!file ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-6 text-center hover:border-blue-500 transition-colors bg-slate-50/50 dark:bg-slate-900/30 cursor-pointer"
              >
                <Icon
                  icon="heroicons-outline:arrow-up-tray"
                  className="text-4xl text-slate-400 mx-auto mb-2.5"
                />
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Drag & drop your CSV file here, or browse
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Supported format: .csv (Max 5MB)
                </p>
                <div className="mt-3.5 inline-block">
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition">
                    <Icon icon="heroicons-outline:folder-open" className="text-sm" />
                    <span>Select CSV File</span>
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 rounded-xl border border-blue-200 dark:border-blue-800/80 bg-blue-50/40 dark:bg-blue-950/20">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center flex-shrink-0">
                    <Icon icon="heroicons-outline:document-text" className="text-xl" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 dark:text-white truncate">
                      {file.name}
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium">
                      {(file.size / 1024).toFixed(1)} KB • Ready for validation
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline px-2 py-1 cursor-pointer"
                  >
                    Change File
                  </button>
                  <button
                    type="button"
                    onClick={resetState}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
                    title="Remove file"
                  >
                    <Icon icon="heroicons-outline:trash" className="text-base" />
                  </button>
                </div>
              </div>
            )}

            <input
              type="file"
              ref={fileInputRef}
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Validation & Preview Section */}
            {parsedData.length > 0 && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <div className="flex items-center gap-3">
                    <span>
                      Total Rows: <span className="font-bold text-slate-900 dark:text-white">{parsedData.length}</span>
                    </span>
                    <span>
                      Valid: <span className="font-bold text-emerald-600">{parsedData.length - parseErrors.length > 0 ? parsedData.length - parseErrors.length : 0}</span>
                    </span>
                    {inFileDataDuplicates > 0 && (
                      <span className="text-amber-600">
                        In-file Duplicates: {inFileDataDuplicates}
                      </span>
                    )}
                  </div>
                  {parseErrors.length > 0 && (
                    <span className="text-rose-600 dark:text-rose-400">
                      ⚠ {parseErrors.length} validation issue(s) detected
                    </span>
                  )}
                </div>

                {/* Validation Warnings Box */}
                {parseErrors.length > 0 && (
                  <div className="p-3 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/30 text-xs text-amber-800 dark:text-amber-300 space-y-1 max-h-24 overflow-y-auto">
                    <span className="font-bold block">Validation Warnings (Review before importing):</span>
                    {parseErrors.slice(0, 5).map((err, idx) => (
                      <p key={idx}>• {err}</p>
                    ))}
                    {parseErrors.length > 5 && (
                      <p className="text-[11px] font-medium">+ {parseErrors.length - 5} more issues in file</p>
                    )}
                  </div>
                )}

                {/* Preview Table: First 5 rows */}
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-semibold sticky top-0">
                      <tr>
                        <th className="py-2 px-3">#</th>
                        <th className="py-2 px-3">Lead Name</th>
                        <th className="py-2 px-3">Phone</th>
                        <th className="py-2 px-3">Email</th>
                        <th className="py-2 px-3">Project Type</th>
                        <th className="py-2 px-3">Source</th>
                        <th className="py-2 px-3">Budget</th>
                        <th className="py-2 px-3">Status</th>
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
                          <td className="py-2 px-3 text-slate-500">{row.leadSource}</td>
                          <td className="py-2 px-3 font-semibold text-slate-800 dark:text-slate-200">
                            {row.budget ? (isNaN(row.budget) ? row.budget : `₹${Number(row.budget).toLocaleString("en-IN")}`) : "—"}
                          </td>
                          <td className="py-2 px-3">
                            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                              {row.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {parsedData.length > 5 && (
                  <p className="text-[11px] text-slate-400 text-center">
                    Showing first 5 of {parsedData.length} lead records in preview
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
              <div className="p-3 rounded-lg border border-rose-200 dark:border-rose-800 bg-rose-50/40 text-xs text-rose-700 dark:text-rose-300 space-y-1 max-h-36 overflow-y-auto">
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
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition font-inter cursor-pointer"
            onClick={handleModalClose}
            disabled={isLoading}
          >
            {importResult ? "Close" : "Cancel"}
          </button>

          {!importResult && (
            <button
              type="button"
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition disabled:opacity-50 cursor-pointer"
              onClick={handleExecuteImport}
              disabled={isLoading || parsedData.length === 0}
            >
              {isLoading && <Icon icon="heroicons-outline:arrow-path" className="animate-spin text-sm" />}
              <span>{isLoading ? "Importing Leads..." : `Import ${parsedData.length || ""} Leads`}</span>
            </button>
          )}

          {importResult && (
            <button
              type="button"
              className="px-4 py-2 rounded-lg border border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800 hover:bg-blue-100 text-xs font-semibold transition cursor-pointer"
              onClick={resetState}
            >
              Import More Leads
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ImportLeadModal;
