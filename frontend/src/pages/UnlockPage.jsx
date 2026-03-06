import { useState } from 'react';
import SingleDropZone from '../components/SingleDropZone';
import { API_BASE } from '../api';

export default function UnlockPage() {
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState('');
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [error, setError] = useState(null);
  const [unlockedFile, setUnlockedFile] = useState(null);

  const handleFileAdded = (newFile) => {
    setFile(newFile);
    setUnlockedFile(null);
    setError(null);
  };

  const handleUnlock = async () => {
    if (!file) {
      setError('Please upload a password-protected PDF file');
      return;
    }

    if (!password) {
      setError('Please enter the password to unlock the PDF');
      return;
    }

    setIsUnlocking(true);
    setError(null);
    setUnlockedFile(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('password', password);

      const response = await fetch(`${API_BASE}/unlock`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to unlock PDF');
      }

      const blob = await response.blob();
      setUnlockedFile(blob);
    } catch (err) {
      if (err.name === 'TypeError') {
        setError('Unable to connect to the server. Please make sure the backend is running on http://localhost:8000');
      } else {
        setError(err.message);
      }
    } finally {
      setIsUnlocking(false);
    }
  };

  const handleDownload = () => {
    if (!unlockedFile) return;

    const url = window.URL.createObjectURL(unlockedFile);
    const a = document.createElement('a');
    a.href = url;
    a.download = `unlocked_${file.name}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <>
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          Unlock PDF
        </h1>
        <p className="text-gray-500">
          Remove password protection from your PDF file
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
        <SingleDropZone onFileAdded={handleFileAdded} file={file} />
      </div>

      {file && (
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password to unlock the PDF"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {unlockedFile && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>PDF unlocked successfully!</span>
          </div>
        </div>
      )}

      <button
        onClick={isUnlocking ? undefined : (unlockedFile ? handleDownload : handleUnlock)}
        disabled={isUnlocking || !file}
        className={`
          w-full py-4 px-6 rounded-xl font-semibold text-lg
          transition-all duration-200
          ${file
            ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }
          ${isUnlocking ? 'opacity-75' : ''}
        `}
      >
        {isUnlocking ? (
          <span className="flex items-center justify-center gap-3">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Unlocking PDF...
          </span>
        ) : unlockedFile ? (
          'Download Unlocked PDF'
        ) : (
          'Unlock PDF'
        )}
      </button>
    </>
  );
}
