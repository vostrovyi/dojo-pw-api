import * as z from "zod";

export const UserSchema = z.array(
    z.object({
        id: z.number().int(),
        email: z.email(),
        password: z.string().min(4, "Password must be at least 4 characters long"),
        name: z.string().trim().min(2, "Name must be at least 2 characters long"),
        role: z.string(),
        avatar: z.url(),
        creationAt: z.string(),
        updatedAt: z.string(),
  }
));