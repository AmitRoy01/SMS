"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./template_style.module.css";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://sms-8kiu.onrender.com" || "http://localhost:8000";

export default function TemplatesPage() {
  const [type, setType] = useState("ssc_hsc");
  const [excelFile, setExcelFile] = useState(null);
  const [parsedRows, setParsedRows] = useState([]);
  const [preview, setPreview] = useState(null);
  const [selectedIndices, setSelectedIndices] = useState([]);
  const [rowRange, setRowRange] = useState(''); // Row range input
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      if (!token) return router.push("/login");
      try {
        const res = await fetch(`${API_BASE_URL}/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        // Only redirect/remove token on 401 (unauthorized)
        if (res.status === 401) {
          localStorage.removeItem("token");
          return router.push("/login");
        }
      } catch (e) {
        // Don't remove token on network errors
        console.error('Error checking auth:', e.message);
      }
    };
    checkAuth();
  }, [router]);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const backToHome = () => router.push("/");

  const doPreview = async () => {
    if (!excelFile) {
      alert("Please upload an Excel file");
      return;
    }
    setLoading(true);
    try {
      const form = new FormData();
      form.append("file", excelFile);
      const up = await fetch(`${API_BASE_URL}/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      if (!up.ok) {
        const txt = await up.text();
        alert("Upload failed: " + txt);
        setLoading(false);
        return;
      }
      const parsed = await up.json();
      const data = parsed.data || [];
      setParsedRows(data);
      // default to selecting all rows after preview
      setSelectedIndices(data.map((_, i) => i));

      const res = await fetch(`${API_BASE_URL}/templates/preview`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ type, data }),
      });
      const j = await res.json();
      // preview is now full rows including 'Result'
      setPreview(j.preview || null);
    } catch (e) {
      alert("Invalid input or upload failed");
    }
    setLoading(false);
  };

  const toggleRow = (i) => {
    setSelectedIndices((prev) =>
      prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]
    );
  };

  const selectAll = () => {
    if (!preview) return;
    setSelectedIndices(preview.map((_, i) => i));
  };

  const deselectAll = () => {
    setSelectedIndices([]);
  };

  const handleApplyRange = () => {
    const trimmed = rowRange.trim();
    if (!trimmed) {
      alert('Please enter a row range');
      return;
    }

    if (!preview || preview.length === 0) {
      alert('No preview data available');
      return;
    }

    try {
      let indices = [];
      
      // Parse "20-50" or "20-" or "20"
      if (trimmed.includes('-')) {
        const parts = trimmed.split('-');
        const start = parseInt(parts[0]);
        
        if (isNaN(start) || start < 1) {
          alert('Invalid start row number');
          return;
        }
        
        if (parts[1] === '') {
          // "20-" means from row 20 to end
          for (let i = start - 1; i < preview.length; i++) {
            indices.push(i);
          }
        } else {
          // "20-50" means from row 20 to 50
          const end = parseInt(parts[1]);
          if (isNaN(end) || end < start) {
            alert('Invalid end row number');
            return;
          }
          for (let i = start - 1; i < Math.min(end, preview.length); i++) {
            indices.push(i);
          }
        }
      } else {
        // "20" means only row 20
        const single = parseInt(trimmed);
        if (isNaN(single) || single < 1 || single > preview.length) {
          alert('Invalid row number');
          return;
        }
        indices = [single - 1];
      }
      
      setSelectedIndices(indices);
    } catch (error) {
      alert('Invalid range format. Use formats like: 20, 20-50, or 20-');
    }
  };

  const discardPreview = () => {
    // Clear state and refresh the page for a clean start
    setPreview(null);
    setParsedRows([]);
    setSelectedIndices([]);
    setExcelFile(null);
    // small timeout to ensure state updates then reload
    setTimeout(() => {
      window.location.reload();
    }, 120);
  };

  const openInSendExcel = () => {
    // Put selected preview rows (or all) into localStorage for Home page to pick up
    const data =
      preview && preview.length
        ? selectedIndices.length
          ? selectedIndices.map((i) => preview[i])
          : preview
        : parsedRows;
    if (!data || data.length === 0) {
      alert("No data to open");
      return;
    }
    try {
      localStorage.setItem("imported_template_data", JSON.stringify({ data }));
      router.push("/");
    } catch (e) {
      alert("Unable to transfer data to Send SMS page");
    }
  };

  const doDownload = async () => {
    // Use preview rows if available, otherwise parsedRows
    const data = preview && preview.length ? preview : parsedRows;
    if (!data || data.length === 0) {
      alert("No data to download");
      return;
    }
    setLoading(true);
    const res = await fetch(`${API_BASE_URL}/templates/download`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ type, data }),
    });
    if (res.ok) {
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      //a.download = `Template_${type}.xlsx`;
      const originalFileName = excelFile?.name || "UploadedFile.xlsx";
      a.download = `SMS_${originalFileName}`;

      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } else {
      alert("Failed to download");
    }
    setLoading(false);
  };

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <button
            className="btn btn-sm btn-outline-secondary me-2"
            onClick={() => router.back()}
          >
            Back
          </button>
          <button
            className="btn btn-sm btn-outline-primary"
            onClick={backToHome}
          >
            Home
          </button>
        </div>
        <h3 className="mb-0">Make SMS Format</h3>
      </div>
      <div className="card p-3">
        <div className="mb-3">
          <label className="form-label">Template Type</label>
          <select
            className="form-select"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="varsity">Varsity / Engineering Result</option>
            <option value="medical">Medical Result</option>
            <option value="ssc_hsc">SSC / HSC Result</option>
          </select>
        </div>

        <div className="mb-3">
          <label className="form-label">Upload Excel (required)</label>
          <input
            type="file"
            accept=".xlsx,.xls"
            className="form-control mb-2"
            onChange={(e) => setExcelFile(e.target.files?.[0] ?? null)}
          />
        </div>

        <div className="d-flex gap-2">
          <button
            className={`${styles.btnInteractive} ${styles.largeAction}`}
            onClick={doPreview}
            disabled={loading}
          >
            {loading ? "Working..." : "Generate format"}
          </button>
          <button
            className={`${styles.btnCustom} ${styles.btnSuccess} ${styles.largeAction}`}
            onClick={doDownload}
            disabled={loading}
          >
            {loading ? "Working..." : "Download Excel"}
          </button>
          <button
            className={`${styles.btnCustom} ${styles.btnDanger} ${styles.largeAction}`}
            onClick={discardPreview}
            disabled={loading}
          >
            {loading ? "Working..." : "Discard"}
          </button>
        </div>

        {preview && (
          <div className="mt-3">
            <h6>Preview Results</h6>

            {/* Show number of selected rows */}
            <div className="mb-2">
              <strong>
                Selected: {selectedIndices.length} / {preview.length} rows
              </strong>
            </div>

            <div className="d-flex justify-content-between align-items-center mb-2">
              <div className={styles.controlsRow}>
                <div className="d-flex gap-2 align-items-center me-3">
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    style={{ width: '120px' }}
                    placeholder="e.g. 20-50"
                    value={rowRange}
                    onChange={(e) => setRowRange(e.target.value)}
                    title="Enter range: 20 (single), 20-50 (range), 20- (from 20 to end)"
                  />
                  <button
                    className={`${styles.btnCustom} ${styles.btnOutline} btn-sm`}
                    onClick={handleApplyRange}
                  >
                    Apply Range
                  </button>
                </div>
                <button
                  className={`${styles.btnCustom} ${styles.btnOutline} btn-sm`}
                  onClick={selectAll}
                >
                  Select All
                </button>
                <button
                  className={`${styles.btnCustom} ${styles.btnOutline} btn-sm`}
                  onClick={deselectAll}
                >
                  Deselect All
                </button>
              </div>
              <div>
                <button
                  className={`${styles.openSend} ${styles.largeAction}`}
                  onClick={openInSendExcel}
                >
                  Send SMS with Excel
                </button>
              </div>
            </div>

            <div
              style={{ maxHeight: 300, overflow: "auto" }}
              className={`border p-2 bg-light ${styles.previewTable}`}
            >
              <table className="table table-sm mb-0">
                <thead>
                  <tr>
                    <th style={{ width: "36px" }}></th>
                    <th>Sr.</th>
                    <th>Student</th>
                    <th>Guardian</th>
                    <th>Result</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((p, i) => (
                    <tr
                      key={i}
                      className={
                        selectedIndices.includes(i) ? "table-active" : ""
                      }
                    >
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedIndices.includes(i)}
                          onChange={() => toggleRow(i)}
                        />
                      </td>
                      <td>{i + 1}</td> {/* Serial number */}
                      <td>
                        {p["Student Phone No"] || p["Student Phone"] || ""}
                      </td>
                      <td>
                        {p["Guardian Phone No"] || p["Guardian Phone"] || ""}
                      </td>
                      <td>
                        <small style={{ whiteSpace: "pre-wrap" }}>
                          {p.Result}
                        </small>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-2 d-flex gap-2">
              <button
                className={`${styles.btnCustom} ${styles.btnSuccess} btn-sm`}
                onClick={doDownload}
              >
                Download Excel
              </button>
              <button
                className={`${styles.btnCustom} ${styles.btnOutline} btn-sm`}
                onClick={discardPreview}
              >
                Discard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
