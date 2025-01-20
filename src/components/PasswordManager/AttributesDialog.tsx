// components/password/AttributesDialog.tsx
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Tag, Group } from "./types";
import { Badge } from "@/components/ui/badge";
import { Trash2, Settings2, Edit, AlertCircle } from "lucide-react";

interface AttributeStats {
  tags: Record<string, number>; // tag id -> password count
  groups: Record<string, number>; // group id -> password count
}

export function AttributesDialog() {
    const [isOpen, setIsOpen] = useState(false);
    const [tags, setTags] = useState<Tag[]>([]);
    const [groups, setGroups] = useState<Group[]>([]);
    const [stats, setStats] = useState<AttributeStats>({ tags: {}, groups: {} });
    const [newTagName, setNewTagName] = useState("");
    const [newTagColor, setNewTagColor] = useState("#000000");
    const [newGroupName, setNewGroupName] = useState("");
    const [newGroupDesc, setNewGroupDesc] = useState("");
    const [editMode, setEditMode] = useState(false);
    const [selectedTag, setSelectedTag] = useState<Tag | null>(null);
    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
    const [activeTab, setActiveTab] = useState("tags");
    const [activeSubTab, setActiveSubTab] = useState("list");
  
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchAttributesAndStats();
    }
  }, [isOpen]);

  const fetchAttributesAndStats = async () => {
    try {
      const [tagsRes, groupsRes, statsRes] = await Promise.all([
        fetch("/api/tags"),
        fetch("/api/groups"),
        fetch("/api/attributes/stats")
      ]);
      
      if (tagsRes.ok && groupsRes.ok && statsRes.ok) {
        const [tagsData, groupsData, statsData] = await Promise.all([
          tagsRes.json(),
          groupsRes.json(),
          statsRes.json()
        ]);
        setTags(tagsData);
        setGroups(groupsData);
        setStats(statsData);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while loading data",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setNewTagName("");
    setNewTagColor("#000000");
    setNewGroupName("");
    setNewGroupDesc("");
    setSelectedTag(null);
    setSelectedGroup(null);
    setEditMode(false);
  };

  const handleAddTag = async () => {
    try {
      const response = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newTagName,
          color: newTagColor
        }),
      });

      if (response.ok) {
        await fetchAttributesAndStats();
        resetForm();
        window.dispatchEvent(new Event('attributesUpdated')); 
        toast({
          title: "Success",
          description: "Tag added",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while adding the tag",
        variant: "destructive",
      });
    }
  };

  const handleUpdateTag = async () => {
    if (!selectedTag) return;

    try {
      const response = await fetch(`/api/tags/${selectedTag._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newTagName,
          color: newTagColor
        }),
      });

      if (response.ok) {
        await fetchAttributesAndStats();
        window.dispatchEvent(new Event('attributesUpdated'));
        resetForm();
        toast({
          title: "Success",
          description: "Tag updated",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while updating the tag",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTag = async (id: string) => {
    try {
      const response = await fetch(`/api/tags/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setTags(prev => prev.filter(tag => tag._id !== id));
        await fetchAttributesAndStats();
        window.dispatchEvent(new Event('attributesUpdated'));
        toast({
          title: "Success",
          description: "Tag deleted",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while deleting the tag",
        variant: "destructive",
      });
    }
  };

  const handleEditClick = (tag: Tag) => {
    setSelectedTag(tag);
    setNewTagName(tag.name);
    setNewTagColor(tag.color);
    setEditMode(true);
    setActiveSubTab("manage"); 
  };


  const handleAddGroup = async () => {
    try {
      const response = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newGroupName,
          description: newGroupDesc
        }),
      });
  
      if (response.ok) {
        await fetchAttributesAndStats();
        window.dispatchEvent(new Event('attributesUpdated'));
        resetForm();
        toast({
          title: "Success",
          description: "Group added",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while adding the group",
        variant: "destructive",
      });
    }
  };
  
  const handleUpdateGroup = async () => {
    if (!selectedGroup) return;
  
    try {
      const response = await fetch(`/api/groups/${selectedGroup._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newGroupName,
          description: newGroupDesc
        }),
      });
  
      if (response.ok) {
        await fetchAttributesAndStats();
        window.dispatchEvent(new Event('attributesUpdated'));
        resetForm();
        toast({
          title: "Success",
          description: "Group updated",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while updating the group",
        variant: "destructive",
      });
    }
  };

  const getPreviewTextColor = (bgColor: string) => {
    const hex = bgColor.replace('#', '');
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? '#000000' : '#ffffff';
  };

  
  const handleDeleteGroup = async (id: string) => {
    try {
      const response = await fetch(`/api/groups/${id}`, {
        method: "DELETE",
      });
  
      if (response.ok) {
        setGroups(prev => prev.filter(group => group._id !== id));
        await fetchAttributesAndStats();
        window.dispatchEvent(new Event('attributesUpdated'));
        toast({
          title: "Success",
          description: "Group deleted",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while deleting the group",
        variant: "destructive",
      });
    }
  };
  
  const handleEditGroup = (group: Group) => {
    setSelectedGroup(group);
    setNewGroupName(group.name);
    setNewGroupDesc(group.description || "");
    setEditMode(true);
    setActiveSubTab("manage");
  };


  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Settings2 className="h-4 w-4" />
          Manage Attributes
        </Button>
      </DialogTrigger>
      <DialogContent className="min-w-[300px] max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Manage Attributes</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="tags" className="w-full">Tags</TabsTrigger>
            <TabsTrigger value="groups" className="w-full">Groups</TabsTrigger>
          </TabsList>

          <TabsContent value="tags">
            <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="w-full">
              <div className="flex justify-center w-full mb-4">
                <TabsList className="w-[400px]">
                  <TabsTrigger value="list" className="w-full">List</TabsTrigger>
                  <TabsTrigger value="manage" className="w-full">
                    {editMode ? 'Edit' : 'Add'}
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="list">
                <div className="grid gap-2">
                  {tags.map((tag) => (
                    <div key={tag._id} 
                         className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/10 transition-colors">
                      <div className="flex items-center gap-3">
                        <Badge 
                          style={{ 
                            backgroundColor: tag.color,
                            color: getPreviewTextColor(tag.color),
                            padding: '0.5rem 0.75rem'
                          }}
                          className="text-sm font-medium"
                        >
                          {tag.name}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {stats.tags[tag._id] || 0} passwords
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditClick(tag)}
                          className="hover:bg-accent"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTag(tag._id)}
                          className="hover:bg-destructive hover:text-destructive-foreground"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {tags.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <AlertCircle className="mx-auto h-8 w-8 mb-2" />
                      <p>No tags have been added yet</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="manage">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tag Name</label>
                    <Input
                      placeholder="Enter tag name"
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tag Color</label>
                    <div className="flex gap-4 items-center">
                      <Input
                        type="color"
                        value={newTagColor}
                        onChange={(e) => setNewTagColor(e.target.value)}
                        className="w-24 h-10 p-1 cursor-pointer"
                      />
                      <div className="flex-1">
                        <Badge 
                          className="w-full py-2 justify-center"
                          style={{ 
                            backgroundColor: newTagColor,
                            color: getPreviewTextColor(newTagColor)
                          }}
                        >
                          Preview: {newTagName || 'Tag Name'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 pt-4">
                    <Button 
                      onClick={editMode ? handleUpdateTag : handleAddTag}
                      className="w-full"
                      disabled={!newTagName.trim()}
                    >
                      {editMode ? 'Update' : 'Add'}
                    </Button>
                    {editMode && (
                      <Button 
                        variant="outline"
                        onClick={() => {
                          resetForm();
                          setActiveSubTab("list");
                        }}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="groups">
            <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="w-full">
              <div className="flex justify-center w-full mb-4">
                <TabsList className="w-[400px]">
                  <TabsTrigger value="list" className="w-full">List</TabsTrigger>
                  <TabsTrigger value="manage" className="w-full">
                    {editMode ? 'Edit' : 'Add'}
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="list">
                <div className="grid gap-2">
                  {groups.map((group) => (
                    <div key={group._id} 
                         className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/10 transition-colors">
                      <div className="space-y-1">
                        <div className="font-medium">{group.name}</div>
                        {group.description && (
                          <div className="text-sm text-muted-foreground">
                            {group.description}
                          </div>
                        )}
                        <div className="text-sm text-muted-foreground">
                          {stats.groups[group._id] || 0} passwords
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditGroup(group)}
                          className="hover:bg-accent"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteGroup(group._id)}
                          className="hover:bg-destructive hover:text-destructive-foreground"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {groups.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <AlertCircle className="mx-auto h-8 w-8 mb-2" />
                      <p>No groups have been added yet</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="manage">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Group Name</label>
                    <Input
                      placeholder="Enter group name"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Description</label>
                    <Input
                      placeholder="Enter group description"
                      value={newGroupDesc}
                      onChange={(e) => setNewGroupDesc(e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col gap-2 pt-4">
                    <Button 
                      onClick={editMode ? handleUpdateGroup : handleAddGroup}
                      className="w-full"
                      disabled={!newGroupName.trim()}
                    >
                      {editMode ? 'Update' : 'Add'}
                    </Button>
                    {editMode && (
                      <Button 
                        variant="outline"
                        onClick={() => {
                          resetForm();
                          setActiveSubTab("list");
                        }}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
