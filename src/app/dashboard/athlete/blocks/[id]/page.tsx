'use client';

import { useParams, useRouter } from 'next/navigation';

export default function AthleteBlockDetailPage() {
  const params = useParams();
  const router = useRouter();
  const blockId = params?.id as string;

  if (!blockId) {
    return <div>Block not found</div>;
  }

  return (
    <div className="p-6">
      <h1>Block {blockId}</h1>
      <p>Athlete block detail page</p>
    </div>
  );
}
