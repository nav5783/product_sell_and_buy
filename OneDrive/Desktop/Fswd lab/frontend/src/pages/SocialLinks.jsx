import { useState, useEffect } from "react";
import { useToast } from "../context/ToastContext";
import API from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";

function SocialLinks() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [links, setLinks] = useState({
    github: "",
    linkedin: "",
    geeksforgeeks: "",
    leetcode: "",
    hackerrank: "",
    twitter: "",
    instagram: "",
  });

  const fetchSocialLinks = async () => {
    try {
      setLoading(true);
      const res = await API.get("/user/profile");
      if (res.data.profile) {
        const p = res.data.profile;
        setLinks({
          github: p.github || "",
          linkedin: p.linkedin || "",
          geeksforgeeks: p.geeksforgeeks || "",
          leetcode: p.leetcode || "",
          hackerrank: p.hackerrank || "",
          twitter: p.twitter || "",
          instagram: p.instagram || "",
        });
      }
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSocialLinks();
  }, []);

  const handleChange = (e) => {
    setLinks({ ...links, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await API.put("/user/profile", links);
      addToast("Social links updated successfully!", "success");
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading social links..." />;
  }

  const platformFields = [
    { name: "github", label: "GitHub Profile", icon: "🐙", placeholder: "https://github.com/username" },
    { name: "linkedin", label: "LinkedIn Profile", icon: "💼", placeholder: "https://linkedin.com/in/username" },
    { name: "geeksforgeeks", label: "GeeksforGeeks Profile", icon: "🟢", placeholder: "https://geeksforgeeks.org/user/username" },
    { name: "leetcode", label: "LeetCode Profile", icon: "🟧", placeholder: "https://leetcode.com/u/username" },
    { name: "hackerrank", label: "HackerRank Profile", icon: "🟩", placeholder: "https://hackerrank.com/profile/username" },
    { name: "twitter", label: "Twitter / X Profile", icon: "🐦", placeholder: "https://x.com/username" },
    { name: "instagram", label: "Instagram Profile", icon: "📸", placeholder: "https://instagram.com/username" },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>🌐 Social & Coding Platforms</h2>
        <p>Connect your GitHub, LinkedIn, coding profiles, and social accounts to your portfolio.</p>
      </div>

      <div className="card card-form">
        <form onSubmit={handleSubmit} className="form-stack">
          <div className="form-grid-2">
            {platformFields.map((field) => (
              <div key={field.name} className="form-group">
                <label className="icon-label">
                  <span>{field.icon}</span> {field.label}
                </label>
                <input
                  type="url"
                  name={field.name}
                  value={links[field.name]}
                  onChange={handleChange}
                  placeholder={field.placeholder}
                />
              </div>
            ))}
          </div>

          <div className="form-actions">
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? "Saving Links..." : "💾 Save Social Links"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SocialLinks;
