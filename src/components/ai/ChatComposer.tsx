import React, { useMemo } from 'react';
import { Send } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';

export interface ChatComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => Promise<void> | void;
  disabled?: boolean;
  placeholder?: string;
  hint?: React.ReactNode;
}

export const ChatComposer: React.FC<ChatComposerProps> = ({
  value,
  onChange,
  onSubmit,
  disabled = false,
  placeholder = 'Type a message…',
  hint,
}) => {
  const canSend = useMemo(() => value.trim().length > 0 && !disabled, [value, disabled]);

  return (
    <div className="border-t border-border bg-card/70 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="p-4">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!canSend) return;
            await onSubmit();
          }}
          className="flex items-end gap-2"
        >
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            autoFocus
            className="flex-1"
            onKeyDown={async (e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (!canSend) return;
                await onSubmit();
              }
            }}
          />
          <Button type="submit" disabled={!canSend}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
        {hint ? <div className="mt-2 text-xs text-muted-foreground">{hint}</div> : null}
      </div>
    </div>
  );
};
