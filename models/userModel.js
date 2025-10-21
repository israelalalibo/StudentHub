import supabase from '../public/config/supabaseClient.js'

export const createUser = async (email, password) => {
  return await supabase.auth.signUp({ email, password })
}

export const loginUser = async (email, password) => {
  return await supabase.auth.signInWithPassword({ email, password })
}

export const getUserFromToken = async (token) => {
  return await supabase.auth.getUser(token)
}

//export const 