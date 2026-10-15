'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NewBlogRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/blogs');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[300px] text-slate-400 text-sm">
      Loading Blog Editor...
    </div>
  );
}
