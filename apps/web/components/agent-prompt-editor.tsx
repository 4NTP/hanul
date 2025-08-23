'use client';

import { useState } from 'react';
import { Textarea } from '@hanul/ui/components/textarea';
import { Button } from '@hanul/ui/components/button';
import { agentsAPI } from '@/lib/api/agents';
import { useTranslations } from 'next-intl';

interface Props {
  agentId: string;
  initialPrompt: string;
  onUpdated?: () => void;
}

export default function AgentPromptEditor({
  agentId,
  initialPrompt,
  onUpdated,
}: Props) {
  const t = useTranslations('chat');
  const [value, setValue] = useState(initialPrompt);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!value.trim()) return;
    setIsSaving(true);
    try {
      await agentsAPI.update(agentId, value);
      onUpdated?.();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-2">
      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={10}
        className="w-full"
      />
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setValue(initialPrompt)}
          disabled={isSaving}
          className="cursor-pointer"
        >
          {t('cancel')}
        </Button>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={isSaving}
          className="cursor-pointer"
        >
          {isSaving ? t('sending') : t('save')}
        </Button>
      </div>
    </div>
  );
}
