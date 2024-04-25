import { z } from "zod";
export const UserSchema = z
  .object({
    username: z.string().min(1),
    firstname: z.string().min(1),
    lastname: z.string().optional(),
    password: z.string().min(8),
    confirmPassword: z.string().min(1),
  })
  .refine(({ password, confirmPassword }) => password === confirmPassword, {
    message: "Password do not match",
    path: ["confirmPassword"],
  });

export type TUserSchema = z.infer<typeof UserSchema>;
