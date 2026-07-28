import { useState, useEffect } from "react";
import { useToast } from "../context/ToastContext";
import API from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";

function Experience() {
  const { addToast } = useToast();
  const [experiences, setExperiences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingExp, setEditingExp] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    company: "",
    role: "",
    startDate: "",
    endDate: "Present",
    description: "",
  });

  const fetchExperience = async () => {
    try {
      setLoading(true);
      const res = await API.get("/user/experience");
      setExperiences(res.data);
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExperience();
  }, []);

  const openCreateModal = () => {
    setEditingExp(null);
    setForm({ company: "", role: "", startDate: "", endDate: "Present", description: "" });
    setShowModal(true);
  };

  const openEditModal = (exp) => {
    setEditingExp(exp);
    setForm({
      company: exp.company || "",
      role: exp.role || "",
      startDate: exp.startDate || "",
      endDate: exp.endDate || "Present",
      description: exp.description || "",
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this experience record?")) return;
    try {
      await API.delete(`/user/experience/${id}`);
      addToast("Experience deleted successfully!", "success");
      setExperiences(experiences.filter((e) => e._id !== id));
    } catch (err) {
      addToast(err.message, "error");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.company.trim() || !form.role.trim()) {
      addToast("Company and Role are required.", "error");
      return;
    }

    try {
      setSubmitting(true);
      if (editingExp) {
        const res = await API.put(`/user/experience/${editingExp._id}`, form);
        addToast("Experience updated successfully!", "success");
        setExperiences(experiences.map((e) => (e._id === editingExp._id ? res.data.experience : e)));
      } else {
        const res = await API.post("/user/experience", form);
        addToast("Experience added successfully!", "success");
        setExperiences([res.data.experience, ...experiences]);
      }
      setShowModal(false);
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading work experiences..." />;
  }

  return (
    <div className="page-container">
      <div className="page-header flex-between">
        <div>
          <h2>💼 Professional Experience</h2>
          <p>Document your career timeline, company positions, and key responsibilities.</p>
        </div>
        <button onClick={openCreateModal} className="btn-primary">
          ➕ Add Work Experience
        </button>
      </div>

      <div className="timeline-container">
        {experiences.length === 0 ? (
          <div className="empty-state">
            <p>💼 No experience items added yet. Click "Add Work Experience" to showcase your career history!</p>
          </div>
        ) : (
          experiences.map((exp) => (
            <div key={exp._id} className="card timeline-card">
              <div className="timeline-badge">💼</div>
              <div className="timeline-card-content">
                <div className="timeline-header flex-between">
                  <div>
                    <h3>{exp.role}</h3>
                    <h4 className="company-text">{exp.company}</h4>
                  </div>
                  <span className="date-tag">
                    {exp.startDate} - {exp.endDate}
                  </span>
                </div>
                <p className="timeline-desc">{exp.description}</p>
                <div className="card-actions-sm">
                  <button onClick={() => openEditModal(exp)} className="btn-icon btn-edit">
                    ✏️ Edit
                  </button>
                  <button onClick={() => handleDelete(exp._id)} className="btn-icon btn-delete">
                    🗑️ Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingExp ? "Edit Work Experience" : "Add Work Experience"}</h3>
              <button onClick={() => setShowModal(false)} className="modal-close">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-grid-2">
                <div className="form-group">
                  <label>Company / Organization *</label>
                  <input
                    type="text"
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                    placeholder="e.g. Google, TechCorp, Freelance"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Role / Position *</label>
                  <input
                    type="text"
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    placeholder="e.g. Senior Frontend Developer"
                    required
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label>Start Date</label>
                  <input
                    type="text"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    placeholder="e.g. Jan 2022"
                  />
                </div>

                <div className="form-group">
                  <label>End Date</label>
                  <input
                    type="text"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    placeholder="e.g. Present or Dec 2024"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Job Description & Key Responsibilities</label>
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Led front-end development of high-traffic web apps using React and Redux..."
                />
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? "Saving..." : editingExp ? "Update Experience" : "Add Experience"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Experience;
