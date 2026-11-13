// Shapes of the data the API sends back.
export type ItemStatus = 'IN' | 'OUT' | 'RETIRED'

export interface Item {
  id: string
  name: string
  ownership: 'RENTAL' | 'MANDIR' | 'PERSONAL'
  type: string
  status: ItemStatus
}

export interface Person {
  id: number
  name: string
  team: 'VIDEO' | 'PHOTO'
}

export interface OpenGroup {
  person: { id: number; name: string }
  items: { id: string; name: string; checkedOutAt: string }[]
}

export interface AssistantReply {
  answer: string
  toolsUsed: string[]
}
