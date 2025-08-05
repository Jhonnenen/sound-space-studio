import React, { useEffect, useRef, useState } from 'react';
import * as Tone from 'tone';
import { Card } from '@/components/ui/card';

interface DrumsProps {
  onNotePlay: (note: string) => void;
}

const drumSounds = [
  { name: 'Kick', key: 's', color: 'from-red-500 to-red-600', note: 'C2' },
  { name: 'Snare', key: 'd', color: 'from-orange-500 to-orange-600', note: 'D2' },
  { name: 'Hi-Hat', key: 'f', color: 'from-yellow-500 to-yellow-600', note: 'F#2' },
  { name: 'Crash', key: 'g', color: 'from-green-500 to-green-600', note: 'A#2' },
  { name: 'Ride', key: 'h', color: 'from-blue-500 to-blue-600', note: 'C3' },
  { name: 'Tom', key: 'j', color: 'from-purple-500 to-purple-600', note: 'E3' },
];

export const Drums: React.FC<DrumsProps> = ({ onNotePlay }) => {
  const synthsRef = useRef<{ [key: string]: Tone.MembraneSynth | Tone.MetalSynth | Tone.NoiseSynth }>({});
  const [activePads, setActivePads] = useState<Set<string>>(new Set());
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Initialize different synths for different drum sounds
    synthsRef.current = {
      'Kick': new Tone.MembraneSynth({
        pitchDecay: 0.05,
        octaves: 10,
        oscillator: { type: 'sine' },
        envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 1.4 }
      }).toDestination(),
      'Snare': new Tone.NoiseSynth({
        noise: { type: 'white', playbackRate: 3 },
        envelope: { attack: 0.001, decay: 0.2, sustain: 0 }
      }).toDestination(),
      'Hi-Hat': new Tone.MetalSynth({
        envelope: { attack: 0.001, decay: 0.1, release: 0.2 },
        harmonicity: 5.1,
        modulationIndex: 32,
        resonance: 4000,
        octaves: 1.5
      }).toDestination(),
      'Crash': new Tone.MetalSynth({
        envelope: { attack: 0.001, decay: 1, release: 3 },
        harmonicity: 3.1,
        modulationIndex: 16,
        resonance: 4000,
        octaves: 1.5
      }).toDestination(),
      'Ride': new Tone.MetalSynth({
        envelope: { attack: 0.001, decay: 0.4, release: 0.8 },
        harmonicity: 4.1,
        modulationIndex: 12,
        resonance: 3000,
        octaves: 1.5
      }).toDestination(),
      'Tom': new Tone.MembraneSynth({
        pitchDecay: 0.008,
        octaves: 2,
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.001, decay: 0.7, sustain: 0.1, release: 1.2 }
      }).toDestination(),
    };

    return () => {
      Object.values(synthsRef.current).forEach(synth => {
        if (synth) synth.dispose();
      });
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = async (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const drum = drumSounds.find(d => d.key === key);
      if (drum && !pressedKeys.has(key)) {
        setPressedKeys(prev => new Set(prev).add(key));
        await playDrum(drum.name, drum.note);
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const drum = drumSounds.find(d => d.key === key);
      if (drum) {
        setPressedKeys(prev => {
          const newSet = new Set(prev);
          newSet.delete(key);
          return newSet;
        });
        setActivePads(prev => {
          const newSet = new Set(prev);
          newSet.delete(drum.name);
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

  const playDrum = async (drumName: string, note: string) => {
    const synth = synthsRef.current[drumName];
    if (!synth) return;

    // Start audio context if needed
    if (Tone.context.state !== 'running') {
      await Tone.start();
    }

    setActivePads(prev => new Set(prev).add(drumName));
    
    // Different trigger methods for different synth types
    if (synth instanceof Tone.NoiseSynth) {
      synth.triggerAttackRelease('8n');
    } else {
      synth.triggerAttackRelease(note, '8n');
    }
    
    onNotePlay(`${drumName}-${note}`);

    // Remove active state after animation
    setTimeout(() => {
      setActivePads(prev => {
        const newSet = new Set(prev);
        newSet.delete(drumName);
        return newSet;
      });
    }, 200);
  };

  const handlePadClick = (drumName: string, note: string) => {
    playDrum(drumName, note);
  };

  const isPadActive = (drumName: string) => {
    const drum = drumSounds.find(d => d.name === drumName);
    return activePads.has(drumName) || (drum && pressedKeys.has(drum.key));
  };

  return (
    <Card className="p-6 bg-card/70 backdrop-blur-sm border-border/50">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-center mb-2 bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent">
          Virtual Drum Kit
        </h2>
        <p className="text-center text-muted-foreground text-sm">
          Use your keyboard: S, D, F, G, H, J for different drum sounds
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
        {drumSounds.map((drum) => (
          <button
            key={drum.name}
            onMouseDown={() => handlePadClick(drum.name, drum.note)}
            className={`
              relative h-24 md:h-32 rounded-full transition-all duration-200
              bg-gradient-to-br ${drum.color} hover:scale-105 active:scale-95
              shadow-lg hover:shadow-xl border-2 border-white/20
              ${isPadActive(drum.name) ? 'scale-110 animate-drum-hit' : ''}
            `}
            style={{
              boxShadow: isPadActive(drum.name) ? 'var(--shadow-active)' : 'var(--shadow-key)',
              transform: isPadActive(drum.name) ? 'scale(1.1)' : undefined,
            }}
          >
            <div className="absolute inset-0 rounded-full bg-gradient-to-t from-black/20 to-white/20"></div>
            <div className="relative z-10 h-full flex flex-col items-center justify-center text-white">
              <span className="font-bold text-lg md:text-xl">{drum.name}</span>
              <span className="text-sm opacity-80 bg-black/30 px-2 py-1 rounded mt-1">
                {drum.key.toUpperCase()}
              </span>
            </div>
            
            {isPadActive(drum.name) && (
              <div className="absolute inset-0 rounded-full bg-white/30 animate-glow-pulse"></div>
            )}
          </button>
        ))}
      </div>

      <div className="mt-6 text-center">
        <div className="inline-flex items-center gap-2 text-sm text-muted-foreground bg-muted/20 px-4 py-2 rounded-full">
          <div className="w-2 h-2 bg-primary rounded-full animate-glow-pulse"></div>
          Click the pads or use your keyboard to play
        </div>
      </div>
    </Card>
  );
};