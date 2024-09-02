import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { Hono } from "hono";
import { sign } from "hono/jwt";
import { signinInput, signupInput } from "@yashsrivastava/medium-commons-1";

export const userRouter = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
  };
}>();

userRouter.post("/api/v1/user/signup", async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());
  const body = await c.req.json();
  const { success } = signupInput.safeParse(body);
  if (!success) return c.json({ success: false, msg: "Invalid Input" }, 411);
  const { email, password, firstName, lastName } = body;
  try {
    const user = await prisma.user.create({
      data: {
        email,
        password,
        firstName,
        lastName,
      },
    });
    const jwtToken = await sign({ id: user.id }, c.env.JWT_SECRET);

    return c.json({ jwtToken });
  } catch (err) {
    return c.json({ success: false, msg: "Error While signing up" }, 400);
  }
});

userRouter.post("/api/v1/user/signin", async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());
  const body = await c.req.json();
  const { success } = signinInput.safeParse(body);
  if (!success) return c.json({ success: false, msg: "Invalid Input" }, 411);
  const { email, password } = body;
  const user = await prisma.user.findUnique({
    where: {
      email: email,
    },
    select: {
      id: true,
      email: true,
      password: true,
    },
  });
  if (!user) {
    return c.json({ sucess: false, msg: "User Does not exit" }, 403);
  }
  if (user.password !== password)
    return c.json(
      { success: false, msg: "Username or password seems to be wrong" },
      411
    );
  const jwtToken = await sign({ id: user.id }, c.env.JWT_SECRET);
  return c.json({ jwtToken }, 200);
});
