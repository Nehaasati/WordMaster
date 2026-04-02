import React, { useState, useRef } from 'react'
import './Landingpage.css'
import type { ModalType, StarData, CreateModalProps, JoinModalProps } from '../interfaces/landing';

const Stars: React.FC = () => {
    const stars = useRef<StarData[]>([])
if (!stars.current.length) {
    for (let i = 0; i < 60; i++) {
      const size = Math.random() * 2 + 0.5
      stars.current.push({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 40,
        size,
        d:   (2 + Math.random() * 4).toFixed(1) + 's',
        del: (Math.random() * 5).toFixed(1) + 's',
        min: (0.2 + Math.random() * 0.3).toFixed(2),
      })
    }
    }
 return (
    <div className="wm-stars" data-testid="stars">
      {stars.current.map((s) => (
        <div
          key={s.id}
          className="wm-star"
          style={{
            left:   s.left + '%',
            top:    s.top + '%',
            width:  s.size + 'px',
            height: s.size + 'px',
            ['--d'   as string]: s.d,
            ['--del' as string]: s.del,
            ['--min' as string]: s.min,
          } as React.CSSProperties}
        />
      ))}
    </div>
  )
};
