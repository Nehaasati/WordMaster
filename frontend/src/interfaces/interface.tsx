export interface CharacterAbility {
  type: string;
  bonusPoints: number;
  thresholdLength?: number;
  thresholdSeconds?: number;
  effectDescription: string;
}

export interface Character {
  id: string;
  name: string;
  description: string;
  ability: CharacterAbility;
  image: string;
}