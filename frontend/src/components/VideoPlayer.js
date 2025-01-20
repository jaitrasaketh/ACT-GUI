import React, { useRef, useState, useEffect } from 'react';
import './VideoPlayer.css';
import axios from "axios";

function VideoPlayer({ csvFile }) {
  const [videoSrc, setVideoSrc] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showIdPopup, setShowIdPopup] = useState(false);
  const [csvUploaded, setCsvUploaded] = useState(false);
  const [currentId, setCurrentId] = useState("");
  const [newId, setNewId] = useState("");
  const [currentFrame, setCurrentFrame] = useState(0);
  const videoRef = useRef(null);
  const animationRef = useRef(null);

  const frameRate = 30;

  useEffect(() => {
    setCsvUploaded(!!csvFile); // Ensure csvUploaded is boolean
  }, [csvFile]);

  const handleVideoUpload = async (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('video/')) {
      const formData = new FormData();
      formData.append('video', file);

      try {
        const response = await axios.post('http://127.0.0.1:5000/upload-video', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        if (response.data.success) {
          setVideoSrc(URL.createObjectURL(file));
          alert('Video uploaded successfully.');
        } else {
          alert('Error uploading video.');
        }
      } catch (error) {
        console.error('Video upload error:', error);
        alert('Error uploading video.');
      }
    } else {
      alert('Please upload a valid video file.');
    }
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        cancelAnimationFrame(animationRef.current);
      } else {
        videoRef.current.play();
        requestFrameUpdate();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSliderChange = (event) => {
    const newProgress = event.target.value;
    setProgress(newProgress);
    if (videoRef.current) {
      videoRef.current.currentTime = (videoRef.current.duration * newProgress) / 100;
    }
  };

  const requestFrameUpdate = () => {
    if (videoRef.current && !videoRef.current.paused) {
      const currentFrame = Math.floor(videoRef.current.currentTime * frameRate);
      setCurrentFrame(currentFrame);
      const currentProgress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(currentProgress);
      animationRef.current = requestAnimationFrame(requestFrameUpdate);
    }
  };

  const handleEditId = () => {
    setShowIdPopup(true);
    if (videoRef.current) videoRef.current.pause();
    cancelAnimationFrame(animationRef.current);
    setIsPlaying(false);
  };

 

  const handleSaveId = async () => {
    try {
      const response = await axios.post('http://127.0.0.1:5000/update-id', {
        currentFrame: currentFrame,
        currentId: currentId,
        newId: newId,
      });
  
      if (response.data.success) {
        const newVideoUrl = `http://127.0.0.1:5000/temp/${response.data.new_video}`;
        setVideoSrc(newVideoUrl); // Update the video source
        alert("ID updated successfully and video reprocessed.");
      } else {
        alert("Failed to update ID and reprocess video.");
      }
    } catch (error) {
      console.error("Error updating ID:", error);
      alert("Error updating ID.");
    }
  
    setShowIdPopup(false);
    setCurrentId("");
    setNewId("");
    setIsPlaying(false);
  };
  

  useEffect(() => {
    return () => cancelAnimationFrame(animationRef.current);
  }, []);

  return (
    <div className="video-player">
      {!videoSrc && (
        <>
          <label htmlFor="video-upload" className="upload-btn">Upload Video</label>
          <input
            id="video-upload"
            type="file"
            accept="video/*"
            style={{ display: 'none' }}
            onChange={handleVideoUpload}
          />
        </>
      )}

      {videoSrc && (
        <div style={{ position: 'relative', width: '100%' }}>
          <video
            ref={videoRef}
            className="video-element"
            src={videoSrc}
            onEnded={() => setIsPlaying(false)}
            style={{ filter: showIdPopup ? 'brightness(0.8)' : 'none' }}
          />
          {showIdPopup && <div className="dimming-overlay" />}
        </div>
      )}

      {videoSrc && (
        <div className="controls">
          <button onClick={togglePlayPause}>
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          <input
            type="range"
            min="0"
            max="100"
            value={progress}
            onChange={handleSliderChange}
          />
          <span>Frame: {currentFrame}</span>
        </div>
      )}

      <div className="save-download">
        <button
          onClick={() => {
            if (csvUploaded) {
              handleEditId();
            } else {
              alert("Please upload a CSV file first to enable editing.");
            }
          }}
          disabled={!csvUploaded}
        >
          Edit ID
        </button>
      </div>

      {showIdPopup && (
        <div className="id-popup">
          <h3>Update ID</h3>
          <input
            type="text"
            placeholder="Current ID"
            value={currentId}
            onChange={(e) => setCurrentId(e.target.value)}
          />
          <input
            type="text"
            placeholder="New ID"
            value={newId}
            onChange={(e) => setNewId(e.target.value)}
          />
          <button onClick={handleSaveId}>Save ID</button>
          <button onClick={() => { setShowIdPopup(false); }}>Close</button>
        </div>
      )}
    </div>
  );
}

export default VideoPlayer;
