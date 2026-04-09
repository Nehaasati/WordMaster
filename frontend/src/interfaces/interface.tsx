// frontend/src/interfaces/interface.tsx

export interface CharacterAbility {
  type: string;
  bonusPoints: number;
  thresholdLength?: number;
  thresholdSeconds?: number;
  effectDescription: string;
}

export interface Character {
  id: string;          // backend ID: "ugglan", "leopard", "musen", "björnen"
  name: string;
  description: string;
  ability: CharacterAbility;
  image: string;       // local image path — added on the frontend side
}