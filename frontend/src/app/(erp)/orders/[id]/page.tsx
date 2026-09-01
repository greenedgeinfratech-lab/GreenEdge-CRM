'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function OrderEditRedirect() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  useEffect(() => {
    if (id) {
      router.replace(`/orders/new?id=${id}`);
    }
  }, [id, router]);

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <p className="text-gray-400 text-sm">Loading order…</p>
    </div>
  );
}