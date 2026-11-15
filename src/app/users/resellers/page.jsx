'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ResellersRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/users?role=retailer');
  }, [router]);

  return (
    <div className="p-12 text-center text-xs text-slate-500">
      Redirecting to Users & Customers page...
    </div>
  );
}
