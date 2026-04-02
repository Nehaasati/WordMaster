export type ModalType = 'create' | 'join' | null;
export interface StarData {
  id: number
  left: number
  top: number
  size: number
  d: string
  del: string
  min: string
}
export interface CreateModalProps {
  onClose: () => void
}
 
export interface JoinModalProps {
  onClose: () => void
}