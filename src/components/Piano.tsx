import React, { useEffect, useRef, useState } from 'react';
import * as Tone from 'tone';
import { Card } from '@/components/ui/card';

interface PianoProps {
  onNotePlay: (note: string) => void;
}

const whiteKeys = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'];
const blackKeys = ['C#4', 'D#4', null, 'F#4', 'G#4', 'A#4', null];

// Keyboard mapping for white keys
const keyboardMapping: { [key: string]: string } = {
  'a': 'C4', 's': 'D4', 'd': 'E4', 'f': 'F4',
  'g': 'G4', 'h': 'A4', 'j': 'B4', 'k': 'C5',
  // Black keys
  'w': 'C#4', 'e': 'D#4', 't': 'F#4', 'y': 'G#4', 'u': 'A#4'
};

export const Piano: React.FC<PianoProps> = ({ onNotePlay }) => {
  const synthRef = useRef<Tone.Synth | null>(null);
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Initialize Tone.js synth
    synthRef.current = new Tone.Synth({
      oscillator: {
        type: 'triangle'
      },
      envelope: {
        attack: 0.02,
        decay: 0.1,
        sustain: 0.3,
        release: 1.2
      }
    }).toDestination();

    return () => {
      if (synthRef.current) {
        synthRef.current.dispose();
      }
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = async (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (keyboardMapping[key] && !pressedKeys.has(key)) {
        setPressedKeys(prev => new Set(prev).add(key));
        await playNote(keyboardMapping[key]);
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (keyboardMapping[key]) {
        setPressedKeys(prev => {
          const newSet = new Set(prev);
          newSet.delete(key);
          return newSet;
        });
        setActiveKeys(prev => {
          const newSet = new Set(prev);
          newSet.delete(keyboardMapping[key]);
          return newSet;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [pressedKeys]);

  const playNote = async (note: string) => {
    if (!synthRef.current) return;

    // Start audio context if needed
    if (Tone.context.state !== 'running') {
      await Tone.start();
    }

    setActiveKeys(prev => new Set(prev).add(note));
    synthRef.current.triggerAttackRelease(note, '8n');
    onNotePlay(note);

    // Remove active state after animation
    setTimeout(() => {
      setActiveKeys(prev => {
        const newSet = new Set(prev);
        newSet.delete(note);
        return newSet;
      });
    }, 150);
  };

  const handleKeyPress = (note: string) => {
    playNote(note);
  };

  const isKeyActive = (note: string) => {
    return activeKeys.has(note) || (Object.values(keyboardMapping).includes(note) && 
           pressedKeys.has(Object.keys(keyboardMapping).find(k => keyboardMapping[k] === note) || ''));
  };

  return (
    <Card className="p-6 bg-card/70 backdrop-blur-sm border-border/50">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-center mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Virtual Piano
        </h2>
        <p className="text-center text-muted-foreground text-sm">
          Use your keyboard: A-K for white keys, W-E-T-Y-U for black keys
        </p>
      </div>

      <div className="flex justify-center">
        <div className="relative">
          {/* White Keys */}
          <div className="flex gap-1">
            {whiteKeys.map((note, index) => {
              const keyboardKey = Object.keys(keyboardMapping).find(k => keyboardMapping[k] === note);
              return (
                <button
                  key={note}
                  onMouseDown={() => handleKeyPress(note)}
                  className={`
                    relative w-12 h-40 bg-gradient-to-b from-white to-gray-100 
                    border border-gray-300 rounded-b-lg transition-all duration-75
                    hover:from-gray-50 hover:to-gray-200 hover:shadow-lg
                    active:from-gray-200 active:to-gray-300
                    ${isKeyActive(note) ? 'from-primary/20 to-primary/40 shadow-[0_0_20px_hsl(var(--primary)/0.5)] animate-key-press' : ''}
                  `}
                  style={{
                    background: isKeyActive(note) ? 'linear-gradient(to bottom, hsl(var(--piano-active) / 0.3), hsl(var(--piano-active) / 0.6))' : undefined,
                    boxShadow: isKeyActive(note) ? 'var(--shadow-active)' : 'var(--shadow-key)',
                  }}
                >
                  <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-xs font-semibold text-gray-600">
                    {keyboardKey?.toUpperCase()}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Black Keys */}
          <div className="absolute top-0 flex gap-1">
            {blackKeys.map((note, index) => {
              if (!note) {
                return <div key={index} className="w-12"></div>;
              }
              
              const keyboardKey = Object.keys(keyboardMapping).find(k => keyboardMapping[k] === note);
              return (
                <button
                  key={note}
                  onMouseDown={() => handleKeyPress(note)}
                  className={`
                    relative w-8 h-24 bg-gradient-to-b from-gray-800 to-black 
                    border border-gray-600 rounded-b-lg transition-all duration-75 ml-2
                    hover:from-gray-700 hover:to-gray-900 hover:shadow-lg
                    active:from-gray-600 active:to-gray-800
                    ${isKeyActive(note) ? 'from-accent/40 to-accent/70 shadow-[0_0_20px_hsl(var(--accent)/0.7)] animate-key-press' : ''}
                  `}
                  style={{
                    background: isKeyActive(note) ? 'linear-gradient(to bottom, hsl(var(--accent) / 0.6), hsl(var(--accent) / 0.9))' : undefined,
                    boxShadow: isKeyActive(note) ? 'var(--shadow-active)' : 'var(--shadow-key)',
                    marginLeft: index === 0 ? '2rem' : '1rem',
                  }}
                >
                  <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 text-xs font-semibold text-white">
                    {keyboardKey?.toUpperCase()}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
};