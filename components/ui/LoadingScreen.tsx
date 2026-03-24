import { Loader2 } from 'lucide-react';

type LoadingScreenProps = {
  title: string;
  description?: string;
  fullScreen?: boolean;
};

export function LoadingScreen({
  title,
  description,
  fullScreen = true,
}: LoadingScreenProps) {
  return (
    <div
      className={`flex items-center justify-center bg-[var(--color-background)] px-6 ${
        fullScreen ? 'min-h-screen' : 'h-[80vh]'
      }`}
    >
      <div className="flex max-w-md flex-col items-center rounded-3xl border border-gray-200 bg-white px-8 py-10 text-center shadow-sm">
        <div className="mb-5 rounded-full bg-primary/10 p-4 text-primary">
          <Loader2 className="h-10 w-10 animate-spin" />
        </div>
        <h2 className="text-xl font-black tracking-tight text-primary">{title}</h2>
        <p className="mt-2 text-sm text-gray-500">
          {description ?? 'Espera un momento mientras terminamos de preparar la pantalla.'}
        </p>
      </div>
    </div>
  );
}
