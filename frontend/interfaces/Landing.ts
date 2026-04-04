export type ModalType = 'create' | 'join' | null;
export interface CreateModalProps {
  onClose: () => void;
  lobbyId?: string;
}
 
export interface JoinModalProps {
  onClose: () => void
}
 