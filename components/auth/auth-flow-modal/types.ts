export type AuthMode = "login" | "signup" | "forgot" | "reset" | "verify" | "change"

export interface AuthState {
  isLoading: boolean
  isGoogleLoading: boolean
  error: string | null
  message: string | null
}

export interface LoginState {
  email: string
  password: string
  rememberMe: boolean
}

export interface SignupState {
  email: string
  password: string
  agree: boolean
}

export interface ResetState {
  newPassword: string
  confirmPassword: string
  showPassword: boolean
}

export interface ForgotState {
  email: string
}
