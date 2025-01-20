"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tag, Group } from "./types";

interface FilterProps {
  tags: Tag[];
  groups: Group[];
  selectedTags: string[];
  selectedGroups: string[];
  onFilterChange: (type: "tags" | "groups", ids: string[]) => void;
}

export function PasswordFilter({
  tags,
  groups,
  selectedTags,
  selectedGroups,
  onFilterChange,
}: FilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getPreviewTextColor = (bgColor: string) => {
    const hex = bgColor.replace("#", "");
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? "#000000" : "#ffffff";
  };

  useEffect(() => {
    const validTags = selectedTags.filter((tagId) =>
      tags.some((tag) => tag._id === tagId)
    );
    if (validTags.length !== selectedTags.length) {
      onFilterChange("tags", validTags);
    }

    const validGroups = selectedGroups.filter((groupId) =>
      groups.some((group) => group._id === groupId)
    );
    if (validGroups.length !== selectedGroups.length) {
      onFilterChange("groups", validGroups);
    }
  }, [tags, groups, selectedTags, selectedGroups, onFilterChange]);

  const handleTagChange = (tagId: string) => {
    const newSelectedTags = selectedTags.includes(tagId)
      ? selectedTags.filter((id) => id !== tagId)
      : [...selectedTags, tagId];
    onFilterChange("tags", newSelectedTags);
  };

  const handleGroupChange = (groupId: string) => {
    const newSelectedGroups = selectedGroups.includes(groupId)
      ? selectedGroups.filter((id) => id !== groupId)
      : [...selectedGroups, groupId];
    onFilterChange("groups", newSelectedGroups);
  };

  const selectedFiltersCount = selectedTags.length + selectedGroups.length;

  return (
    <div className="relative">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="icon" className="relative">
            <Filter className="h-4 w-4" />
            {selectedFiltersCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-xs flex items-center justify-center text-primary-foreground">
                {selectedFiltersCount}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[350px] p-4">
          <div className="grid grid-cols-2 gap-6">
            {/* Groups Section */}
            <div>
              <h4 className="text-sm font-medium mb-3">Groups</h4>
              <div className="space-y-1.5 max-h-[200px] overflow-y-auto pr-3">
                {groups.map((group) => (
                  <div key={group._id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`group-${group._id}`}
                      checked={selectedGroups.includes(group._id)}
                      onCheckedChange={() => handleGroupChange(group._id)}
                    />
                    <label
                      htmlFor={`group-${group._id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {group.name}
                    </label>
                  </div>
                ))}
                {groups.length === 0 && (
                  <div className="text-sm text-muted-foreground py-1">
                    No groups available
                  </div>
                )}
              </div>
            </div>

            {/* Tags Section */}
            <div className="relative">
              <Separator
                orientation="vertical"
                className="absolute -left-3 h-full"
              />
              <h4 className="text-sm font-medium mb-3">Tags</h4>
              <div className="space-y-1.5 max-h-[200px] overflow-y-auto pr-3">
                {tags.map((tag) => (
                  <div key={tag._id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`tag-${tag._id}`}
                      checked={selectedTags.includes(tag._id)}
                      onCheckedChange={() => handleTagChange(tag._id)}
                    />
                    <label
                      htmlFor={`tag-${tag._id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      <Badge
                        style={{
                          backgroundColor: tag.color,
                          color: getPreviewTextColor(tag.color),
                          padding: "0.25rem 0.5rem",
                        }}
                      >
                        {tag.name}
                      </Badge>
                    </label>
                  </div>
                ))}
                {tags.length === 0 && (
                  <div className="text-sm text-muted-foreground py-1">
                    No tags available
                  </div>
                )}
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}