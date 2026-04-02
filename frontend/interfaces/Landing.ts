export type ModalType = 'create' | 'join' | null;
export interface CreateModalProps {
  onClose: () => void
}
 
export interface JoinModalProps {
  onClose: () => void
}
 