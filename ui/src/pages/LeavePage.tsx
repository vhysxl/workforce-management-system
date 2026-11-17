import { useState, type FormEvent } from 'react';
import Button from '../components/Button';
import ErrorAlert from '../components/ErrorAlert';
import Input from '../components/Input';
import { requestAttendance, type Attendance } from '../lib/attendance';

interface LeavePageProps {
  attendance: Attendance | null;
  onSaved: (attendance: Attendance | null) => void;
  onBack: () => void;
}

export default function LeavePage({ attendance, onSaved, onBack }: LeavePageProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const body = new FormData(event.currentTarget);

    setIsLoading(true);
    setError(null);
    requestAttendance('/leave', { method: 'POST', body })
      .then(onSaved)
      .catch((error) => setError(error.message))
      .finally(() => setIsLoading(false));
  };

  if (attendance) {
    return (
      <div className="space-y-4">
        <p role="status">Your leave has been recorded for today.</p>
        <p className="text-sm text-supporting whitespace-pre-wrap">{attendance.detail}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" aria-busy={isLoading}>
      <button
        type="button"
        onClick={onBack}
        disabled={isLoading}
        className="text-sm text-supporting hover:text-secondary cursor-pointer disabled:opacity-50"
      >
        Back
      </button>

      <ErrorAlert error={error} onDismiss={() => setError(null)} />

      <fieldset disabled={isLoading} className="space-y-4">
        <div>
          <label htmlFor="leave-type" className="block text-sm font-medium mb-1.5">Leave type</label>
          <select
            id="leave-type"
            name="type"
            defaultValue="sick"
            className="w-full px-4 py-2.5 rounded-lg border-r-2 border-transparent bg-supporting-2 text-secondary focus:outline-none focus:ring-1 focus:ring-tertiary"
          >
            <option value="sick">Sick leave</option>
            <option value="personal">Personal leave</option>
          </select>
        </div>

        <Input
          id="leave-image"
          name="image"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          label="Supporting image"
          required
          aria-describedby="leave-image-help"
        />
        <p id="leave-image-help" className="text-xs text-supporting">JPG, PNG, or WebP. Up to 10 MB.</p>

        <div>
          <label htmlFor="leave-detail" className="block text-sm font-medium mb-1.5">Reason</label>
          <textarea
            id="leave-detail"
            name="detail"
            required
            maxLength={500}
            rows={4}
            className="w-full px-4 py-2.5 rounded-lg bg-supporting-2 text-secondary focus:outline-none focus:ring-1 focus:ring-tertiary"
          />
        </div>
      </fieldset>

      <Button type="submit" isLoading={isLoading} className="w-full rounded-full">Submit Leave</Button>
    </form>
  );
}
