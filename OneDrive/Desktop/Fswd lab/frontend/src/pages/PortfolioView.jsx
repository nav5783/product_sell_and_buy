import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import API from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";
import { motion } from "framer-motion";

function PortfolioView({ isPreview = false, usernameOverride = "" }) {
  const params = useParams();
  
  // Robust username extraction from props, params, or pathname fallback
  const pathnameUsername = window.location.pathname.startsWith("/portfolio/")
    ? window.location.pathname.split("/portfolio/")[1]?.split("/")[0]?.split("#")[0]?.split("?")[0]
    : "";

  const username = usernameOverride || params.username || pathnameUsername;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  // Theme & Scroll State
  const [portfolioTheme, setPortfolioTheme] = useState("dark");
  const [activeSection, setActiveSection] = useState("home");

  // Contact Form State
  const [contactForm, setContactForm] = useState({
    senderName: "",
    senderEmail: "",
    subject: "",
    message: "",
  });
  const [sendingMsg, setSendingMsg] = useState(false);
  const [msgStatus, setMsgStatus] = useState(null);

  const fetchPortfolio = async () => {
    if (!username) {
      setError("No username specified in portfolio URL.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      const res = await API.get(`/portfolio/${username}`);
      setData(res.data);
      if (res.data.themeKey) {
        setPortfolioTheme(res.data.themeKey);
      }
    } catch (err) {
      setError(err.message || "Failed to load portfolio.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolio();
  }, [username]);

  // Scroll spy for active section
  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll("section[id]");
      const scrollY = window.pageYOffset;

      sections.forEach((section) => {
        const sectionHeight = section.offsetHeight;
        const sectionTop = section.offsetTop - 100;
        const sectionId = section.getAttribute("id");

        if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
          setActiveSection(sectionId);
        }
      });
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    if (!contactForm.senderName || !contactForm.senderEmail || !contactForm.message) {
      setMsgStatus({ type: "error", text: "Please fill in all required fields." });
      return;
    }

    try {
      setSendingMsg(true);
      const res = await API.post(`/portfolio/${username}/contact`, contactForm);
      setMsgStatus({ type: "success", text: res.data.message || "Message sent successfully!" });
      setContactForm({ senderName: "", senderEmail: "", subject: "", message: "" });
    } catch (err) {
      setMsgStatus({ type: "error", text: err.message });
    } finally {
      setSendingMsg(false);
    }
  };

  if (loading) {
    return (
      <div className="full-screen-center">
        <LoadingSpinner text={`Loading @${username || "user"}'s portfolio...`} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="full-screen-center text-center">
        <h2>⚠️ Portfolio Not Found</h2>
        <p>{error || "The requested user portfolio does not exist or is deactivated."}</p>
      </div>
    );
  }

  const { user, profile, projects, skills, experience, education, achievements } = data;

  const getMediaUrl = (path) => {
    if (!path) return "";
    return path.startsWith("http") ? path : `http://localhost:5000${path}`;
  };

  // Apply custom theme colors
  const customStyle = {
    '--bg-color': user?.themeBg || undefined,
    '--card-bg': user?.themeCardBg || undefined,
    '--text-main': user?.themeText || undefined,
    '--primary': user?.themePrimary || undefined,
    backgroundColor: user?.themeBg || undefined,
    color: user?.themeText || undefined,
    backgroundImage: user?.bgImage ? `url(${getMediaUrl(user.bgImage)})` : undefined,
    backgroundSize: "cover",
    backgroundAttachment: "fixed",
  };

  return (
    <div className={`public-portfolio-page ${portfolioTheme === "dark" ? "theme-dark" : "theme-light"}`} style={customStyle}>
      {/* Portfolio Floating Navigation Bar */}
      <nav className="portfolio-nav">
        <div className="portfolio-nav-container">
          <a href="#home" className="nav-logo">
            ⚡ {user?.fullName || username}
          </a>

          <div className="nav-links-scroll">
            <a href="#home" className={activeSection === "home" ? "active" : ""}>Home</a>
            <a href="#about" className={activeSection === "about" ? "active" : ""}>About</a>
            <a href="#skills" className={activeSection === "skills" ? "active" : ""}>Skills</a>
            <a href="#experience" className={activeSection === "experience" ? "active" : ""}>Experience</a>
            <a href="#projects" className={activeSection === "projects" ? "active" : ""}>Projects</a>
            <a href="#education" className={activeSection === "education" ? "active" : ""}>Education</a>
            <a href="#achievements" className={activeSection === "achievements" ? "active" : ""}>Achievements</a>
            <a href="#contact" className={activeSection === "contact" ? "active" : ""}>Contact</a>
          </div>

          <button
            onClick={() => setPortfolioTheme(prevTheme => prevTheme === "dark" ? "light" : "dark")}
            className="theme-switch-btn"
            title={`Switch to ${portfolioTheme === "dark" ? "Light" : "Dark"} Mode`}
            aria-label={`Switch to ${portfolioTheme === "dark" ? "light" : "dark"} mode`}
          >
            {portfolioTheme === "dark" ? "☀️ Light" : "🌙 Dark"}
          </button>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section id="home" className="hero-section">
        {profile?.coverImage && (
          <div
            className="hero-cover-bg"
            style={{ backgroundImage: `url(${getMediaUrl(profile.coverImage)})` }}
          ></div>
        )}

        <div className="hero-container">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="hero-avatar-box"
          >
            {profile?.profilePhoto ? (
              <img src={getMediaUrl(profile.profilePhoto)} alt={user.fullName} className="hero-avatar-img" />
            ) : (
              <div className="hero-avatar-placeholder">
                {user.fullName ? user.fullName[0].toUpperCase() : "U"}
              </div>
            )}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="hero-name"
          >
            {user.fullName}
          </motion.h1>

          <p className="hero-headline">{profile?.headline || "Full-Stack Software Developer"}</p>
          <p className="hero-bio">{profile?.bio}</p>

          {/* Social Badges */}
          <div className="hero-social-row">
            {profile?.github && (
              <a href={profile.github} target="_blank" rel="noreferrer" className="social-badge">
                🐙 GitHub
              </a>
            )}
            {profile?.linkedin && (
              <a href={profile.linkedin} target="_blank" rel="noreferrer" className="social-badge">
                💼 LinkedIn
              </a>
            )}
            {profile?.geeksforgeeks && (
              <a href={profile.geeksforgeeks} target="_blank" rel="noreferrer" className="social-badge">
                🟢 GeeksforGeeks
              </a>
            )}
            {profile?.leetcode && (
              <a href={profile.leetcode} target="_blank" rel="noreferrer" className="social-badge">
                🟧 LeetCode
              </a>
            )}
            {profile?.hackerrank && (
              <a href={profile.hackerrank} target="_blank" rel="noreferrer" className="social-badge">
                🟩 HackerRank
              </a>
            )}
            {profile?.twitter && (
              <a href={profile.twitter} target="_blank" rel="noreferrer" className="social-badge">
                🐦 Twitter/X
              </a>
            )}
            {profile?.instagram && (
              <a href={profile.instagram} target="_blank" rel="noreferrer" className="social-badge">
                📸 Instagram
              </a>
            )}
          </div>

          <div className="hero-cta-buttons">
            <a href="#contact" className="btn-hero btn-hero-primary">
              💬 Contact Me
            </a>
            {profile?.resumeUrl && (
              <a
                href={getMediaUrl(profile.resumeUrl)}
                target="_blank"
                rel="noreferrer"
                download
                className="btn-hero btn-hero-outline"
              >
                📄 Download Resume
              </a>
            )}
          </div>
        </div>
      </section>

      {/* ABOUT ME SECTION */}
      <section id="about" className="portfolio-section">
        <div className="section-container">
          <h2 className="section-title"><span>01.</span> About Me</h2>
          <div className="about-grid">
            <div className="about-text-box">
              <p className="about-paragraph">{profile?.aboutMe || "Welcome to my portfolio! I am a passionate developer committed to building scalable web applications."}</p>
            </div>

            <div className="about-info-card">
              <h3>Personal Info</h3>
              <ul>
                {profile?.email && <li><strong>Email:</strong> {profile.email}</li>}
                {profile?.phone && <li><strong>Phone:</strong> {profile.phone}</li>}
                {profile?.location && <li><strong>Location:</strong> {profile.location}</li>}
                {profile?.website && <li><strong>Website:</strong> <a href={profile.website} target="_blank" rel="noreferrer">{profile.website}</a></li>}
                {profile?.languages && profile.languages.length > 0 && (
                  <li><strong>Languages:</strong> {profile.languages.join(", ")}</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* SKILLS SECTION */}
      <section id="skills" className="portfolio-section bg-alt">
        <div className="section-container">
          <h2 className="section-title"><span>02.</span> Technical Skills</h2>
          {skills && skills.length > 0 ? (
            <div className="skills-portfolio-grid">
              {skills.map((s) => (
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  key={s._id}
                  className="skill-bar-card"
                >
                  <div className="skill-meta flex-between">
                    <span className="skill-name">{s.skillName}</span>
                    <span className="skill-percent">{s.percentage}%</span>
                  </div>
                  <div className="skill-meter-bg">
                    <div
                      className="skill-meter-fill"
                      style={{ width: `${s.percentage}%` }}
                    ></div>
                  </div>
                  <span className="skill-cat-tag">{s.category}</span>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted">No skills added yet.</p>
          )}
        </div>
      </section>

      {/* WORK EXPERIENCE SECTION */}
      <section id="experience" className="portfolio-section">
        <div className="section-container">
          <h2 className="section-title"><span>03.</span> Work Experience</h2>
          {experience && experience.length > 0 ? (
            <div className="public-timeline">
              {experience.map((exp) => (
                <div key={exp._id} className="timeline-item">
                  <div className="timeline-dot"></div>
                  <div className="timeline-content">
                    <div className="flex-between flex-wrap">
                      <h3 className="exp-role">{exp.role}</h3>
                      <span className="exp-dates">{exp.startDate} - {exp.endDate}</span>
                    </div>
                    <h4 className="exp-company">{exp.company}</h4>
                    <p className="exp-desc">{exp.description}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted">No experience added yet.</p>
          )}
        </div>
      </section>

      {/* PROJECTS SECTION */}
      <section id="projects" className="portfolio-section bg-alt">
        <div className="section-container">
          <h2 className="section-title"><span>04.</span> Featured Projects</h2>
          {projects && projects.length > 0 ? (
            <div className="public-projects-grid">
              {projects.map((p) => (
                <motion.div
                  whileHover={{ y: -8 }}
                  key={p._id}
                  className="project-pub-card"
                >
                  <div className="project-pub-image">
                    {p.image ? (
                      <img src={getMediaUrl(p.image)} alt={p.title} />
                    ) : (
                      <div className="pub-img-placeholder">💻 {p.title}</div>
                    )}
                  </div>
                  <div className="project-pub-body">
                    <h3>{p.title}</h3>
                    <p>{p.description}</p>
                    {p.technology && (
                      <div className="pub-tech-tags">
                        {p.technology.split(",").map((tech, i) => (
                          <span key={i} className="tech-badge">{tech.trim()}</span>
                        ))}
                      </div>
                    )}
                    <div className="pub-project-links">
                      {p.githubLink && (
                        <a href={p.githubLink} target="_blank" rel="noreferrer" className="btn-pub-link">
                          🐙 Code
                        </a>
                      )}
                      {p.liveDemo && (
                        <a href={p.liveDemo} target="_blank" rel="noreferrer" className="btn-pub-link btn-pub-demo">
                          🚀 Live Demo
                        </a>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted">No projects added yet.</p>
          )}
        </div>
      </section>

      {/* EDUCATION SECTION */}
      <section id="education" className="portfolio-section">
        <div className="section-container">
          <h2 className="section-title"><span>05.</span> Education</h2>
          {education && education.length > 0 ? (
            <div className="grid-2">
              {education.map((edu) => (
                <div key={edu._id} className="pub-edu-card">
                  <div className="edu-icon-badge">🎓</div>
                  <div>
                    <h3>{edu.degree}</h3>
                    <h4>{edu.college}</h4>
                    {edu.department && <p>Department: {edu.department}</p>}
                    {edu.cgpa && <p className="cgpa-text">CGPA: {edu.cgpa}</p>}
                    <span className="years-text">{edu.startYear} - {edu.endYear}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted">No education details added yet.</p>
          )}
        </div>
      </section>

      {/* ACHIEVEMENTS & CERTIFICATES */}
      <section id="achievements" className="portfolio-section bg-alt">
        <div className="section-container">
          <h2 className="section-title"><span>06.</span> Achievements & Certificates</h2>
          {achievements && achievements.length > 0 ? (
            <div className="grid-3">
              {achievements.map((ach) => (
                <div key={ach._id} className="pub-ach-card">
                  {ach.certificateImage && (
                    <img src={getMediaUrl(ach.certificateImage)} alt={ach.title} className="ach-img-top" />
                  )}
                  <div className="ach-content-box">
                    <h3>🏆 {ach.title}</h3>
                    {ach.date && <span className="ach-date">{ach.date}</span>}
                    <p>{ach.description}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted">No achievements added yet.</p>
          )}
        </div>
      </section>

      {/* CONTACT FORM SECTION */}
      <section id="contact" className="portfolio-section">
        <div className="section-container">
          <h2 className="section-title"><span>07.</span> Get In Touch</h2>
          <div className="contact-wrapper">
            <div className="contact-info">
              <h3>Let's Connect</h3>
              <p>Feel free to reach out for inquiries, collaborations, or job opportunities.</p>
              {profile?.email && <p>📧 <strong>Email:</strong> {profile.email}</p>}
              {profile?.phone && <p>📱 <strong>Phone:</strong> {profile.phone}</p>}
              {profile?.location && <p>📍 <strong>Location:</strong> {profile.location}</p>}
            </div>

            <form onSubmit={handleContactSubmit} className="contact-form-box">
              {msgStatus && (
                <div className={`contact-msg-alert alert-${msgStatus.type}`}>
                  {msgStatus.text}
                </div>
              )}

              <div className="form-group">
                <label>Your Name *</label>
                <input
                  type="text"
                  value={contactForm.senderName}
                  onChange={(e) => setContactForm({ ...contactForm, senderName: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Your Email *</label>
                <input
                  type="email"
                  value={contactForm.senderEmail}
                  onChange={(e) => setContactForm({ ...contactForm, senderEmail: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Subject</label>
                <input
                  type="text"
                  value={contactForm.subject}
                  onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Message *</label>
                <textarea
                  rows={4}
                  value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  required
                />
              </div>

              <button type="submit" disabled={sendingMsg} className="btn-hero btn-hero-primary w-full">
                {sendingMsg ? "Sending Message..." : "✉️ Send Message"}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="portfolio-footer">
        <div className="section-container text-center">
          <p>&copy; {new Date().getFullYear()} {user.fullName}. All rights reserved.</p>
          <p className="footer-small">Powered by Naveen</p>
        </div>
      </footer>
    </div>
  );
}

export default PortfolioView;