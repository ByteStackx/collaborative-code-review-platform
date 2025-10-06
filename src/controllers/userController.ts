import { Request, Response } from 'express';
import { getUserById, updateUser, deleteUser } from '../services/userService';

export async function getProfile(req: Request, res: Response) {
  const { id } = req.params;
  if (!id) return res.status(400).json({ message: 'Missing id param' });
  const user = await getUserById(id as string);
  if (!user) return res.status(404).json({ message: 'User not found' });
  return res.json(user);
}

export async function updateProfile(req: Request, res: Response) {
  const { id } = req.params;
  if (!id) return res.status(400).json({ message: 'Missing id param' });
  const { email, name, password, role } = req.body || {};
  const updated = await updateUser(id as string, { email, name, password, role });
  if (!updated) return res.status(404).json({ message: 'User not found' });
  return res.json(updated);
}

export async function deleteProfile(req: Request, res: Response) {
  const { id } = req.params;
  if (!id) return res.status(400).json({ message: 'Missing id param' });
  await deleteUser(id as string);
  return res.status(204).send();
}
