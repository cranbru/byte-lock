"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Eye, EyeOff, AlertCircle, CheckCircle2, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import type { PasswordValidation } from "@/hooks/use-password-validation"

interface PasswordInputProps {
  id: string
  value: string
  onChange: (value: string) => void
  validation: PasswordValidation
  placeholder?: string
  className?: string
}

export function PasswordInput({ id, value, onChange, validation, placeholder = "Enter password", className }: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false)

  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case "strong":
        return "bg-green-500"
      case "medium":
        return "bg-yellow-500"
      default:
        return "bg-red-500"
    }
  }

  const getStrengthValue = (strength: string) => {
    switch (strength) {
      case "strong":
        return 100
      case "medium":
        return 60
      default:
        return 30
    }
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Input
          id={id}
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            "h-12 pr-12",
            validation.isValid && value.length > 0 && "border-green-500",
            !validation.isValid && value.length > 0 && "border-red-500",
            className
          )}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
      </div>

      {value.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">
              Password Strength: {validation.strength.charAt(0).toUpperCase() + validation.strength.slice(1)}
            </span>
            <div className="flex items-center gap-1">
              {validation.isValid ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
            </div>
          </div>
          <Progress value={getStrengthValue(validation.strength)} className="h-2" />
          <div
            className={cn("h-2 rounded-full", getStrengthColor(validation.strength))}
            style={{ width: `${getStrengthValue(validation.strength)}%` }}
          />
        </div>
      )}

      {validation.errors.length > 0 && value.length > 0 && (
        <Alert variant={validation.isValid ? "default" : "destructive"}>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {validation.errors.map((error, index) => (
                <li key={index} className="text-sm">
                  {error}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
