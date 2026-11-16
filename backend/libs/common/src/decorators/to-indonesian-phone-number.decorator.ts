import { Transform } from 'class-transformer';

export function ToIndonesianPhoneNumber() {
  return Transform(({ value }) =>
    typeof value === 'string' ? value.trim().replace(/^0/, '+62') : value,
  );
}
