import * as v from 'valibot';

export const LoginSchema = v.object({
  email: v.pipe(
    v.string(),
    v.trim(),
    v.nonEmpty('Email is required'),
    v.email('Invalid email address'),
  ),
  password: v.pipe(
    v.string(),
    v.nonEmpty('Password is required'),
  ),
});

export type LoginInput = v.InferOutput<typeof LoginSchema>;
export type LoginErrors = v.FlatErrors<typeof LoginSchema>['nested'];
