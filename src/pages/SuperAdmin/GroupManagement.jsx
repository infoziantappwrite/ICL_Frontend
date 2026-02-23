<<<<<<< HEAD
// src/pages/SuperAdmin/GroupManagement.jsx
// Redirects to StudentManagement — backend has no /groups endpoints
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function GroupManagement() {
  const navigate = useNavigate();
  useEffect(() => { navigate('/dashboard/super-admin/students', { replace: true }); }, [navigate]);
  return null;
=======
// src/pages/SuperAdmin/GroupManagement.jsx
// Redirects to StudentManagement — backend has no /groups endpoints
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function GroupManagement() {
  const navigate = useNavigate();
  useEffect(() => { navigate('/dashboard/super-admin/students', { replace: true }); }, [navigate]);
  return null;
>>>>>>> sanjay
}