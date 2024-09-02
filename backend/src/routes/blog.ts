import { Hono } from "hono";
import { PrismaClient } from "@prisma/client/edge";
import { verify } from "hono/jwt";
import { withAccelerate } from "@prisma/extension-accelerate";
import {
  createPostInput,
  updatePostInput,
} from "@yashsrivastava/medium-commons-1";

export const blogRouter = new Hono<{
  //These are the environment varibles which you want typescript compiler to know that they exist in Context 'c.env'
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
  };
  //These are the varibles which you want typescript compiler to know that they exist in Context 'c'
  Variables: {
    userId: number | undefined;
  };
}>();

blogRouter.use("/*", async (c, next) => {
  const jwt = c.req.header("Authorization");
  if (!jwt) return c.json({ success: false, msg: "Unauthorized" }, 401);
  const token = jwt?.split(" ")[1];
  const decodedToken = await verify(token, c.env.JWT_SECRET);
  if (!decodedToken)
    return c.json({ success: false, msg: "Unauthorized" }, 401);
  c.set("userId", decodedToken.id as number | undefined);
  await next();
});

blogRouter.post("/create", async (c) => {
  try {
    const body = await c.req.json();
    const userId = c.get("userId");
    const { success } = createPostInput.safeParse(body);
    if (!success) return c.json({ success: false, msg: "Invalid Input" }, 411);
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());
    const post = await prisma.post.create({
      data: {
        title: body.title,
        content: body.content,
        authorId: userId,
      },
    });
    return c.json(
      { success: true, msg: "Post Created Successfully", id: post.id },
      200
    );
  } catch (e: any) {
    return c.json(
      { success: false, msg: "Error while creating post", error: e.message },
      400
    );
  }
});

blogRouter.get("/post/:id", async (c) => {
  try {
    const { id } = c.req.param();
    const userId = c.get("userId");
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());
    const getPostById = await prisma.post.findUnique({
      where: {
        id: parseInt(id),
        authorId: userId,
      },
    });
    if (!getPostById)
      return c.json({ success: false, msg: "No Post found" }, 400);
    return c.json(
      { success: true, msg: "Post found successfully", getPostById },
      200
    );
  } catch (e) {
    return c.json({ success: false, msg: "No Post found" }, 400);
  }
});

//Add pagination
blogRouter.get("/bulk", async (c) => {
  try {
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());
    const allPost = await prisma.post.findMany();
    return c.json(
      { success: true, msg: "Posts found successfully", allPost },
      200
    );
  } catch (e: any) {
    return c.json(
      { success: false, msg: "Posts not found", error: e.message },
      400
    );
  }
});

blogRouter.put("/update", async (c) => {
  try {
    const body = await c.req.json();
    const userId = c.get("userId");
    const { success } = updatePostInput.safeParse(body);
    if (!success) return c.json({ success: false, msg: "Invalid Input" }, 411);
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());
    await prisma.post.update({
      where: {
        authorId: userId,
        id: body.id,
      },
      data: {
        title: body.title,
        content: body.content,
        published: body.published,
      },
    });
    return c.json({ success: true, msg: "Post updated successfully" }, 200);
  } catch (e) {
    return c.json({ success: false, msg: "Error while updating post" }, 400);
  }
});
