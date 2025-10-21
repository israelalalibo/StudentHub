import * as UserModel from '../models/userModel.js'

export const signup = async (req, res) => {
  const { email, password } = req.body
  const { data, error } = await UserModel.createUser(email, password)

  if (error) return res.status(400).json({ error: error.message })
  res.json({ message: "User created!", user: data.user })
}

export const login = async (req, res) => {
  const { email, password } = req.body
  const { data, error } = await UserModel.loginUser(email, password)

  if (error) return res.status(400).json({ error: error.message })
  res.json({ message: "Login successful", session: data.session })
}

export const profile = async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'No token provided' })

  const { data, error } = await UserModel.getUserFromToken(token)
  if (error) return res.status(401).json({ error: error.message })
  res.json({ user: data.user })
}
