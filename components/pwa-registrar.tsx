"use client"

import { useEffect } from "react"
import { registerServiceWorker } from "@/lib/notifications"

export function PwaRegistrar() {
  useEffect(() => {
    registerServiceWorker()
  }, [])

  return null
}
