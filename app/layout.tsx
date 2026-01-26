import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { AuthProvider } from "@/contexts/auth-context"
import { Toaster } from "@/components/ui/toaster"
import "./globals.css"
import { Suspense } from "react"
import { ReduxProvider } from "@/app/redux-provider"

export const metadata: Metadata = {
  title: "Travel Admin Panel",
  description: "Admin panel for travel booking platform",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <Suspense fallback={<div>Loading...</div>}>
          <ReduxProvider>
            <AuthProvider>
              {children}
              <Toaster />
            </AuthProvider>
          </ReduxProvider>
        </Suspense>

        <Analytics />
      </body>
    </html>
  )
}
