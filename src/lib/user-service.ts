import bcrypt from "bcryptjs";
import connectToDatabase from "./mongodb";
import User, { IUser } from "./models/User";
import { ConflictError, DatabaseError } from "./errors";

export async function createUser(userData: {
  name: string;
  email: string;
  password: string;
}): Promise<string> {
  try {
    await connectToDatabase();
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      throw new ConflictError("User already exists");
    }
    
    // Create new user (password will be hashed automatically by pre-save middleware)
    const user = new User({
      name: userData.name,
      email: userData.email,
      password: userData.password,
    });
    
    const savedUser = await user.save();
    return savedUser._id.toString();
  } catch (error) {
    if (error instanceof ConflictError) {
      throw error;
    }
    console.error("Database error in createUser:", error);
    throw new DatabaseError("Failed to create user");
  }
}

export async function getUserByEmail(email: string): Promise<IUser | null> {
  try {
    await connectToDatabase();
    return await User.findOne({ email });
  } catch (error) {
    console.error("Database error in getUserByEmail:", error);
    throw new DatabaseError("Failed to retrieve user by email");
  }
}

export async function getUserById(id: string): Promise<IUser | null> {
  try {
    await connectToDatabase();
    return await User.findById(id);
  } catch (error) {
    console.error("Database error in getUserById:", error);
    throw new DatabaseError("Failed to retrieve user by ID");
  }
}

export async function verifyPassword(plainPassword: string, user: IUser): Promise<boolean> {
  try {
    return await user.comparePassword(plainPassword);
  } catch (error) {
    console.error("Error verifying password:", error);
    throw new DatabaseError("Failed to verify password");
  }
}

// Alternative function for direct password comparison (backward compatibility)
export async function verifyPasswordDirect(plainPassword: string, hashedPassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(plainPassword, hashedPassword);
  } catch (error) {
    console.error("Error in direct password verification:", error);
    throw new DatabaseError("Failed to verify password");
  }
}
