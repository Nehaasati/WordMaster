import React, { useState, useRef } from 'react'
import './Landingpage.css'
import type { ModalType, StarData, CreateModalProps, JoinModalProps } from '../interfaces/landing';

const Stars: React.FC = () => {
  const stars = useRef<StarData[]>([])