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
import { Trash2, Plus, Settings2, Edit } from "lucide-react";

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
        title: "Hata",
        description: "Veriler yüklenirken hata oluştu",
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
        toast({
          title: "Başarılı",
          description: "Etiket eklendi",
        });
      }
    } catch (error) {
      toast({
        title: "Hata",
        description: "Etiket eklenirken hata oluştu",
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
        resetForm();
        toast({
          title: "Başarılı",
          description: "Etiket güncellendi",
        });
      }
    } catch (error) {
      toast({
        title: "Hata",
        description: "Etiket güncellenirken hata oluştu",
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
        toast({
          title: "Başarılı",
          description: "Etiket silindi",
        });
      }
    } catch (error) {
      toast({
        title: "Hata",
        description: "Etiket silinirken hata oluştu",
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
        resetForm();
        toast({
          title: "Başarılı",
          description: "Grup eklendi",
        });
      }
    } catch (error) {
      toast({
        title: "Hata",
        description: "Grup eklenirken hata oluştu",
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
        resetForm();
        toast({
          title: "Başarılı",
          description: "Grup güncellendi",
        });
      }
    } catch (error) {
      toast({
        title: "Hata",
        description: "Grup güncellenirken hata oluştu",
        variant: "destructive",
      });
    }
  };
  
  const handleDeleteGroup = async (id: string) => {
    try {
      const response = await fetch(`/api/groups/${id}`, {
        method: "DELETE",
      });
  
      if (response.ok) {
        setGroups(prev => prev.filter(group => group._id !== id));
        await fetchAttributesAndStats();
        toast({
          title: "Başarılı",
          description: "Grup silindi",
        });
      }
    } catch (error) {
      toast({
        title: "Hata",
        description: "Grup silinirken hata oluştu",
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
        <Button variant="outline">
          <Settings2 className="h-4 w-4 mr-2" />
          Nitelik Yönetimi
        </Button>
      </DialogTrigger>
      <DialogContent className="min-w-[600px]">
        <DialogHeader>
          <DialogTitle>Nitelik Yönetimi</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="tags" className="w-full">Etiketler</TabsTrigger>
            <TabsTrigger value="groups" className="w-full">Gruplar</TabsTrigger>
          </TabsList>

          <TabsContent value="tags">
            <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
              <TabsList>
                <TabsTrigger value="list">Listele</TabsTrigger>
                <TabsTrigger value="manage">
                  {editMode ? 'Düzenle' : 'Ekle'}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="list" className="space-y-4">
                <div className="grid gap-2">
                  {tags.map((tag) => (
                    <div key={tag._id} 
                         className="flex items-center justify-between p-2 border rounded-md">
                      <div className="flex items-center gap-2">
                        <Badge style={{ backgroundColor: tag.color }}>
                          {tag.name}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          ({stats.tags[tag._id] || 0} şifre)
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditClick(tag)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTag(tag._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="manage">
                <div className="space-y-4">
                  <Input
                    placeholder="Etiket adı"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                  />
                  <div className="flex gap-2 items-center">
                    <span>Renk:</span>
                    <Input
                      type="color"
                      value={newTagColor}
                      onChange={(e) => setNewTagColor(e.target.value)}
                      className="w-20"
                    />
                  </div>
                  <Button 
                    onClick={editMode ? handleUpdateTag : handleAddTag}
                    className="w-full"
                  >
                    {editMode ? 'Güncelle' : 'Ekle'}
                  </Button>
                  {editMode && (
                    <Button 
                      variant="outline"
                      onClick={() => {
                        resetForm();
                        setActiveSubTab("list"); // İptal edilince listeye dön
                      }}
                      className="w-full"
                    >
                      İptal
                    </Button>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="groups">
  <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
    <TabsList>
      <TabsTrigger value="list">Listele</TabsTrigger>
      <TabsTrigger value="manage">
        {editMode ? 'Düzenle' : 'Ekle'}
      </TabsTrigger>
    </TabsList>

    <TabsContent value="list" className="space-y-4">
      <div className="grid gap-2">
        {groups.map((group) => (
          <div key={group._id} 
               className="flex items-center justify-between p-2 border rounded-md">
            <div>
              <div className="font-medium">{group.name}</div>
              {group.description && (
                <div className="text-sm text-muted-foreground">
                  {group.description}
                </div>
              )}
              <span className="text-sm text-muted-foreground">
                ({stats.groups[group._id] || 0} şifre)
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEditGroup(group)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteGroup(group._id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </TabsContent>

    <TabsContent value="manage">
      <div className="space-y-4">
        <Input
          placeholder="Grup adı"
          value={newGroupName}
          onChange={(e) => setNewGroupName(e.target.value)}
        />
        <Input
          placeholder="Açıklama"
          value={newGroupDesc}
          onChange={(e) => setNewGroupDesc(e.target.value)}
        />
        <Button 
          onClick={editMode ? handleUpdateGroup : handleAddGroup}
          className="w-full"
        >
          {editMode ? 'Güncelle' : 'Ekle'}
        </Button>
        {editMode && (
          <Button 
            variant="outline"
            onClick={() => {
              resetForm();
              setActiveSubTab("list");
            }}
            className="w-full"
          >
            İptal
          </Button>
        )}
      </div>
    </TabsContent>
  </Tabs>
</TabsContent>
</Tabs>

      </DialogContent>
    </Dialog>
  );
}