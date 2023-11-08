import fastify from 'fastify'
import { dietRoutes } from './routes/diet'

const app = fastify()

app.register(dietRoutes)

app
  .listen({
    port: 3333,
  })
  .then(() => console.log('HTTP Server is running'))
