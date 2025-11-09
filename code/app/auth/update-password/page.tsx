import Image from 'next/image';
import { Suspense } from 'react';
import { UpdatePasswordClient } from './UpdatePasswordClient';
import { Loader2 } from 'lucide-react';

export default function UpdatePasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="mx-auto w-full max-w-md space-y-8 animate-in fade-in-50">
        <div className="flex justify-center mb-8">
          <Image src="/Studieo Logo/Full Logo.svg" alt="Studieo" width={160} height={32} priority />
        </div>
        
        <Suspense fallback={
          <div className="space-y-4 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        }>
          <UpdatePasswordClient />
        </Suspense>
      </div>
    </div>
  );
}
