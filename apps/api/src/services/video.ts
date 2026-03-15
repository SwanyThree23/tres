// ─────────────────────────────────────────────────────────────────────────────
// CY Live — Video Service  |  VDO.Ninja WebRTC + MediaMTX RTMP
// ─────────────────────────────────────────────────────────────────────────────

import crypto from 'crypto';
import prisma from '../lib/prisma.js';
import logger from '../lib/logger.js';

const MEDIAMTX_API = process.env.MEDIAMTX_API_URL ?? 'http://localhost:9997';
const VDO_NINJA_URL = process.env.VDO_NINJA_URL ?? 'https://vdo.ninja';

/**
 * Generate a unique stream key for a stage
 */
export async function generateStreamKey(stageId: string, userId: string, platform: string) {
  const key = `cylive_${crypto.randomBytes(16).toString('hex')}`;

  const streamKey = await prisma.streamKey.create({
    data: {
      key,
      platform: platform as any,
      stageId,
      userId,
      rtmpUrl: `rtmp://${process.env.RTMP_HOST ?? 'localhost'}/live/${key}`,
    },
  });

  logger.info({ stageId, platform, keyId: streamKey.id }, 'Stream key generated');

  return {
    id: streamKey.id,
    key,
    rtmpUrl: streamKey.rtmpUrl,
    platform: streamKey.platform,
  };
}

/**
 * Revoke / deactivate a stream key
 */
export async function revokeStreamKey(keyId: string, userId: string) {
  const streamKey = await prisma.streamKey.findUnique({ where: { id: keyId } });
  if (!streamKey || streamKey.userId !== userId) {
    throw new Error('Stream key not found');
  }

  await prisma.streamKey.update({
    where: { id: keyId },
    data: { isActive: false },
  });

  logger.info({ keyId }, 'Stream key revoked');
  return { success: true };
}

/**
 * Get VDO.Ninja room configuration
 */
export function getVdoNinjaConfig(stageId: string, role: 'host' | 'guest' | 'viewer') {
  const roomId = `cylive-${stageId}`;
  const password = crypto.randomBytes(8).toString('hex');

  const params: Record<string, string> = {
    room: roomId,
    password,
  };

  switch (role) {
    case 'host':
      params['push'] = roomId;
      params['director'] = roomId;
      break;
    case 'guest':
      params['push'] = roomId;
      break;
    case 'viewer':
      params['view'] = roomId;
      params['scene'] = '1';
      break;
  }

  const queryString = new URLSearchParams(params).toString();
  return {
    url: `${VDO_NINJA_URL}/?${queryString}`,
    roomId,
    password,
    role,
  };
}

/**
 * Check MediaMTX stream status
 */
export async function getStreamStatus(streamKey: string) {
  try {
    const response = await fetch(`${MEDIAMTX_API}/v3/paths/list`);
    const data = await response.json() as { items: Array<{ name: string; ready: boolean; readers: { count: number } }> };

    const path = data.items?.find((p: any) => p.name === streamKey);
    return {
      isLive: !!path?.ready,
      viewers: path?.readers?.count ?? 0,
    };
  } catch (err) {
    logger.error({ err, streamKey }, 'Failed to check MediaMTX status');
    return { isLive: false, viewers: 0 };
  }
}

/**
 * Get active stream keys for a stage
 */
export async function getStageStreamKeys(stageId: string, userId: string) {
  return prisma.streamKey.findMany({
    where: { stageId, userId, isActive: true },
  });
}
