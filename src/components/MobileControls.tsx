import React, { useRef, useEffect, useState } from 'react';
import { PlayerInput } from '../types/game';

interface MobileControlsProps {
  onInputChange: (inputs: Partial<PlayerInput>) => void;
  isMobile: boolean;
}

const MobileControls: React.FC<MobileControlsProps> = ({ onInputChange, isMobile }) => {
  const joystickBaseRef = useRef<HTMLDivElement>(null);
  const joystickThumbRef = useRef<HTMLDivElement>(null);
  const [activeTouchId, setActiveTouchId] = useState<number | string | null>(null);
  const [centerPosition, setCenterPosition] = useState({ x: 0, y: 0 });

  const joystickRadius = 50;

  useEffect(() => {
    const recalcCenter = () => {
      if (!joystickBaseRef.current) return;
      const rect = joystickBaseRef.current.getBoundingClientRect();
      setCenterPosition({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
    };

    recalcCenter();
    window.addEventListener('resize', recalcCenter);
    window.addEventListener('scroll', recalcCenter, { passive: true });

    return () => {
      window.removeEventListener('resize', recalcCenter);
      window.removeEventListener('scroll', recalcCenter);
    };
  }, []);

  const updateJoystickPosition = (touch: { clientX: number; clientY: number }) => {
    const touchX = touch.clientX - centerPosition.x;
    const touchY = touch.clientY - centerPosition.y;

    const distance = Math.sqrt(touchX * touchX + touchY * touchY);
    const angle = Math.atan2(touchY, touchX);

    const limitedDistance = Math.min(distance, joystickRadius);
    const newX = Math.cos(angle) * limitedDistance;
    const newY = Math.sin(angle) * limitedDistance;

    if (joystickThumbRef.current) {
      joystickThumbRef.current.style.transform = `translate(${newX}px, ${newY}px)`;
    }

    const deadZone = 0.2;
    const normalizedX = newX / joystickRadius;
    const normalizedY = newY / joystickRadius;

    onInputChange({
      left: normalizedX < -deadZone,
      right: normalizedX > deadZone,
      up: normalizedY < -deadZone,
      down: normalizedY > deadZone,
    });
  };

  const resetJoystick = () => {
    if (joystickThumbRef.current) {
      joystickThumbRef.current.style.transform = 'translate(0, 0)';
    }
    setActiveTouchId(null);
    onInputChange({
      left: false,
      right: false,
      up: false,
      down: false,
    });
  };

  useEffect(() => {
    const base = joystickBaseRef.current;
    if (!base) return;

    const recalcCenter = () => {
      const rect = base.getBoundingClientRect();
      setCenterPosition({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (activeTouchId !== null) return;
      const touch = e.changedTouches[0];
      setActiveTouchId(touch.identifier);
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

    const handleMouseDown = (e: MouseEvent) => {
      if (activeTouchId !== null) return;
      setActiveTouchId('mouse');
      recalcCenter();
      updateJoystickPosition(e);
      e.preventDefault();
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (activeTouchId === 'mouse') {
        updateJoystickPosition(e);
        e.preventDefault();
      }
    };

    const handleMouseUp = () => {
      if (activeTouchId === 'mouse') {
        resetJoystick();
      }
    };

    base.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
    base.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      base.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      base.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [activeTouchId, centerPosition]);

  if (!isMobile) return null;

  return (
    <div className="mobile-controls">
      <div className="joystick-container">
        <div ref={joystickBaseRef} className="joystick-base">
          <div ref={joystickThumbRef} className="joystick-thumb"></div>
        </div>
      </div>
    </div>
  );
};

export default MobileControls;
