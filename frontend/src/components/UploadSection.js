import React from 'react';
import axios from 'axios';

function UploadSection({ onCsvUpload }) {

  const handleCsvUpload = async (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'text/csv') {
      const formData = new FormData();
      formData.append('csv', file);

      try {
        // Post request to upload the CSV file
        const response = await axios.post('http://127.0.0.1:5000/upload', formData, {
          responseType: 'blob', // Expecting a binary response for the video
        });

        // Check if the response is a valid file
        if (response.status === 200) {
          const contentDisposition = response.headers['content-disposition'];
          const filename = contentDisposition 
            ? contentDisposition.split('filename=')[1]?.replace(/"/g, '') 
            : 'processed_video.mp4';

          // Create a Blob URL for the video file
          const url = window.URL.createObjectURL(new Blob([response.data]));
          
          // Set the Blob URL as the video player's source
          const videoPlayer = document.querySelector('video');
          if (videoPlayer) {
            videoPlayer.src = url;
            videoPlayer.load();
          }

          alert('CSV file processed successfully. Video updated.');
          onCsvUpload(file); // Pass CSV file to parent component (optional)
        } else {
          alert('Error processing the CSV file.');
        }
      } catch (error) {
        console.error('CSV upload error:', error.response || error);
        alert(`Error uploading CSV file: ${error.response ? error.response.data : error.message}`);
      }
    } else {
      alert('Please upload a valid CSV file.');
    }
  };

  return (
    <div className="upload-section">
      <label htmlFor="csv-upload" className="upload-btn">Upload CSV</label>
      <input
        id="csv-upload"
        type="file"
        accept=".csv"
        style={{ display: 'none' }}
        onChange={handleCsvUpload}
      />
    </div>
  );
}

export default UploadSection;
