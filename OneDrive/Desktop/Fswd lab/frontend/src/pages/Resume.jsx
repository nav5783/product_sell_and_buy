import { useState, useEffect } from "react";
import { useToast } from "../context/ToastContext";
import API from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";

function Resume() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [resumeUrl, setResumeUrl] = useState("");

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await API.get("/user/profile");
      if (res.data.profile?.resumeUrl) {
        setResumeUrl(res.data.profile.resumeUrl);
      }
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      addToast("Please upload a PDF file for your resume.", "error");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("fieldname", "resumeUrl");

    try {
      setUploading(true);
      const res = await API.post("/user/profile/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      addToast("Resume PDF uploaded successfully!", "success");
      setResumeUrl(res.data.fileUrl);
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading resume documents..." />;
  }

  const fullResumeUrl = resumeUrl ? `http://localhost:5000${resumeUrl}` : "";

  return (
    <div className="page-container">
      <div className="page-header flex-between">
        <div>
          <h2>📄 Resume Management</h2>
          <p>Upload your latest PDF resume for portfolio visitors to view and download.</p>
        </div>
        <label className="btn-primary btn-file-upload">
          {uploading ? "Uploading..." : "📤 Upload PDF Resume"}
          <input type="file" accept=".pdf" onChange={handleResumeUpload} disabled={uploading} />
        </label>
      </div>

      <div className="card resume-card">
        {resumeUrl ? (
          <div>
            <div className="resume-toolbar flex-between">
              <span><strong>Current File:</strong> {resumeUrl.split("/").pop()}</span>
              <a href={fullResumeUrl} target="_blank" rel="noreferrer" download className="btn-sm btn-outline">
                ⬇️ Download Resume PDF
              </a>
            </div>
            <div className="resume-viewer-container">
              <iframe
                src={fullResumeUrl}
                title="Resume Preview"
                className="resume-iframe"
              ></iframe>
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <p>📄 No resume PDF uploaded yet. Click "Upload PDF Resume" to add your CV!</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Resume;
