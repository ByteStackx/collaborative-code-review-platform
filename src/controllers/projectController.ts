import { Request, Response } from 'express';
import { addMember, createProject, getProjectById, listProjects, removeMember } from '../services/projectService';

export async function createProjectHandler(req: Request, res: Response) {
  const { name, description } = req.body || {};
  if (!name) return res.status(400).json({ message: 'name is required' });
  const creatorId = req.user?.sub;
  if (!creatorId) return res.status(401).json({ message: 'Unauthorized' });
  const project = await createProject(name, description, creatorId);
  return res.status(201).json(project);
}

export async function listProjectsHandler(_req: Request, res: Response) {
  const projects = await listProjects();
  return res.json(projects);
}

export async function addMemberHandler(req: Request, res: Response) {
  const { id } = req.params;
  const { userId } = req.body || {};
  if (!id || !userId) return res.status(400).json({ message: 'id and userId are required' });
  const project = await getProjectById(id);
  if (!project) return res.status(404).json({ message: 'Project not found' });
  const member = await addMember(id, userId);
  return res.status(201).json(member);
}

export async function removeMemberHandler(req: Request, res: Response) {
  const { id, userId } = req.params as { id: string; userId: string };
  const project = await getProjectById(id);
  if (!project) return res.status(404).json({ message: 'Project not found' });
  await removeMember(id, userId);
  return res.status(204).send();
}
