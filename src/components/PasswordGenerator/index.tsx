"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { Copy, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const PasswordGenerator = () => {
  const [password, setPassword] = useState("");
  const [length, setLength] = useState(12);
  const [uppercase, setUppercase] = useState(true);
  const [lowercase, setLowercase] = useState(true);
  const [numbers, setNumbers] = useState(true);
  const [symbols, setSymbols] = useState(true);
  const [mode, setMode] = useState<"all" | "easy-to-say" | "easy-to-read">(
    "all"
  );
  const { toast } = useToast();

  const generatePassword = useCallback(() => {
    let charset = "";
    let newPassword = "";

    if (mode === "easy-to-say") {
      charset =
        (uppercase ? "ABCDEFGHIJKLMNOPQRSTUVWXYZ" : "") +
        (lowercase ? "abcdefghijklmnopqrstuvwxyz" : "");
    } else if (mode === "easy-to-read") {
      charset =
        (uppercase ? "ABCDEFGHJKLMNPQRSTUVWXYZ" : "") +
        (lowercase ? "abcdefghijkmnpqrstuvwxyz" : "") +
        (numbers ? "23456789" : "") +
        (symbols ? "@#$%&*+?=" : "");
    } else {
      if (uppercase) charset += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      if (lowercase) charset += "abcdefghijklmnopqrstuvwxyz";
      if (numbers) charset += "0123456789";
      if (symbols) charset += "!@#$%^&*()_+{}[]|:;<>,.?/~";
    }

    for (let i = 0; i < length; i++) {
      newPassword += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    setPassword(newPassword);
  }, [mode, uppercase, lowercase, numbers, symbols, length]);

  useEffect(() => {
    generatePassword();
  }, [length, uppercase, lowercase, numbers, symbols, mode, generatePassword]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(password);
    toast({
      title: "Password Copied!",
      description: "The password has been copied to your clipboard.",
      duration: 2000,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-3xl mx-auto p-8 sm:px-8 px-2 bg-white dark:bg-gray-800 rounded-xl shadow-2xl"
    >
      <motion.h2
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="text-3xl font-bold mb-6 text-gray-800 dark:text-white text-center"
      >
        Password Generator
      </motion.h2>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="mb-6"
      >
        <Input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-4 text-2xl font-mono py-6 text-center"
        />
        <div className="flex justify-center space-x-4">
          <Button onClick={generatePassword} size="lg" className="w-40">
            <RefreshCw className="mr-2 h-5 w-5" />
            Regenerate
          </Button>
          <Button onClick={copyToClipboard} size="lg" className="w-40">
            <Copy className="mr-2 h-5 w-5" />
            Copy
          </Button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="mb-8"
      >
        <label className="block text-lg font-medium mb-2 text-gray-700 dark:text-gray-300">
          Password Length: {length}
        </label>
        <Slider
          value={[length]}
          onValueChange={(value) => setLength(value[0])}
          max={32}
          min={8}
          step={1}
          className="w-full"
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="mb-8"
      >
        <RadioGroup
          defaultValue="all"
          onValueChange={(value: "all" | "easy-to-say" | "easy-to-read") =>
            setMode(value)
          }
          className="flex flex-col space-y-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="all" id="all" />
            <Label htmlFor="all">All Characters</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="easy-to-say" id="easy-to-say" />
            <Label htmlFor="easy-to-say">Easy to say</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="easy-to-read" id="easy-to-read" />
            <Label htmlFor="easy-to-read">Easy to read</Label>
          </div>
        </RadioGroup>
      </motion.div>

      <div className="grid grid-cols-2 gap-6">
        <CheckboxItem
          id="uppercase"
          checked={uppercase}
          onCheckedChange={setUppercase}
          label="Uppercase"
        />
        <CheckboxItem
          id="lowercase"
          checked={lowercase}
          onCheckedChange={setLowercase}
          label="Lowercase"
        />
        <CheckboxItem
          id="numbers"
          checked={numbers}
          onCheckedChange={setNumbers}
          label="Numbers"
          disabled={mode === "easy-to-say"}
        />
        <CheckboxItem
          id="symbols"
          checked={symbols}
          onCheckedChange={setSymbols}
          label="Symbols"
          disabled={mode === "easy-to-say"}
        />
      </div>
    </motion.div>
  );
};

interface CheckboxItemProps {
  id: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
}

const CheckboxItem: React.FC<CheckboxItemProps> = ({
  id,
  checked,
  onCheckedChange,
  label,
  disabled = false,
}) => (
  <div className="flex items-center">
    <Checkbox
      id={id}
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      className="h-5 w-5"
    />
    <label
      htmlFor={id}
      className={`ml-3 text-lg ${
        disabled ? "text-gray-400" : "text-gray-700 dark:text-gray-300"
      }`}
    >
      {label}
    </label>
  </div>
);

export default PasswordGenerator;
