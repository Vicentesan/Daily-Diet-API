import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { db } from '../db'

export async function checkUser(req: FastifyRequest, res: FastifyReply) {
  const userId = req.headers.authorization

  if (!userId) return res.status(400).send('No userId received')

  try {
    await db.user.findFirst({
      where: {
        id: userId,
      },
    })

    console.log(userId)
  } catch (error) {
    return res.status(401).send('No userId received')
  }
}
