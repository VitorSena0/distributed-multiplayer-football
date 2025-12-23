import React, { useEffect, useRef } from 'react';
import type { PlayerInput } from '../types';

interface MobileControlsProps {
  isMobile: boolean;
  onInputChange: (inputs: PlayerInput) => void;
}

export const MobileControls: React.FC<MobileControlsProps> = ({ isMobile, onInputChange }) => {
  const inputsRef = useRef<PlayerInput>({
    left: false,
    right: false,
    up: false,
    down: false,
    action: false,
  });

  useEffect(() => {
    if (!isMobile) return;

    const joystickBase = document.getElementById('joystick-base');
    const joystickThumb = document.getElementById('joystick-thumb');
    if (!joystickThumb || !joystickBase) return;

    let activeTouchId: number | string | null = null;
    const joystickRadius = 50;
    let centerPosition = { x: 0, y: 0 };

    const recalcCenter = () => {
      const rect = joystickBase.getBoundingClientRect();
      centerPosition = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    };
    recalcCenter();

    const updateJoystickPosition = (touch: { clientX: number; clientY: number }) => {
      const touchX = touch.clientX - centerPosition.x;
      const touchY = touch.clientY - centerPosition.y;

      const distance = Math.sqrt(touchX * touchX + touchY * touchY);
      const angle = Math.atan2(touchY, touchX);

      const limitedDistance = Math.min(distance, joystickRadius);
      const newX = Math.cos(angle) * limitedDistance;
      const newY = Math.sin(angle) * limitedDistance;

      joystickThumb.style.transform = `translate(${newX}px, ${newY}px)`;

      const deadZone = 0.2;
      const normalizedX = newX / joystickRadius;
      const normalizedY = newY / joystickRadius;

      inputsRef.current.left = normalizedX < -deadZone;
      inputsRef.current.right = normalizedX > deadZone;
      inputsRef.current.up = normalizedY < -deadZone;
      inputsRef.current.down = normalizedY > deadZone;
    };

    const resetJoystick = () => {
      joystickThumb.style.transform = 'translate(0, 0)';
      activeTouchId = null;
      inputsRef.current.left = false;
      inputsRef.current.right = false;
      inputsRef.current.up = false;
      inputsRef.current.down = false;
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (activeTouchId !== null) return;
      const touch = e.changedTouches[0];
      activeTouchId = touch.identifier;
      recalcCenter();
      updateJoystickPosition(touch);
      e.preventDefault();
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (activeTouchId === null) return;
      const touch = Array.from(e.changedTouches).find((t) => t.identifier === activeTouchId);
      if (touch) {
        updateJoystickPosition(touch);
        e.preventDefault();
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const touch = Array.from(e.changedTouches).find((t) => t.identifier === activeTouchId);
      if (touch) {
        resetJoystick();
        e.preventDefault();
      }
    };

    joystickBase.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);

    window.addEventListener('resize', recalcCenter);

    return () => {
      joystickBase.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('resize', recalcCenter);
    };
  }, [isMobile]);

  // Send inputs at 60fps
  useEffect(() => {
    const interval = setInterval(() => {
      onInputChange(inputsRef.current);
    }, 1000 / 60);

    return () => clearInterval(interval);
  }, [onInputChange]);

  if (!isMobile) return null;

  return (
    <div id="mobile-controls" style={{ display: 'flex' }}>
      <div id="joystick-container">
        <div id="joystick-base">
          <div id="joystick-thumb"></div>
        </div>
      </div>
      <button id="action-btn" style={{ display: 'none' }}>
        CHUTAR
      </button>
    </div>
  );
};
