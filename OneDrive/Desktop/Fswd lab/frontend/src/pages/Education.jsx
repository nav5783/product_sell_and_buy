import { useState, useEffect } from "react";
import { useToast } from "../context/ToastContext";
import API from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";

function Education() {
  const { addToast } = useToast();
  const [educationList, setEducationList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEdu, setEditingEdu] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    college: "",
    degree: "",
    department: "",
    cgpa: "",
    startYear: "",
    endYear: "",
  });

  const fetchEducation = async () => {
    try {
      setLoading(true);
      const res = await API.get("/user/education");
      setEducationList(res.data);
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEducation();
  }, []);

  const openCreateModal = () => {
    setEditingEdu(null);
    setForm({ college: "", degree: "", department: "", cgpa: "", startYear: "", endYear: "" });
    setShowModal(true);
  };

  const openEditModal = (edu) => {
    setEditingEdu(edu);
    setForm({
      college: edu.college || "",
      degree: edu.degree || "",
      department: edu.department || "",
      cgpa: edu.cgpa || "",
      startYear: edu.startYear || "",
      endYear: edu.endYear || "",
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this education record?")) return;
    try {
      await API.delete(`/user/education/${id}`);
      addToast("Education deleted successfully!", "success");
      setEducationList(educationList.filter((e) => e._id !== id));
    } catch (err) {
      addToast(err.message, "error");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.college.trim() || !form.degree.trim()) {
      addToast("College and Degree are required.", "error");
      return;
    }

    try {
      setSubmitting(true);
      if (editingEdu) {
        const res = await API.put(`/user/education/${editingEdu._id}`, form);
        addToast("Education updated successfully!", "success");
        setEducationList(educationList.map((e) => (e._id === editingEdu._id ? res.data.education : e)));
      } else {
        const res = await API.post("/user/education", form);
        addToast("Education added successfully!", "success");
        setEducationList([res.data.education, ...educationList]);
      }
      setShowModal(false);
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading educational background..." />;
  }

  return (
    <div className="page-container">
      <div className="page-header flex-between">
        <div>
          <h2>🎓 Education & Qualifications</h2>
          <p>Add your degrees, colleges, specialization departments, and academic CGPA scores.</p>
        </div>
        <button onClick={openCreateModal} className="btn-primary">
          ➕ Add Education
        </button>
      </div>

      <div className="grid-2">
        {educationList.length === 0 ? (
          <div className="empty-state full-width">
            <p>🎓 No education records added yet. Click "Add Education" to add your academic degrees!</p>
          </div>
        ) : (
          educationList.map((edu) => (
            <div key={edu._id} className="card edu-card">
              <div className="edu-header">
                <span className="edu-icon">🎓</span>
                <div>
                  <h3>{edu.degree}</h3>
                  <h4 className="college-name">{edu.college}</h4>
                </div>
              </div>
              <div className="edu-details">
                {edu.department && <p><strong>Department:</strong> {edu.department}</p>}
                {edu.cgpa && <p><strong>CGPA / Grade:</strong> {edu.cgpa}</p>}
                {(edu.startYear || edu.endYear) && (
                  <p><strong>Period:</strong> {edu.startYear} - {edu.endYear}</p>
                )}
              </div>
              <div className="card-actions-sm">
                <button onClick={() => openEditModal(edu)} className="btn-icon btn-edit">
                  ✏️ Edit
                </button>
                <button onClick={() => handleDelete(edu._id)} className="btn-icon btn-delete">
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
              <h3>{editingEdu ? "Edit Education" : "Add Education"}</h3>
              <button onClick={() => setShowModal(false)} className="modal-close">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>College / University *</label>
                <input
                  type="text"
                  value={form.college}
                  onChange={(e) => setForm({ ...form, college: e.target.value })}
                  placeholder="e.g. Stanford University or MIT"
                  required
                />
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label>Degree *</label>
                  <input
                    type="text"
                    value={form.degree}
                    onChange={(e) => setForm({ ...form, degree: e.target.value })}
                    placeholder="e.g. Bachelor of Science"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Department / Major</label>
                  <input
                    type="text"
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                    placeholder="e.g. Computer Science & Engineering"
                  />
                </div>
              </div>

              <div className="form-grid-3">
                <div className="form-group">
                  <label>CGPA / Percentage</label>
                  <input
                    type="text"
                    value={form.cgpa}
                    onChange={(e) => setForm({ ...form, cgpa: e.target.value })}
                    placeholder="e.g. 3.8 / 4.0 or 88%"
                  />
                </div>

                <div className="form-group">
                  <label>Start Year</label>
                  <input
                    type="text"
                    value={form.startYear}
                    onChange={(e) => setForm({ ...form, startYear: e.target.value })}
                    placeholder="2020"
                  />
                </div>

                <div className="form-group">
                  <label>End Year</label>
                  <input
                    type="text"
                    value={form.endYear}
                    onChange={(e) => setForm({ ...form, endYear: e.target.value })}
                    placeholder="2024"
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? "Saving..." : editingEdu ? "Update Education" : "Add Education"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Education;
