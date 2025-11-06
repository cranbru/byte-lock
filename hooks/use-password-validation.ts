"use client"

import { useState, useCallback, useMemo } from "react"

export interface PasswordValidation {
  isValid: boolean
  strength: "weak" | "medium" | "strong"
  errors: string[]
}

export function usePasswordValidation() {
  const [password, setPassword] = useState("")

  const validation = useMemo((): PasswordValidation => {
    const errors: string[] = []
    let strength: "weak" | "medium" | "strong" = "weak"

    if (password.length === 0) {
      return { isValid: false, strength: "weak", errors: ["Password is required"] }
    }

    if (password.length < 8) {
      errors.push("Password must be at least 8 characters long")
    }

    if (password.length < 12) {
      errors.push("Consider using at least 12 characters for better security")
    }

    if (!/[a-z]/.test(password)) {
      errors.push("Password should contain lowercase letters")
    }

    if (!/[A-Z]/.test(password)) {
      errors.push("Password should contain uppercase letters")
    }

    if (!/[0-9]/.test(password)) {
      errors.push("Password should contain numbers")
    }

    if (!/[^a-zA-Z0-9]/.test(password)) {
      errors.push("Password should contain special characters")
    }

    // Determine strength
    const hasLower = /[a-z]/.test(password)
    const hasUpper = /[A-Z]/.test(password)
    const hasNumber = /[0-9]/.test(password)
    const hasSpecial = /[^a-zA-Z0-9]/.test(password)
    const isLongEnough = password.length >= 12

    const criteriaCount = [hasLower, hasUpper, hasNumber, hasSpecial, isLongEnough].filter(Boolean).length

    if (criteriaCount >= 4 && password.length >= 12) {
      strength = "strong"
    } else if (criteriaCount >= 3 && password.length >= 8) {
      strength = "medium"
    }

    const isValid = password.length >= 8 && errors.filter((e) => e.includes("must")).length === 0

    return { isValid, strength, errors }
  }, [password])

  const updatePassword = useCallback((newPassword: string) => {
    setPassword(newPassword)
  }, [])

  const clearPassword = useCallback(() => {
    setPassword("")
  }, [])

  return {
    password,
    validation,
    updatePassword,
    clearPassword,
  }
}
