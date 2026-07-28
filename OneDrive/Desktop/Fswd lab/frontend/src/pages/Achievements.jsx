import { useState, useEffect } from "react";
import { useToast } from "../context/ToastContext";
import API from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";

function Achievements() {
  const { addToast } = useToast();
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAch, setEditingAch] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    date: "",
    certificateImage: "",
  });
  const [selectedFile, setSelectedFile] = useState(null);

  const fetchAchievements = async () => {
    try {
      setLoading(true);
      const res = await API.get("/user/achievements");
      setAchievements(res.data);
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAchievements();
  }, []);

  const openCreateModal = () => {
    setEditingAch(null);
    setForm({ title: "", description: "", date: "", certificateImage: "" });
    setSelectedFile(null);
    setShowModal(true);
  };

  const openEditModal = (ach) => {
    setEditingAch(ach);
    setForm({
      title: ach.title || "",
      description: ach.description || "",
      date: ach.date || "",
      certificateImage: ach.certificateImage || "",
    });
    setSelectedFile(null);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this achievement?")) return;
    try {
      await API.delete(`/user/achievements/${id}`);
      addToast("Achievement deleted successfully!", "success");
      setAchievements(achievements.filter((a) => a._id !== id));
    } catch (err) {
      addToast(err.message, "error");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      addToast("Title is required.", "error");
      return;
    }

    const formData = new FormData();
    formData.append("title", form.title);
    formData.append("description", form.description);
    formData.append("date", form.date);
    if (selectedFile) {
      formData.append("certificateImage", selectedFile);
    } else {
      formData.append("certificateImage", form.certificateImage);
    }

    try {
      setSubmitting(true);
      if (editingAch) {
        const res = await API.put(`/user/achievements/${editingAch._id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        addToast("Achievement updated successfully!", "success");
        setAchievements(achievements.map((a) => (a._id === editingAch._id ? res.data.achievement : a)));
      } else {
        const res = await API.post("/user/achievements", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        addToast("Achievement added successfully!", "success");
        setAchievements([res.data.achievement, ...achievements]);
      }
      setShowModal(false);
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading achievements & certificates..." />;
  }

  return (
    <div className="page-container">
      <div className="page-header flex-between">
        <div>
          <h2>🏆 Achievements & Certificates</h2>
          <p>Highlight your honors, contest ranks, certifications, and awards.</p>
        </div>
        <button onClick={openCreateModal} className="btn-primary">
          ➕ Add Achievement
        </button>
      </div>

      <div className="grid-3">
        {achievements.length === 0 ? (
          <div className="empty-state full-width">
            <p>🏆 No achievements added yet. Click "Add Achievement" to display your awards and certificates!</p>
          </div>
        ) : (
          achievements.map((ach) => (
            <div key={ach._id} className="card ach-card">
              <div className="ach-image-box">
                {ach.certificateImage ? (
                  <img src={ach.certificateImage.startsWith("http") ? ach.certificateImage : `http://localhost:5000${ach.certificateImage}`} alt={ach.title} />
                ) : (
                  <div className="ach-placeholder">🏆 {ach.title}</div>
                )}
              </div>
              <div className="ach-card-body">
                <h3>{ach.title}</h3>
                {ach.date && <span className="date-tag">{ach.date}</span>}
                <p className="ach-desc">{ach.description}</p>
              </div>
              <div className="card-actions">
                <button onClick={() => openEditModal(ach)} className="btn-icon btn-edit">
                  ✏️ Edit
                </button>
                <button onClick={() => handleDelete(ach._id)} className="btn-icon btn-delete">
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingAch ? "Edit Achievement" : "Add Achievement"}</h3>
              <button onClick={() => setShowModal(false)} className="modal-close">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>Achievement Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. AWS Certified Solutions Architect or Hackathon Winner"
                  required
                />
              </div>

              <div className="form-group">
                <label>Date Received / Awarded</label>
                <input
                  type="text"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  placeholder="e.g. August 2024"
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Details about the award, organization, or achievement..."
                />
              </div>

              <div className="form-group">
                <label>Certificate Image / Badge</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                />
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? "Saving..." : editingAch ? "Update Achievement" : "Add Achievement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Achievements;
