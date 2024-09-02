import { Hono } from 'hono'
import { PrismaClient } from "@prisma/client/edge"
import { withAccelerate } from '@prisma/extension-accelerate'
import { sign, verify } from "hono/jwt"
import { userRouter } from './routes/users';
import { blogRouter } from './routes/blog';


const app = new Hono<{
  Bindings: {
  DATABASE_URL:string,
  JWT_SECRET: string,
  },
  Variables: {
   userId:number|undefined
    prisma:any
  }
}>();

//If you want, you can extract the prisma variable in a global middleware that set’s it on 
//the context variable

app.use("*", async (c,next) => {
  const prisma = new PrismaClient({
    datasourceUrl:c.env?.DATABASE_URL
  }).$extends(withAccelerate())
  c.set("prisma", prisma)
  await next();
})


// app.get('/', (c) => {
//   return c.text('Hello Hono!')
// })

app.route("/api/v1/user", userRouter)
app.route("/api/v1/blog",blogRouter)






export default app

