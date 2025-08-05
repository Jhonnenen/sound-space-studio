import React, { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Piano } from './Piano';
import { Drums } from './Drums';
import { Play, Square, Download, Piano as PianoIcon, Drum } from 'lucide-react';

export type Instrument = 'piano' | 'drums';

export interface NoteEvent {
  instrument: Instrument;
  note: string;
  timestamp: number;
}

const SoundSpace = () => {
  const [activeInstrument, setActiveInstrument] = useState<Instrument>('piano');
  const [isRecording, setIsRecording] = useState(false);
  const [recordedNotes, setRecordedNotes] = useState<NoteEvent[]>([]);
  const recordingStartTime = useRef<number>(0);

  const handleStartRecording = useCallback(() => {
    setIsRecording(true);
    setRecordedNotes([]);
    recordingStartTime.current = Date.now();
  }, []);

  const handleStopRecording = useCallback(() => {
    setIsRecording(false);
  }, []);

  const handleNotePlay = useCallback((note: string) => {
    if (isRecording) {
      const noteEvent: NoteEvent = {
        instrument: activeInstrument,
        note,
        timestamp: Date.now() - recordingStartTime.current,
      };
      setRecordedNotes(prev => [...prev, noteEvent]);
    }
  }, [isRecording, activeInstrument]);

  const handleDownloadRecording = useCallback(() => {
    if (recordedNotes.length === 0) return;
    
    const recording = {
      title: `SoundSpace Recording - ${new Date().toISOString()}`,
      notes: recordedNotes,
      duration: recordedNotes[recordedNotes.length - 1]?.timestamp || 0,
    };
    
    const dataStr = JSON.stringify(recording, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `soundspace-recording-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [recordedNotes]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background">
      {/* Header */}
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent mb-4 animate-float">
            SoundSpace
          </h1>
          <p className="text-muted-foreground text-lg">
            Create beautiful music with our interactive virtual instruments
          </p>
        </div>

        {/* Instrument Switcher */}
        <Card className="p-6 mb-8 bg-card/50 backdrop-blur-sm border-border/50">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant={activeInstrument === 'piano' ? 'default' : 'outline'}
                onClick={() => setActiveInstrument('piano')}
                className="flex items-center gap-2 transition-all duration-300"
                style={{
                  background: activeInstrument === 'piano' ? 'var(--gradient-primary)' : undefined,
                  boxShadow: activeInstrument === 'piano' ? 'var(--shadow-glow)' : undefined,
                }}
              >
                <PianoIcon className="w-5 h-5" />
                Piano
              </Button>
              <Button
                variant={activeInstrument === 'drums' ? 'default' : 'outline'}
                onClick={() => setActiveInstrument('drums')}
                className="flex items-center gap-2 transition-all duration-300"
                style={{
                  background: activeInstrument === 'drums' ? 'var(--gradient-secondary)' : undefined,
                  boxShadow: activeInstrument === 'drums' ? 'var(--shadow-glow)' : undefined,
                }}
              >
                <Drum className="w-5 h-5" />
                Drums
              </Button>
            </div>

            {/* Recording Controls */}
            <div className="flex items-center gap-3">
              {!isRecording ? (
                <Button
                  onClick={handleStartRecording}
                  className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                >
                  <Play className="w-4 h-4" />
                  Record
                </Button>
              ) : (
                <Button
                  onClick={handleStopRecording}
                  className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-700 animate-glow-pulse"
                >
                  <Square className="w-4 h-4" />
                  Stop Recording
                </Button>
              )}
              
              {recordedNotes.length > 0 && (
                <Button
                  onClick={handleDownloadRecording}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download ({recordedNotes.length} notes)
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Instrument Display */}
        <div className="relative">
          <div 
            className={`transition-all duration-500 ${
              activeInstrument === 'piano' ? 'opacity-100 scale-100' : 'opacity-0 scale-95 absolute inset-0 pointer-events-none'
            }`}
          >
            {activeInstrument === 'piano' && (
              <Piano onNotePlay={handleNotePlay} />
            )}
          </div>
          
          <div 
            className={`transition-all duration-500 ${
              activeInstrument === 'drums' ? 'opacity-100 scale-100' : 'opacity-0 scale-95 absolute inset-0 pointer-events-none'
            }`}
          >
            {activeInstrument === 'drums' && (
              <Drums onNotePlay={handleNotePlay} />
            )}
          </div>
        </div>

        {/* Recording Status */}
        {isRecording && (
          <div className="fixed bottom-4 right-4 bg-red-500/20 border border-red-500/50 rounded-lg p-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-red-400">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-glow-pulse"></div>
              <span className="font-semibold">Recording... ({recordedNotes.length} notes)</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SoundSpace;