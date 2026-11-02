import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from '../config/env';
import { UserModel } from '../modules/users/user.model';
import { UserRole } from '../shared/constants/roles';

async function bootstrapAdmin() {
  console.log('[Bootstrap] Initializing admin account setup...');

  const email = (process.argv[2] || process.env.BOOTSTRAP_ADMIN_EMAIL || 'admin@mafimushkil.com').trim().toLowerCase();
  const password = process.argv[3] || process.env.BOOTSTRAP_ADMIN_PASSWORD || 'Admin@123456';
  const name = process.argv[4] || process.env.BOOTSTRAP_ADMIN_NAME || 'Mafi Mushkil Admin';

  if (!email || !email.includes('@')) {
    console.error('[Bootstrap] Error: Valid email address is required.');
    process.exit(1);
  }

  if (!password || password.length < 8) {
    console.error('[Bootstrap] Error: Password must be at least 8 characters long.');
    process.exit(1);
  }

  try {
    await mongoose.connect(config.mongoUri);
    console.log('[Bootstrap] Connected to database.');

    const passwordHash = await bcrypt.hash(password, 10);

    // Check if an admin or owner account already exists
    let existingUser = await UserModel.findOne({ email });

    if (existingUser) {
      existingUser.role = UserRole.ADMIN;
      existingUser.passwordHash = passwordHash;
      existingUser.isActive = true;
      existingUser.mustChangePassword = false;
      if (!existingUser.name) existingUser.name = name;
      await existingUser.save();
      console.log(`[Bootstrap] Successfully updated existing account ${email} to ADMIN role with new secure password.`);
    } else {
      const newAdmin = await UserModel.create({
        name,
        email,
        phone: '+919999900000',
        passwordHash,
        role: UserRole.ADMIN,
        isActive: true,
        mustChangePassword: false,
        avatarInitial: name.charAt(0).toUpperCase(),
      });
      console.log(`[Bootstrap] Created new ADMIN account ${email} (ID: ${newAdmin._id}).`);
    }

    console.log('[Bootstrap] Admin account is active and ready for login.');
  } catch (err: any) {
    console.error('[Bootstrap] Failed to bootstrap admin:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('[Bootstrap] Database disconnected.');
  }
}

bootstrapAdmin();

