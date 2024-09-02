import z from "zod"

//types variable to be used in the backend
export const signupInput = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    firstName: z.string(),
    lastName: z.string()
})

export const signinInput = z.object({
    email: z.string().email(),
    password: z.string().min(8)
})

export const createPostInput = z.object({
    title: z.string(),
    content: z.string(),
})

export const updatePostInput = z.object({
    title: z.string(),
    content: z.string(),
    id:z.number()
})

//Types to be used in the frontend
export type SignupInput = z.infer<typeof signupInput>
export type SigninInput = z.infer<typeof signinInput>
export type CreatePostInput = z.infer<typeof createPostInput>
export type UpdatePostInput = z.infer<typeof updatePostInput>