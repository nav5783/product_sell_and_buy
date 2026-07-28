import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import API from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";
import { motion } from "framer-motion";

function Profile() {
  const { setUser } = useAuth();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [profile, setProfile] = useState({
    fullName: "",
    headline: "",
    bio: "",
    aboutMe: "",
    phone: "",
    email: "",
    location: "",
    website: "",
    profilePhoto: "",
    coverImage: "",
    languages: "",
  });

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await API.get("/user/profile");
      if (res.data.profile) {
        const p = res.data.profile;
        setProfile({
          fullName: p.fullName || res.data.user?.fullName || "",
          headline: p.headline || "",
          bio: p.bio || "",
          aboutMe: p.aboutMe || "",
          phone: p.phone || "",
          email: p.email || res.data.user?.email || "",
          location: p.location || "",
          website: p.website || "",
          profilePhoto: p.profilePhoto || "",
          coverImage: p.coverImage || "",
          languages: Array.isArray(p.languages) ? p.languages.join(", ") : "",
        });
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

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleFileUpload = async (e, fieldName) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploading(true);
      const res = await API.post("/user/profile/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      addToast(res.data.message || "File uploaded successfully!", "success");
      setProfile((prev) => ({ ...prev, [fieldName]: res.data.fileUrl }));
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await API.put("/user/profile", profile);
      addToast(res.data.message || "Profile saved successfully!", "success");
      if (profile.fullName) {
        setUser((prev) => ({ ...prev, fullName: profile.fullName }));
      }
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading profile details..." />;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>👤 Profile & Bio Management</h2>
        <p>Update your personal information, headline, profile picture, and about section.</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="card card-form"
      >
        <form onSubmit={handleSubmit} className="form-stack">
          {/* Images Upload Section */}
          <div className="profile-media-section">
            <div className="cover-upload-box">
              <div
                className="cover-preview"
                style={{
                  backgroundImage: profile.coverImage ? `url(http://localhost:5000${profile.coverImage})` : "none",
                }}
              >
                <label className="btn-file-upload">
                  📷 Change Cover Image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, "coverImage")}
                  />
                </label>
              </div>
            </div>

            <div className="photo-upload-box">
              <div className="avatar-preview-lg">
                {profile.profilePhoto ? (
                  <img src={`http://localhost:5000${profile.profilePhoto}`} alt="Profile" />
                ) : (
                  <span>{profile.fullName ? profile.fullName[0].toUpperCase() : "U"}</span>
                )}
              </div>
              <label className="btn-file-upload btn-sm">
                📸 Upload Photo
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, "profilePhoto")}
                />
              </label>
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                name="fullName"
                value={profile.fullName}
                onChange={handleChange}
                placeholder="e.g. Alexander Vance"
                required
              />
            </div>

            <div className="form-group">
              <label>Professional Headline</label>
              <input
                type="text"
                name="headline"
                value={profile.headline}
                onChange={handleChange}
                placeholder="e.g. Senior Full-Stack Developer | React & Node.js Specialist"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Short Bio (Hero Section)</label>
            <input
              type="text"
              name="bio"
              value={profile.bio}
              onChange={handleChange}
              placeholder="A brief 1-2 sentence introduction displayed on your portfolio home"
            />
          </div>

          <div className="form-group">
            <label>Detailed About Me</label>
            <textarea
              name="aboutMe"
              rows={5}
              value={profile.aboutMe}
              onChange={handleChange}
              placeholder="Share your career background, passions, achievements, and goals..."
            />
          </div>

          <div className="form-grid-3">
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                name="email"
                value={profile.email}
                onChange={handleChange}
                placeholder="alexander@example.com"
              />
            </div>

            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="text"
                name="phone"
                value={profile.phone}
                onChange={handleChange}
                placeholder="+1 (555) 019-2834"
              />
            </div>

            <div className="form-group">
              <label>Location</label>
              <input
                type="text"
                name="location"
                value={profile.location}
                onChange={handleChange}
                placeholder="San Francisco, CA"
              />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label>Personal Website</label>
              <input
                type="url"
                name="website"
                value={profile.website}
                onChange={handleChange}
                placeholder="https://alexandervance.dev"
              />
            </div>

            <div className="form-group">
              <label>Spoken / Known Languages (comma separated)</label>
              <input
                type="text"
                name="languages"
                value={profile.languages}
                onChange={handleChange}
                placeholder="English, Spanish, German"
              />
            </div>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              disabled={saving || uploading}
              className="btn-primary"
            >
              {saving ? "Saving Changes..." : "💾 Save Profile Changes"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default Profile;
