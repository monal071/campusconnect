const { createUser, getUserByEmail, validatePassword } = require('../../../utils/user-model');
const jwt = require('jsonwebtoken');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { email, password, name, role, action, adminPassword } = req.body;

  try {
    if (action === 'register') {
      if (!email || !password || !name || !role) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      // Validate admin password if user is trying to register as admin
      if (role === 'admin' && adminPassword !== '12345678') {
        return res.status(403).json({ message: 'Invalid admin password' });
      }

      const existingUser = await getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }

      await createUser({ email, password, name, role });
      const token = jwt.sign(
        { email: email.toLowerCase(), name, role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      return res.status(200).json({ token, user: { email: email.toLowerCase(), name, role } });
    }

    if (action === 'login') {
      if (!email || !password) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      const user = await getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const isValid = await validatePassword(user, password);
      if (!isValid) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { email: user.email, name: user.name, role: user.role || 'user' },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      return res.status(200).json({ token, user: { email: user.email, name: user.name, role: user.role || 'user' } });
    }

    return res.status(400).json({ message: 'Invalid action' });
  } catch (error) {
    console.error('Authentication error:', error);
    if (error.message && error.message.includes('Failed to connect to MongoDB')) {
      return res.status(503).json({ message: 'Database unavailable. Please try again later.' });
    }
    return res.status(500).json({ message: 'Internal server error' });
  }
}
