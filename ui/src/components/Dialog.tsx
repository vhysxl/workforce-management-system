import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import Button from './Button';

interface DialogProps {
  title: string;
  isBusy: boolean;
  onClose: () => void;
  children: ReactNode;
}

export default function Dialog({ title, isBusy, onClose, children }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current!;
    dialog.showModal();
    return () => dialog.close();
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby="dialog-title"
      onCancel={(event) => {
        event.preventDefault();
        if (!isBusy) onClose();
      }}
      className="m-auto w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-primary text-secondary p-6 border border-white/10 backdrop:bg-black/70"
    >
      <div className="flex items-center justify-between gap-4 mb-5">
        <h2 id="dialog-title" className="text-lg font-semibold">{title}</h2>
        <Button type="button" variant="ghost" size="icon" onClick={onClose} disabled={isBusy} aria-label="Close dialog">
          <X className="w-4 h-4" />
        </Button>
      </div>
      {children}
    </dialog>
  );
}
