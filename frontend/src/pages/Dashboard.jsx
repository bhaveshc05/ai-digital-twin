import React from 'react';
import TopStruggles from "../components/TopStruggles";

export default function Dashboard({ currentStudentId = 1 }) {
  return (
    <div className="container py-4">
      <TopStruggles studentId={currentStudentId} />
    </div>
  );
}

