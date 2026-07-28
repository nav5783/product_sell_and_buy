import { useState, useEffect } from "react";
import { useToast } from "../context/ToastContext";
import API from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";

function Skills() {
  const { addToast } = useToast();
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSkill, setEditingSkill] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    skillName: "",
    category: "Frontend",
    percentage: 85,
    icon: "code",
  });

  const fetchSkills = async () => {
    try {
      setLoading(true);
      const res = await API.get("/user/skills");
      setSkills(res.data);
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSkills();
  }, []);

  const openCreateModal = () => {
    setEditingSkill(null);
    setForm({ skillName: "", category: "Frontend", percentage: 85, icon: "code" });
    setShowModal(true);
  };

  const openEditModal = (skill) => {
    setEditingSkill(skill);
    setForm({
      skillName: skill.skillName || "",
      category: skill.category || "Frontend",
      percentage: skill.percentage || 80,
      icon: skill.icon || "code",
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this skill?")) return;
    try {
      await API.delete(`/user/skills/${id}`);
      addToast("Skill deleted successfully!", "success");
      setSkills(skills.filter((s) => s._id !== id));
    } catch (err) {
      addToast(err.message, "error");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.skillName.trim()) {
      addToast("Skill name is required.", "error");
      return;
    }

    try {
      setSubmitting(true);
      if (editingSkill) {
        const res = await API.put(`/user/skills/${editingSkill._id}`, form);
        addToast("Skill updated successfully!", "success");
        setSkills(skills.map((s) => (s._id === editingSkill._id ? res.data.skill : s)));
      } else {
        const res = await API.post("/user/skills", form);
        addToast("Skill added successfully!", "success");
        setSkills([res.data.skill, ...skills]);
      }
      setShowModal(false);
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading technical skills..." />;
  }

  return (
    <div className="page-container">
      <div className="page-header flex-between">
        <div>
          <h2>⚡ Skills & Competencies</h2>
          <p>Define your technical stack, proficiency percentages, and category groupings.</p>
        </div>
        <button onClick={openCreateModal} className="btn-primary">
          ➕ Add New Skill
        </button>
      </div>

      <div className="skills-grid">
        {skills.length === 0 ? (
          <div className="empty-state">
            <p>⚡ No skills added yet. Click "Add New Skill" to add your expertise!</p>
          </div>
        ) : (
          skills.map((skill) => (
            <div key={skill._id} className="card skill-card">
              <div className="skill-card-top">
                <div className="skill-title-group">
                  <span className="category-pill">{skill.category}</span>
                  <h4>{skill.skillName}</h4>
                </div>
                <span className="percent-badge">{skill.percentage}%</span>
              </div>
              <div className="skill-progress-bar">
                <div
                  className="skill-progress-fill"
                  style={{ width: `${skill.percentage}%` }}
                ></div>
              </div>
              <div className="card-actions-sm">
                <button onClick={() => openEditModal(skill)} className="btn-icon btn-edit">
                  ✏️ Edit
                </button>
                <button onClick={() => handleDelete(skill._id)} className="btn-icon btn-delete">
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
              <h3>{editingSkill ? "Edit Skill" : "Add New Skill"}</h3>
              <button onClick={() => setShowModal(false)} className="modal-close">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>Skill Name *</label>
                <input
                  type="text"
                  value={form.skillName}
                  onChange={(e) => setForm({ ...form, skillName: e.target.value })}
                  placeholder="e.g. React.js, Node.js, Python, Docker"
                  required
                />
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  >
                    <option value="Frontend">Frontend Development</option>
                    <option value="Backend">Backend Development</option>
                    <option value="Database">Database Systems</option>
                    <option value="DevOps & Tools">DevOps & Cloud Tools</option>
                    <option value="Languages">Programming Languages</option>
                    <option value="Other">Other Skills</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Proficiency Percentage ({form.percentage}%)</label>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="5"
                    value={form.percentage}
                    onChange={(e) => setForm({ ...form, percentage: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? "Saving..." : editingSkill ? "Update Skill" : "Add Skill"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Skills;
