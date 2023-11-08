import { FastifyInstance } from 'fastify'

export async function dietRoutes(app: FastifyInstance) {
  app.get('/hello', () => {
    return 'Hello World'
  })
}
