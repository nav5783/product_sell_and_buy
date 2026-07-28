const LoadingSpinner = ({ text = "Loading..." }) => {
  return (
    <div className="spinner-container">
      <div className="spinner-ring"></div>
      {text && <p className="spinner-text">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;
