import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

@Injectable()
export class RefreshTokensService {
  constructor(private readonly prisma: PrismaService) {}

  generateTokenString(): string {
    return randomBytes(48).toString('hex');
  }

  getExpiryDate(): Date {
    const ttl = process.env.JWT_REFRESH_EXPIRES_IN || '30d';
    const m = ttl.match(/^(\d+)([smhd])?$/);
    let ms = 30 * 24 * 60 * 60 * 1000;
    if (m) {
      const n = parseInt(m[1], 10);
      const unit = m[2] || 's';
      const mult: Record<string, number> = {
        s: 1000,
        m: 60000,
        h: 3600000,
        d: 86400000,
      };
      ms = n * (mult[unit] ?? 1000);
    }
    return new Date(Date.now() + ms);
  }

  async create(
    userId: string,
    tokenPlain: string,
    meta?: { userAgent?: string; ip?: string },
  ) {
    const hashedToken = await bcrypt.hash(tokenPlain, 10);
    const expiresAt = this.getExpiryDate();
    return this.prisma.refreshToken.create({
      data: {
        userId,
        hashedToken,
        expiresAt,
        userAgent: meta?.userAgent ?? null,
        ip: meta?.ip ?? null,
      },
    });
  }

  async verifyAndConsume(userId: string, tokenPlain: string) {
    const tokens = await this.prisma.refreshToken.findMany({
      where: { userId, revokedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    const now = new Date();
    for (const t of tokens) {
      if (t.expiresAt <= now) continue;
      const ok = await bcrypt.compare(tokenPlain, t.hashedToken);
      if (ok) {
        await this.prisma.refreshToken.update({
          where: { id: t.id },
          data: { revokedAt: now },
        });
        return true;
      }
    }
    return false;
  }

  async revokeAllForUser(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
