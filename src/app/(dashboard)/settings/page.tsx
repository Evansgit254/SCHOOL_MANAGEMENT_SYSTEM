'use client';
import React, { useState } from 'react';
import { toast } from 'react-toastify';

const SettingsPage = () => {
  const [schools, setSchools] = useState<{ id: string; name: string }[]>([]);
  const [newSchoolName, setNewSchoolName] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentSchoolId, setCurrentSchoolId] = useState('');

  React.useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    try {
      const res = await fetch('/api/schools');
      if (res.ok) {
        const data = await res.json();
        setSchools(data.schools || []);
      }
    } catch (error) {
      console.error('Error fetching schools:', error);
    }
  };

  const handleCreateSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchoolName.trim()) {
      toast.error('School name is required');
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch('/api/schools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newSchoolName }),
      });
      
      if (res.ok) {
        toast.success('School created successfully!');
        setNewSchoolName('');
        await fetchSchools();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to create school');
      }
    } catch (error) {
      toast.error('An error occurred while creating school');
    } finally {
      setLoading(false);
    }
  };

  const handleSetActiveSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSchoolId) {
      toast.error('Please select a school');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/schools', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schoolId: currentSchoolId }),
      });

      if (res.ok) {
        toast.success('Active school updated! Refreshing...');
        setTimeout(() => window.location.reload(), 1000);
      } else {
        toast.error('Failed to set active school');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg m-4">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      {process.env.NEXT_PUBLIC_MULTI_TENANT === 'true' || true ? (
        <div className="space-y-6">
          {/* Create School Section */}
          <div className="border-b pb-6">
            <h2 className="text-lg font-semibold mb-4">Create New School</h2>
            <form onSubmit={handleCreateSchool} className="flex items-center gap-3">
              <input
                type="text"
                value={newSchoolName}
                onChange={(e) => setNewSchoolName(e.target.value)}
                placeholder="Enter school name"
                className="flex-1 p-2 border ring-1 ring-gray-300 rounded-md focus:ring-blue-500 focus:outline-none"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create School'}
              </button>
            </form>
          </div>

          {/* Set Active School Section */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Set Active School</h2>
            <p className="text-sm text-gray-600 mb-3">
              Select which school context you want to work in. All data will be scoped to the selected school.
            </p>
            <form onSubmit={handleSetActiveSchool} className="flex items-center gap-3">
              <select
                value={currentSchoolId}
                onChange={(e) => setCurrentSchoolId(e.target.value)}
                className="flex-1 p-2 border ring-1 ring-gray-300 rounded-md focus:ring-blue-500 focus:outline-none"
                disabled={loading}
              >
                <option value="">-- Select a school --</option>
                {schools.map((school) => (
                  <option key={school.id} value={school.id}>
                    {school.name}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                disabled={loading || !currentSchoolId}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Setting...' : 'Set Active'}
              </button>
            </form>
          </div>

          {/* Schools List */}
          {schools.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Available Schools</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {schools.map((school) => (
                  <div
                    key={school.id}
                    className="p-4 border rounded-lg hover:bg-gray-50 transition"
                  >
                    <p className="font-medium">{school.name}</p>
                    <p className="text-xs text-gray-500 mt-1">ID: {school.id}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="text-gray-600">Multi-tenant mode is disabled. Enable MULTI_TENANT in environment variables to manage schools.</p>
      )}
    </div>
  );
};

export default SettingsPage;

