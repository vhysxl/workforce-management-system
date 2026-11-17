import { AlertCircle, X } from 'lucide-react';

interface ErrorAlertProps {
  error: string | string[] | null;
  onDismiss: () => void;
}

export default function ErrorAlert({ error, onDismiss }: ErrorAlertProps) {
  if (!error) return null;

  return (
    <div role="alert" className="flex items-start justify-between gap-2.5 bg-red-600 text-white rounded-lg p-3 text-xs leading-relaxed shadow-sm">
      <div className="flex items-start gap-2">
        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <p className="whitespace-pre-line">
          <strong className="font-bold">Error!</strong> {Array.isArray(error) ? error.join('\n') : error}
        </p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="text-white/80 hover:text-white transition flex-shrink-0 cursor-pointer"
        aria-label="Dismiss error"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
