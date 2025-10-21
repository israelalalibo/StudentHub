import express from 'express'
import { signup, login, profile } from '../controllers/authController.js'

const router = express.Router()

router.post('/signup', signup)
router.post('/login', login)
router.get('/profile', profile)

export default router
