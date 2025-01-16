export interface Password {
  _id: string
  title: string
  username?: string
  encryptedData: string
  iv: string
  salt: string
  url?: string
  notes?: string
  lastCopied?: string
  priorityLevel: 'low' | 'medium' | 'high'
  createdAt: string
  updatedAt: string
  requiresTotp?: boolean
  decryptedPassword?: string
}

export interface TotpDialogState {
  isOpen: boolean
  passwordId: string | null
  action: 'view' | 'delete' | null
}