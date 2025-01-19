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
  groupId?: string | null;
  tags?: string[]; 
  decryptedPassword?: string
}

export interface TotpDialogState {
  isOpen: boolean
  passwordId: string | null
  action: 'view' | 'delete' | null
}

export interface Tag {
  _id: string;
  name: string;
  color: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Group {
  _id: string;
  name: string;
  description?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}