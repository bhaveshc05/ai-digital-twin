import { useState } from "react";

const PDFUpload = () => {
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleFile = (selectedFile) => {
    setMessage("");
    setError("");

    if (!selectedFile) return;

    if (selectedFile.type !== "application/pdf") {
      setError("Only PDF files are supported.");
      setFile(null);
      return;
    }

    setFile(selectedFile);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    handleFile(droppedFile);
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a PDF first.");
      return;
    }

    setUploading(true);
    setMessage("");
    setError("");

    try {
      const formData = new FormData();

      formData.append("file", file);

      // Optional student ID
      const storedUser = JSON.parse(
        localStorage.getItem("user") || "{}"
      );

      const studentId =
        storedUser.student_id ||
        storedUser.id ||
        "";

      if (studentId) {
        formData.append("student_id", studentId);
      }

      const response = await fetch(
        "http://127.0.0.1:8000/api/v1/upload-pdf",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "PDF upload failed."
        );
      }

      setMessage(
        `PDF uploaded successfully: ${data.filename}`
      );
      setFile(null);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">

          <div className="card shadow-sm border-0">
            <div className="card-body p-4">

              <h2 className="text-center mb-2">
                Upload Study Notes
              </h2>

              <p className="text-center text-muted mb-4">
                Upload a PDF to process your study material.
              </p>

              <div
                className={`border rounded p-5 text-center ${
                  dragging
                    ? "border-primary bg-light"
                    : "border-secondary"
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                style={{ cursor: "pointer" }}
                onClick={() =>
                  document
                    .getElementById("pdfInput")
                    .click()
                }
              >
                <input
                  id="pdfInput"
                  type="file"
                  accept=".pdf,application/pdf"
                  hidden
                  onChange={(e) =>
                    handleFile(e.target.files[0])
                  }
                />

                <h5>
                  {dragging
                    ? "Drop your PDF here"
                    : "Drag & Drop your PDF here"}
                </h5>

                <p className="text-muted mb-0">
                  or click to browse
                </p>
              </div>

              {file && (
                <div className="alert alert-info mt-3">
                  <strong>Selected file:</strong>{" "}
                  {file.name}
                  <br />
                  <small>
                    Size:{" "}
                    {(file.size / 1024).toFixed(2)} KB
                  </small>
                </div>
              )}

              {error && (
                <div className="alert alert-danger mt-3">
                  {error}
                </div>
              )}

              {message && (
                <div className="alert alert-success mt-3">
                  {message}
                </div>
              )}

              <button
                className="btn btn-primary w-100 mt-3"
                onClick={handleUpload}
                disabled={!file || uploading}
              >
                {uploading
                  ? "Uploading..."
                  : "Upload PDF"}
              </button>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PDFUpload;