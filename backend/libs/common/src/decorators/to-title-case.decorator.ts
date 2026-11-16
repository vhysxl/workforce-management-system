import { Transform } from 'class-transformer';

export function ToTitleCaseTrim() {
  return Transform(({ value }) => {
    if (typeof value !== 'string') {
      return value;
    }

    return value
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  });
}
