import { useState, useEffect } from "react";
import { useToast } from "../context/ToastContext";
import API from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";
import { motion } from "framer-motion";

function Projects() {
  const { addToast } = useToast();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    technology: "",
    githubLink: "",
    liveDemo: "",
    image: "",
  });
  const [selectedFile, setSelectedFile] = useState(null);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await API.get("/user/projects");
      setProjects(res.data);
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const openCreateModal = () => {
    setEditingProject(null);
    setForm({ title: "", description: "", technology: "", githubLink: "", liveDemo: "", image: "" });
    setSelectedFile(null);
    setShowModal(true);
  };

  const openEditModal = (proj) => {
    setEditingProject(proj);
    setForm({
      title: proj.title || "",
      description: proj.description || "",
      technology: proj.technology || "",
      githubLink: proj.githubLink || "",
      liveDemo: proj.liveDemo || "",
      image: proj.image || "",
    });
    setSelectedFile(null);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this project?")) return;
    try {
      await API.delete(`/user/projects/${id}`);
      addToast("Project deleted successfully!", "success");
      setProjects(projects.filter((p) => p._id !== id));
    } catch (err) {
      addToast(err.message, "error");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      addToast("Project title is required.", "error");
      return;
    }

    const formData = new FormData();
    formData.append("title", form.title);
    formData.append("description", form.description);
    formData.append("technology", form.technology);
    formData.append("githubLink", form.githubLink);
    formData.append("liveDemo", form.liveDemo);
    if (selectedFile) {
      formData.append("image", selectedFile);
    } else {
      formData.append("image", form.image);
    }

    try {
      setSubmitting(true);
      if (editingProject) {
        const res = await API.put(`/user/projects/${editingProject._id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        addToast("Project updated successfully!", "success");
        setProjects(projects.map((p) => (p._id === editingProject._id ? res.data.project : p)));
      } else {
        const res = await API.post("/user/projects", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        addToast("Project created successfully!", "success");
        setProjects([res.data.project, ...projects]);
      }
      setShowModal(false);
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading projects..." />;
  }

  return (
    <div className="page-container">
      <div className="page-header flex-between">
        <div>
          <h2>💻 Projects Portfolio</h2>
          <p>Add, edit, or remove software projects displayed on your portfolio.</p>
        </div>
        <button onClick={openCreateModal} className="btn-primary">
          ➕ Add New Project
        </button>
      </div>

      <div className="projects-grid">
        {projects.length === 0 ? (
          <div className="empty-state">
            <p>📂 No projects added yet. Click "Add New Project" to get started!</p>
          </div>
        ) : (
          projects.map((proj) => (
            <motion.div layout key={proj._id} className="card project-card">
              <div className="project-image-box">
                {proj.image ? (
                  <img src={proj.image.startsWith("http") ? proj.image : `http://localhost:5000${proj.image}`} alt={proj.title} />
                ) : (
                  <div className="project-placeholder">💻 {proj.title}</div>
                )}
              </div>
              <div className="project-card-body">
                <h3>{proj.title}</h3>
                <p className="project-desc">{proj.description}</p>
                {proj.technology && (
                  <div className="tech-tags">
                    {proj.technology.split(",").map((tech, i) => (
                      <span key={i} className="tech-tag">{tech.trim()}</span>
                    ))}
                  </div>
                )}
                <div className="project-links">
                  {proj.githubLink && (
                    <a href={proj.githubLink} target="_blank" rel="noreferrer" className="link-badge">
                      🐙 GitHub
                    </a>
                  )}
                  {proj.liveDemo && (
                    <a href={proj.liveDemo} target="_blank" rel="noreferrer" className="link-badge badge-demo">
                      🚀 Live Demo
                    </a>
                  )}
                </div>
              </div>
              <div className="card-actions">
                <button onClick={() => openEditModal(proj)} className="btn-icon btn-edit">
                  ✏️ Edit
                </button>
                <button onClick={() => handleDelete(proj._id)} className="btn-icon btn-delete">
                  🗑️ Delete
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Modal Dialog */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingProject ? "Edit Project" : "Create New Project"}</h3>
              <button onClick={() => setShowModal(false)} className="modal-close">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>Project Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. AI Portfolio Builder"
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Explain the key features, architecture, and problem solved..."
                />
              </div>

              <div className="form-group">
                <label>Technologies Used (comma-separated)</label>
                <input
                  type="text"
                  value={form.technology}
                  onChange={(e) => setForm({ ...form, technology: e.target.value })}
                  placeholder="React, Node.js, Express, MongoDB"
                />
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label>GitHub Repository URL</label>
                  <input
                    type="url"
                    value={form.githubLink}
                    onChange={(e) => setForm({ ...form, githubLink: e.target.value })}
                    placeholder="https://github.com/username/repo"
                  />
                </div>

                <div className="form-group">
                  <label>Live Demo URL</label>
                  <input
                    type="url"
                    value={form.liveDemo}
                    onChange={(e) => setForm({ ...form, liveDemo: e.target.value })}
                    placeholder="https://my-app.vercel.app"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Project Banner Image</label>
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
                  {submitting ? "Saving..." : editingProject ? "Update Project" : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Projects;
