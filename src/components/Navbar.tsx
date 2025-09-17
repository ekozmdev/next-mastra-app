import Link from "next/link"
import { getAuthSession } from "@/lib/auth"
import SignOutButton from "./SignOutButton"

export default async function Navbar() {
  const session = await getAuthSession()

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-gray-900">
              AI Chat App
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            {session?.user ? (
              <>
                <Link
                  href="/chat"
                  className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Chat
                </Link>
                <span className="text-gray-700 text-sm">
                  Welcome, {session.user.name || session.user.email}
                </span>
                <SignOutButton />
              </>
            ) : (
              <>
                <Link
                  href="/auth/signin"
                  className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm font-medium"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}