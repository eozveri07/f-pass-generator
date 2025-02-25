import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Keyboard } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface VirtualKeyboardProps {
  onKeyPress: (value: string) => void;
  currentValue: string;
  maxLength: number;
}

export function VirtualKeyboard({ onKeyPress, currentValue, maxLength }: VirtualKeyboardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempValue, setTempValue] = useState("");
  const [keypadNumbers, setKeypadNumbers] = useState<number[]>([]);

  // Shuffle array function for randomizing keypad
  const shuffleArray = (array: number[]) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  // Reset and shuffle numbers when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setTempValue(currentValue);
      setKeypadNumbers(shuffleArray([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]));
    }
  }, [isOpen, currentValue]);

  const handleKeyPress = (key: string) => {
    if (tempValue.length < maxLength) {
      setTempValue(prev => prev + key);
    }
  };

  const handleBackspace = () => {
    setTempValue(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setTempValue("");
  };

  const handleDone = () => {
    onKeyPress(tempValue);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full mt-2">
          <Keyboard className="mr-2 h-4 w-4" />
          Use Virtual Keyboard
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Virtual Keyboard</DialogTitle>
        </DialogHeader>
        <Card className="p-4">
          <div className="mb-4">
            <div className="bg-muted p-3 rounded-md text-center">
              <span className="text-2xl tracking-widest font-mono">
                {tempValue.replace(/./g, '*')}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {keypadNumbers.map((number) => (
              <Button
                key={number}
                variant="outline"
                className="h-12 text-lg font-semibold hover:bg-primary hover:text-primary-foreground transition-colors"
                onClick={() => handleKeyPress(number.toString())}
              >
                {number}
              </Button>
            ))}
            <Button
              variant="outline"
              className="h-12 text-lg font-semibold col-span-2 hover:bg-destructive hover:text-destructive-foreground transition-colors"
              onClick={handleClear}
            >
              Clear
            </Button>
            <Button
              variant="outline"
              className="h-12 text-lg font-semibold hover:bg-destructive hover:text-destructive-foreground transition-colors"
              onClick={handleBackspace}
            >
              ←
            </Button>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button 
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="default"
              onClick={handleDone}
              disabled={tempValue.length === 0}
            >
              Done
            </Button>
          </div>
        </Card>
      </DialogContent>
    </Dialog>
  );
} 