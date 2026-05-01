import { Router } from 'express';
import { getAllUsers, createUser, toggleUserStatus, updateProfile, updatePassword } from '../controllers/user.controller';
import { verifyToken, requireRole } from '../middleware/auth';

const router = Router();

// Routes for self profile (any logged in user)
router.put('/profile', verifyToken, updateProfile);
router.put('/password', verifyToken, updatePassword);

// Both admin and petugas can list users (petugas needs nasabah list for setoran)
router.get('/', verifyToken, requireRole(['admin', 'petugas']), getAllUsers);

// Only admin can create/edit users
router.use(verifyToken, requireRole(['admin']));
router.post('/', createUser);
router.patch('/:id/status', toggleUserStatus);

export default router;
