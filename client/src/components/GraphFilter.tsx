import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Filter } from 'lucide-react';

const NODE_TYPES = [
  { id: 'task', label: 'Tasks', color: 'bg-blue-100' },
  { id: 'note', label: 'Notes', color: 'bg-yellow-100' },
  { id: 'project', label: 'Projects', color: 'bg-green-100' },
  { id: 'person', label: 'People', color: 'bg-pink-100' },
  { id: 'event', label: 'Events', color: 'bg-purple-100' },
  { id: 'idea', label: 'Ideas', color: 'bg-orange-100' },
];

interface GraphFilterProps {
  onFilterChange: (visibleTypes: string[]) => void;
}

export function GraphFilter({ onFilterChange }: GraphFilterProps) {
  const [visibleTypes, setVisibleTypes] = useState<string[]>(
    NODE_TYPES.map(t => t.id)
  );

  const handleToggle = (typeId: string) => {
    const updated = visibleTypes.includes(typeId)
      ? visibleTypes.filter(t => t !== typeId)
      : [...visibleTypes, typeId];
    setVisibleTypes(updated);
    onFilterChange(updated);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Filter className="w-4 h-4" />
          Filter Nodes
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56">
        <div className="space-generous">
          <h3 className="font-medium text-sm">Show Node Types</h3>
          <div className="space-2">
            {NODE_TYPES.map(type => (
              <div key={type.id} className="flex items-center gap-2">
                <Checkbox
                  id={type.id}
                  checked={visibleTypes.includes(type.id)}
                  onCheckedChange={() => handleToggle(type.id)}
                />
                <Label
                  htmlFor={type.id}
                  className={`flex items-center gap-2 cursor-pointer text-sm ${type.color} px-2 py-1 rounded`}
                >
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: type.color }} />
                  {type.label}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
