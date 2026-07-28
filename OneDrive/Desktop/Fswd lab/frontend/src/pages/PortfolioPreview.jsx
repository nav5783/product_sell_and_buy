import { useAuth } from "../context/AuthContext";
import PortfolioView from "./PortfolioView";

function PortfolioPreview() {
  const { user } = useAuth();

  return (
    <div className="preview-page-wrapper">
      <div className="preview-banner">
        <span>👁️ Live Portfolio Preview (Username: @{user?.username})</span>
        <a
          href={`/portfolio/${user?.username}`}
          target="_blank"
          rel="noreferrer"
          className="btn-sm btn-primary"
        >
          🔗 Open Public Link in New Tab
        </a>
      </div>
      <div className="preview-frame-container">
        <PortfolioView isPreview={true} usernameOverride={user?.username} />
      </div>
    </div>
  );
}

export default PortfolioPreview;
