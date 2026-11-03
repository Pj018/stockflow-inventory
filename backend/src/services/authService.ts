import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { ENV } from '../config/env';
import { AppError } from '../middlewares/errorHandler';
import { SignupInput, LoginInput } from '../validators/authValidator';

export class AuthService {
  static async signup(input: SignupInput) {
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase().trim() },
    });

    if (existingUser) {
      throw new AppError('An account with this email address already exists.', 409);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(input.password, salt);

    // Create organization and initial admin/owner user in a single atomic transaction
    const result = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name: input.organizationName.trim(),
          defaultLowStockThreshold: 5,
        },
      });

      const user = await tx.user.create({
        data: {
          email: input.email.toLowerCase().trim(),
          password: hashedPassword,
          organizationId: org.id,
        },
        select: {
          id: true,
          email: true,
          organizationId: true,
          createdAt: true,
        },
      });

      return { user, organization: org };
    });

    const token = jwt.sign(
      {
        userId: result.user.id,
        email: result.user.email,
        organizationId: result.organization.id,
      },
      ENV.JWT_SECRET,
      { expiresIn: ENV.JWT_EXPIRES_IN as any }
    );

    return {
      token,
      user: result.user,
      organization: {
        id: result.organization.id,
        name: result.organization.name,
        defaultLowStockThreshold: result.organization.defaultLowStockThreshold,
      },
    };
  }

  static async login(input: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase().trim() },
      include: {
        organization: true,
      },
    });

    if (!user) {
      throw new AppError('No account found with this email address. Please check your spelling or sign up.', 401, { field: 'email' });
    }

    const isMatch = await bcrypt.compare(input.password, user.password);
    if (!isMatch) {
      throw new AppError('Incorrect password. Please verify your password and try again.', 401, { field: 'password' });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        organizationId: user.organizationId,
      },
      ENV.JWT_SECRET,
      { expiresIn: ENV.JWT_EXPIRES_IN as any }
    );

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        organizationId: user.organizationId,
        createdAt: user.createdAt,
      },
      organization: {
        id: user.organization.id,
        name: user.organization.name,
        defaultLowStockThreshold: user.organization.defaultLowStockThreshold,
      },
    };
  }

  static async getProfile(userId: string, organizationId: string) {
    const user = await prisma.user.findFirst({
      where: { id: userId, organizationId },
      select: {
        id: true,
        email: true,
        organizationId: true,
        createdAt: true,
        organization: {
          select: {
            id: true,
            name: true,
            defaultLowStockThreshold: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError('User profile not found.', 404);
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        organizationId: user.organizationId,
        createdAt: user.createdAt,
      },
      organization: user.organization,
    };
  }
}
