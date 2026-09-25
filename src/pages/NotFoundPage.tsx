import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground mb-4">
        <Compass className="h-7 w-7" />
      </div>
      <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">
        Page Not Found
      </h1>
      <p className="text-sm text-muted-foreground max-w-sm mb-6 leading-relaxed">
        The page you are looking for doesn't exist or has been moved.
      </p>
      <Button onClick={() => navigate('/')} className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        Return to Dashboard
      </Button>
    </div>
  );
}
