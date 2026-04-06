import React from 'react';
import { Camera, FileText, Image, Upload } from 'lucide-react';

const iconMap = {
  upload: Upload,
  image: Image,
  document: FileText,
  camera: Camera
};

const UploadDropzone = ({
  icon = 'upload',
  title,
  description,
  helperItems = [],
  accept,
  capture,
  onChange,
  disabled = false
}) => {
  const Icon = iconMap[icon] || Upload;

  return (
    <label className={`upload-dropzone ${disabled ? 'disabled' : ''}`}>
      <input
        type="file"
        accept={accept}
        capture={capture}
        onChange={onChange}
        disabled={disabled}
      />
      <div className="upload-dropzone-icon">
        <Icon size={24} />
      </div>
      <strong>{title}</strong>
      <span>{description}</span>
      {helperItems.length > 0 && (
        <div className="upload-helper-row">
          {helperItems.map((item) => (
            <div key={item} className="upload-helper-chip">
              {item}
            </div>
          ))}
        </div>
      )}

      <style>{`
        .upload-dropzone {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 12px;
          padding: 22px;
          border-radius: 22px;
          border: 1px dashed color-mix(in srgb, var(--primary) 52%, var(--border-color));
          background:
            linear-gradient(180deg, color-mix(in srgb, var(--surface-soft) 78%, transparent), transparent 56%),
            var(--surface-muted);
          cursor: pointer;
          transition: transform 0.2s ease, border-color 0.2s ease, background 0.2s ease;
          text-align: left;
        }

        .upload-dropzone:hover {
          transform: translateY(-2px);
          border-color: color-mix(in srgb, var(--primary) 75%, var(--border-color));
          background:
            linear-gradient(180deg, color-mix(in srgb, var(--surface-soft) 95%, transparent), transparent 56%),
            color-mix(in srgb, var(--surface-muted) 82%, var(--surface-soft));
        }

        .upload-dropzone.disabled {
          opacity: 0.68;
          cursor: not-allowed;
          transform: none;
        }

        .upload-dropzone input {
          display: none;
        }

        .upload-dropzone-icon {
          width: 52px;
          height: 52px;
          border-radius: 16px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: var(--primary);
          background: var(--surface-strong);
          border: 1px solid var(--border-color);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
        }

        .upload-dropzone strong {
          color: var(--text-primary);
          font-size: 16px;
          line-height: 1.35;
        }

        .upload-dropzone span {
          color: var(--text-secondary);
          font-size: 14px;
          line-height: 1.65;
        }

        .upload-helper-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .upload-helper-chip {
          padding: 7px 11px;
          border-radius: 999px;
          background: var(--surface-strong);
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          font-size: 12px;
          font-weight: 700;
        }
      `}</style>
    </label>
  );
};

export default UploadDropzone;
