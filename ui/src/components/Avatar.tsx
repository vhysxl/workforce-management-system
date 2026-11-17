import { User } from 'lucide-react';

interface AvatarProps {
  className?: string;
}

export default function Avatar({ className = 'w-9 h-9' }: AvatarProps) {
  return (
    <div
      className={`rounded-full bg-secondary text-primary flex items-center justify-center flex-shrink-0 ${className}`}
    >
      <User className="w-1/2 h-1/2" />
    </div>
  );
}
