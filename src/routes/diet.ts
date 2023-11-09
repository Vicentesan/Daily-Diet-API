import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { db } from '../db'
import { checkUser } from '../middlewares/check-user'

export async function dietRoutes(app: FastifyInstance) {
  app.post('/user', async (req, res) => {
    if (!req.body) return res.status(400).send()

    const createUserBodySchema = z.object({
      firstName: z.string(),
      lastName: z.string(),
      email: z.string(),
      image: z.string().optional(),
    })

    const { firstName, lastName, email, image } = createUserBodySchema.parse(
      req.body,
    )

    const userValidation = await db.user.findFirst({
      where: {
        email,
      },
    })

    if (userValidation) {
      return res.status(409).send({ message: 'This email is already used' })
    }

    try {
      const newUser = await db.user.create({
        data: {
          firstName,
          lastName,
          email,
          image,
        },
      })

      return { newUser }
    } catch (error) {
      return res.status(500).send(error)
    }
  })

  app.post(
    '/meal',
    {
      preHandler: [checkUser],
    },
    async (req, res) => {
      if (!req.body) return res.status(400).send()

      const createMealBodySchema = z.object({
        title: z.string(),
        description: z.string().optional(),
        date: z.string(),
        time: z.string(),
        onDiet: z.boolean(),
      })

      const userId = req.headers.authorization

      try {
        const { title, description, date, time, onDiet } =
          createMealBodySchema.parse(req.body)

        const newMeal = await db.meal.create({
          data: {
            title,
            description,
            date,
            time,
            onDiet,
            userId,
          },
        })

        return { newMeal }
      } catch (error) {
        return res
          .status(500)
          .send('There was an error processing your request.')
      }
    },
  )

  app.put(
    '/meal/:id',
    {
      preHandler: [checkUser],
    },
    async (req, res) => {
      if (!req.body) return res.status(400).send()

      const updateMealBodySchema = z.object({
        title: z.string().optional(),
        description: z.string().optional(),
        date: z.string().optional(),
        time: z.string().optional(),
        onDiet: z.boolean().optional(),
      })
      const updateMealParamsSchema = z.object({
        id: z.string().uuid(),
      })

      const userId = req.headers.authorization
      const { id } = updateMealParamsSchema.parse(req.params)

      const { title, description, date, time, onDiet } =
        updateMealBodySchema.parse(req.body)

      const mealValidation = await db.meal.findFirst({
        where: {
          id,
        },
      })

      if (!mealValidation || mealValidation === null) {
        return res
          .status(404)
          .send('Meal not found or does not belong to the specified user.')
      }

      try {
        const updatedMeal = await db.meal.update({
          where: {
            id,
            userId,
          },
          data: {
            title,
            description,
            date,
            time,
            onDiet,
            userId,
          },
        })

        return { updatedMeal }
      } catch (error) {
        return res
          .status(500)
          .send('There was an error processing your request.')
      }
    },
  )

  app.delete(
    '/meal/:id',
    {
      preHandler: [checkUser],
    },
    async (req, res) => {
      if (!req.body) return res.status(400).send()

      const deleteMealParamsSchema = z.object({
        id: z.string().uuid(),
      })

      try {
        const userId = req.headers.authorization
        const { id } = deleteMealParamsSchema.parse(req.params)

        await db.meal.delete({
          where: {
            id,
            userId,
          },
        })

        res.send()
      } catch (error) {
        return res
          .status(500)
          .send('There was an error processing your request.')
      }
    },
  )

  app.get(
    '/meal',
    {
      preHandler: [checkUser],
    },
    async (req, res) => {
      const userId = req.headers.authorization

      try {
        const meal = await db.meal.findMany({
          where: {
            userId,
          },
        })

        return { meal }
      } catch (error) {
        return res
          .status(500)
          .send('There was an error processing your request.')
      }
    },
  )

  app.get(
    '/meal/:id',
    {
      preHandler: [checkUser],
    },
    async (req, res) => {
      const userId = req.headers.authorization
      const getMealParamsSchema = z.object({
        id: z.string().uuid(),
      })

      const { id } = getMealParamsSchema.parse(req.params)

      try {
        const meal = await db.meal.findMany({
          where: {
            userId,
            id,
          },
        })

        return { meal }
      } catch (error) {
        return res
          .status(500)
          .send('There was an error processing your request.')
      }
    },
  )

  app.get(
    '/summary',
    {
      preHandler: [checkUser],
    },
    async (req, res) => {
      const userId = req.headers.authorization

      const totalMeals = await db.meal.count({
        where: {
          userId,
        },
      })

      if (!totalMeals || totalMeals === 0)
        return res.status(404).send('No meals found')

      const totalMealsIn = await db.meal.count({
        where: {
          userId,
          onDiet: true,
        },
      })

      const totalMealsOut = await db.meal.count({
        where: {
          userId,
          onDiet: false,
        },
      })

      const mealsInPercent = (100 * totalMealsIn) / totalMeals
      const roundedMealsInPercent = mealsInPercent.toFixed(2)

      return {
        summary: {
          totalMeals,
          totalMealsIn,
          totalMealsOut,
          roundedMealsInPercent,
        },
      }
    },
  )
}
