import { formatDate } from '../lib/date';

const calendarColors = {
  blue: 'bg-blue-500/20 text-blue-300',
  orange: 'bg-orange-500/20 text-orange-300',
  red: 'bg-red-500/20 text-red-300',
  yellow: 'bg-yellow-500/20 text-yellow-300',
};

export interface CalendarMarker {
  label: string;
  color: keyof typeof calendarColors;
}

interface CalendarProps {
  year: number;
  month: number;
  today: string;
  markers: Record<string, CalendarMarker>;
  legend?: CalendarMarker[];
  onDateSelect: (date: string) => void;
}

const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function Calendar({ year, month, today, markers, legend = [], onDateSelect }: CalendarProps) {
  const firstDay = new Date(Date.UTC(year, month - 1, 1));
  const monthName = firstDay.toLocaleDateString('en-US', { month: 'long', timeZone: 'UTC' });
  const dates = Array.from({ length: 42 }, (_, index) => {
    return new Date(Date.UTC(year, month - 1, index - firstDay.getUTCDay() + 1));
  });

  return (
    <div className="w-full max-w-xs">
      <h3 className="text-sm font-medium mb-4">{monthName} {year}</h3>
      <div className="grid grid-cols-7 gap-y-1 text-center text-xs">
        {weekdays.map((day) => (
          <abbr key={day} title={day} className="no-underline text-supporting pb-2">{day[0]}</abbr>
        ))}
        {dates.map((date) => {
          const key = date.toISOString().slice(0, 10);
          if (date.getUTCMonth() !== month - 1) {
            return <span key={key} className="h-9 flex items-center justify-center text-tertiary">{date.getUTCDate()}</span>;
          }
          const marker = markers[key];
          return (
            <button
              key={key}
              type="button"
              onClick={() => onDateSelect(key)}
              aria-label={`${formatDate(key)}${marker ? `, ${marker.label}` : ''}`}
              aria-current={key === today ? 'date' : undefined}
              title={marker?.label}
              className="h-9 flex items-center justify-center rounded-lg cursor-pointer hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-secondary"
            >
              <span className={`w-8 h-8 flex items-center justify-center rounded-full ${marker ? calendarColors[marker.color] : 'text-secondary'} ${key === today ? 'ring-1 ring-supporting' : ''}`}>
                {date.getUTCDate()}
              </span>
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-2 text-xs mt-5" aria-label="Calendar legend">
        {legend.map(({ label, color }) => (
          <span key={color} className={`rounded-full px-2.5 py-1 ${calendarColors[color]}`}>{label}</span>
        ))}
      </div>
    </div>
  );
}
