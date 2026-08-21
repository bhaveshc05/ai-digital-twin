import React, { useContext } from 'react';
import TopStruggles from "../components/TopStruggles";
import { AuthContext } from "../context/AuthContext";

export default function Dashboard() {
  const { user } = useContext(AuthContext);

  if (!user) {
    return <div className="container py-4 text-light">Please log in to view your dashboard.</div>;
  }

  return (
    <div className="container py-4">
      <TopStruggles studentId={user.student_id} />
    </div>
  );
}

