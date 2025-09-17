import { createUser } from "@/lib/user-service"
import { NextRequest } from "next/server"
import { 
  withErrorHandler, 
  validateRequired, 
  validateEmail, 
  validatePassword,
  ConflictError 
} from "@/lib/errors"

export const POST = withErrorHandler(async (req: NextRequest) => {
  const { name, email, password } = await req.json()
  
  // Validation
  validateRequired(name, 'Name')
  validateRequired(email, 'Email')
  validateRequired(password, 'Password')
  validateEmail(email)
  validatePassword(password)
  
  try {
    const userId = await createUser({ name, email, password })
    
    return Response.json(
      { message: "User created successfully", userId },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof Error && error.message === "User already exists") {
      throw new ConflictError("User already exists")
    }
    throw error
  }
})