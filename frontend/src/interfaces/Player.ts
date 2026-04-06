export default interface Player {
  id: string;
  name: string;
  isHost: boolean;
  isReady?: boolean;
}