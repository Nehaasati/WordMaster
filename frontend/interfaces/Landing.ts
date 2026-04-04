export type ModalType = 'create' | 'join' | null;
export interface CreateModalProps {
  onClose: () => void;
  lobbyId?: string;
  inviteCode?: string;
}
 
export interface JoinModalProps {
  onClose: () => void
}
 