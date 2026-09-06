import React, { useState } from 'react';
import { UploadCloud, X, Image as ImageIcon } from 'lucide-react';
import { getImageUrl } from '../services/api';

const ImageUploader = ({
  existingImages = [],
  onExistingImagesChange,
  newFiles = [],
  onNewFilesChange,
  maxImages = 5,
}) => {
  const [dragActive, setDragActive] = useState(false);

  const handleFiles = (files) => {
    const selectedArr = Array.from(files);
    const validImages = selectedArr.filter((file) => file.type.startsWith('image/'));
    const totalCurrent = existingImages.length + newFiles.length;

    if (totalCurrent + validImages.length > maxImages) {
      alert(`Maximum ${maxImages} images allowed per product listing.`);
      const spaceLeft = maxImages - totalCurrent;
      if (spaceLeft > 0) {
        onNewFilesChange([...newFiles, ...validImages.slice(0, spaceLeft)]);
      }
    } else {
      onNewFilesChange([...newFiles, ...validImages]);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleRemoveExisting = (indexToRemove) => {
    if (onExistingImagesChange) {
      const updated = existingImages.filter((_, idx) => idx !== indexToRemove);
      onExistingImagesChange(updated);
    }
  };

  const handleRemoveNew = (indexToRemove) => {
    const updated = newFiles.filter((_, idx) => idx !== indexToRemove);
    onNewFilesChange(updated);
  };

  return (
    <div>
      <div
        className={`upload-dropzone ${dragActive ? 'active' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => document.getElementById('product-image-input').click()}
      >
        <UploadCloud size={36} color="var(--primary)" style={{ marginBottom: '0.5rem' }} />
        <p style={{ fontWeight: 600, color: '#fff', fontSize: '0.95rem' }}>
          Click or Drag & Drop Product Images Here
        </p>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
          Supports PNG, JPG, WEBP (Max 5MB each, up to {maxImages} photos)
        </p>
        <input
          id="product-image-input"
          type="file"
          multiple
          accept="image/png, image/jpeg, image/webp"
          style={{ display: 'none' }}
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
      </div>

      {/* Previews grid */}
      {(existingImages.length > 0 || newFiles.length > 0) && (
        <div style={{ marginTop: '1rem' }}>
          <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            Selected Photos ({existingImages.length + newFiles.length} / {maxImages}):
          </p>
          <div className="preview-grid">
            {/* Existing uploaded images */}
            {existingImages.map((imgUrl, idx) => (
              <div key={`existing-${idx}`} className="preview-thumb">
                <img src={getImageUrl(imgUrl)} alt={`Existing product ${idx}`} />
                <button
                  type="button"
                  className="preview-remove-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveExisting(idx);
                  }}
                  title="Remove image"
                >
                  <X size={14} />
                </button>
              </div>
            ))}

            {/* Newly selected file previews */}
            {newFiles.map((file, idx) => (
              <div key={`new-${idx}`} className="preview-thumb">
                <img src={URL.createObjectURL(file)} alt={`New product ${idx}`} />
                <button
                  type="button"
                  className="preview-remove-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveNew(idx);
                  }}
                  title="Remove image"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
