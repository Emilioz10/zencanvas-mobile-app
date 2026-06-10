import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface TimeBlockEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  timeBlock?: {
    id: number;
    title: string;
    description?: string;
    startTime: string;
    endTime: string;
  };
  onSave?: () => void;
}

export function TimeBlockEditor({
  open,
  onOpenChange,
  timeBlock,
  onSave,
}: TimeBlockEditorProps) {
  const [title, setTitle] = useState(timeBlock?.title || '');
  const [description, setDescription] = useState(timeBlock?.description || '');
  const [startTime, setStartTime] = useState(timeBlock?.startTime || '09:00');
  const [endTime, setEndTime] = useState(timeBlock?.endTime || '10:00');

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }

    // TODO: Implement time block mutations in tRPC routers
    toast.success(timeBlock ? 'Time block updated' : 'Time block created');
    onOpenChange(false);
    onSave?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {timeBlock ? 'Edit Time Block' : 'Create Time Block'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-generous">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Team Meeting, Exercise, Lunch"
            />
          </div>

          <div>
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details about this time block..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {timeBlock ? 'Update' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
