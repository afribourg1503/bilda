import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, FolderOpen } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getProjects as getProjectsDb, createProject as createProjectDb, subscribeToProjects } from '@/lib/database';
import { toast } from '@/components/ui/use-toast';

interface Project {
  id: string;
  name: string;
  emoji: string;
  color: string;
  is_public: boolean;
}

interface ProjectSelectorProps {
  selectedProject: string | null;
  onProjectChange: (projectId: string | null) => void;
}

const ProjectSelector: React.FC<ProjectSelectorProps> = ({
  selectedProject,
  onProjectChange,
}) => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const [newProject, setNewProject] = useState({
    name: '',
    emoji: '🚀',
    color: 'bg-purple-500',
    is_public: true,
  });

  const selectedProjectData = projects.find(p => p.id === selectedProject);

  const handleCreateProject = async () => {
    if (!user) {
      toast({ title: 'You must be logged in', variant: 'destructive' as any });
      return;
    }
    if (!newProject.name.trim()) return;
    const { data, error } = await createProjectDb({
      name: newProject.name,
      emoji: newProject.emoji,
      color: newProject.color,
      is_public: newProject.is_public,
      user_id: user.id,
    });
    if (error) {
      toast({ title: 'Failed to create project', description: error.message, variant: 'destructive' as any });
      return;
    }
    if (data) {
      const project: Project = {
        id: (data as any).id,
        name: (data as any).name,
        emoji: (data as any).emoji,
        color: (data as any).color,
        is_public: Boolean((data as any).is_public),
      };
      setProjects(prev => [...prev, project]);
      onProjectChange(project.id);
      setNewProject({ name: '', emoji: '🚀', color: 'bg-purple-500', is_public: true });
      toast({ title: 'Project created', description: project.name });
    }
  };

  useEffect(() => {
    const mapDbToProject = (p: any): Project => ({
      id: p.id,
      name: p.name,
      emoji: p.emoji ?? '🚀',
      color: p.color ?? 'bg-purple-500',
      is_public: Boolean(p.is_public),
    });
    const run = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const { data, error } = await getProjectsDb(user.id);
        if (!error && data) setProjects(data.map(mapDbToProject));
      } finally {
        setLoading(false);
      }
    };
    run();
    const ch = user
      ? subscribeToProjects(user.id, () => {
          getProjectsDb(user.id).then(({ data }) => {
            if (data) setProjects(data.map(mapDbToProject));
          });
        })
      : null;
    return () => { try { ch?.unsubscribe(); } catch {} };
  }, [user]);

  const colorOptions = [
    { value: 'bg-purple-500', label: 'Purple' },
    { value: 'bg-pink-500', label: 'Pink' },
    { value: 'bg-blue-500', label: 'Blue' },
    { value: 'bg-green-500', label: 'Green' },
    { value: 'bg-orange-500', label: 'Orange' },
    { value: 'bg-red-500', label: 'Red' },
    { value: 'bg-yellow-500', label: 'Yellow' },
    { value: 'bg-indigo-500', label: 'Indigo' },
  ];

  const emojiOptions = [
    '🚀', '🎨', '⚡', '💻', '🎯', '🔥', '📱', '🌐', '🔧', '📊',
    '🎮', '📚', '🎵', '🎬', '🏠', '🚗', '✈️', '🏥', '🎓', '💼'
  ];

  return (
    <div className="flex items-center space-x-2">
      {selectedProjectData ? (
        <Badge 
          variant="outline" 
          className={`${selectedProjectData.color} text-white border-0 cursor-pointer hover:opacity-80`}
          onClick={() => onProjectChange(null)}
        >
          {selectedProjectData.emoji} {selectedProjectData.name}
        </Badge>
      ) : (
        <Button variant="outline" size="sm" className="text-gray-600 hover:text-gray-900">
          <FolderOpen className="w-4 h-4 mr-2" />
          Select Project
        </Button>
      )}

      <Dialog>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm">
            <Plus className="w-4 h-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md bg-white border-gray-200">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Create New Project</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="project-name">Project Name</Label>
              <Input
                id="project-name"
                placeholder="My Awesome Project"
                value={newProject.name}
                onChange={(e) => setNewProject(prev => ({ ...prev, name: e.target.value }))}
                className="bg-white border-gray-200 text-gray-900"
              />
            </div>

            <div className="space-y-2">
              <Label>Emoji</Label>
              <div className="grid grid-cols-10 gap-2">
                {emojiOptions.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => setNewProject(prev => ({ ...prev, emoji }))}
                    className={`p-2 rounded-lg text-lg hover:bg-gray-100 ${
                      newProject.emoji === emoji ? 'bg-blue-100 text-blue-700 border-2 border-blue-300' : ''
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Color</Label>
              <div className="grid grid-cols-4 gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setNewProject(prev => ({ ...prev, color: color.value }))}
                    className={`h-8 rounded-lg ${color.value} ${
                      newProject.color === color.value ? 'ring-2 ring-offset-2 ring-primary' : ''
                    }`}
                    title={color.label}
                  />
                ))}
              </div>
            </div>

            <div className="flex space-x-2 pt-4">
              <Button 
                variant="outline" 
                className="flex-1 bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                onClick={() => setNewProject({ name: '', emoji: '🚀', color: 'bg-purple-500', is_public: true })}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateProject}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                disabled={!newProject.name.trim()}
              >
                Create Project
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Project Selection Dropdown */}
      {projects.length > 0 && (
        <Select value={selectedProject || ''} onValueChange={onProjectChange}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select a project" />
          </SelectTrigger>
          <SelectContent>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                <div className="flex items-center space-x-2">
                  <span>{project.emoji}</span>
                  <span>{project.name}</span>
                  {!project.is_public && (
                    <Badge variant="secondary" className="text-xs">Private</Badge>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
};

export default ProjectSelector; 