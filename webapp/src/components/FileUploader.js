import React from 'react';

function FileUploader({ onFileSelect }) {
  const handleFileInput = (e) => {
    const file = e.target.files[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <div>
      <input type="file" onChange={handleFileInput} accept=".pdf" />
    </div>
  );
}

export default FileUploader;
