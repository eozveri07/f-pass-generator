export interface Password {
  _id: string
  title: string
  username?: string
  password: string
  url?: string
  notes?: string
  lastCopied?: string
  priorityLevel: 'low' | 'medium' | 'high'
  createdAt: string
  updatedAt: string
  requiresTotp?: boolean
}

export interface TotpDialogState {
  isOpen: boolean
  passwordId: string | null
}