'use client';

import { useParams } from 'next/navigation';

export default function AthleteProgramDetailPage() {
  const params = useParams();
  const blockId = params?.id as string;
  const programId = params?.programId as string;

  return (
    <div className="p-6">
      <h1>Program {programId}</h1>
      <p>Block: {blockId}</p>
      <p>Athlete program detail page</p>
    </div>
  );
}
