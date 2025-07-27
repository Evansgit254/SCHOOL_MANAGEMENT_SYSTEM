"use client";
import FinanceChart from '@/components/FinanceChart';
import Table from '@/components/Table';
import React, { useEffect, useState } from 'react';
import type { Class, ClassAssignmentRequest } from '@/lib/types';

const AdminClientPage = () => {
  const [requests, setRequests] = useState<ClassAssignmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<{ [id: number]: number }>({});

  useEffect(() => {
    const fetchRequests = async () => {
      setLoading(true);
      const res = await fetch('/api/class-assignment-request/all');
      const data = await res.json();
      setRequests(data.requests || []);
      setLoading(false);
    };
    const fetchClasses = async () => {
      const res = await fetch('/api/classes/all');
      const data = await res.json();
      setClasses(data.classes || []);
    };
    fetchRequests();
    fetchClasses();
  }, []);

  const handleAction = async (id: number, action: 'approve' | 'reject') => {
    const classId = selectedClass[id];
    if (action === 'approve' && !classId) {
      alert('Please select a class before approving.');
      return;
    }
    await fetch(`/api/class-assignment-request/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, classId }),
    });
    setRequests((prev) => prev.filter((r) => r.id !== id));
  };

  const columns = [
    { header: 'Student', accessor: 'student' },
    { header: 'Requested At', accessor: 'createdAt' },
    { header: 'Class', accessor: 'class' },
    { header: 'Actions', accessor: 'actions' },
  ];

  const renderRow = (item: ClassAssignmentRequest) => (
    <tr key={item.id}>
      <td>{item.student?.name} {item.student?.surname}</td>
      <td>{new Date(item.createdAt).toLocaleString()}</td>
      <td>
        <select
          className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm"
          value={selectedClass[item.id] || ''}
          onChange={e => setSelectedClass(s => ({ ...s, [item.id]: Number(e.target.value) }))}
        >
          <option value="">Select class</option>
          {classes.map((c) => (
            <option value={c.id} key={c.id}>{c.name}</option>
          ))}
        </select>
      </td>
      <td>
        <button className="bg-green-500 text-white px-2 py-1 rounded mr-2" onClick={() => handleAction(item.id, 'approve')}>Approve</button>
        <button className="bg-red-500 text-white px-2 py-1 rounded" onClick={() => handleAction(item.id, 'reject')}>Reject</button>
      </td>
    </tr>
  );

  return (
    <>
      {/* PLACEHOLDER: Server-rendered cards and charts should be rendered by the parent server component */}
      {/* Only client-side logic below */}
      {/* BOTTOM CHARTS */}
      <div className='w-full h-[500px]'>
        <FinanceChart/>
      </div>
      {/* CLASS ASSIGNMENT REQUESTS */}
      <div className='w-full bg-white rounded-md p-4 mt-8'>
        <h2 className='text-lg font-semibold mb-4'>Class Assignment Requests</h2>
        {loading ? (
          <div>Loading...</div>
        ) : requests.length === 0 ? (
          <div>No pending requests.</div>
        ) : (
          <Table columns={columns} renderRow={renderRow} data={requests} />
        )}
      </div>
    </>
  );
};

export default AdminClientPage; 