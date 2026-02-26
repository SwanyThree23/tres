/**
 * Guest Streaming Manager
 * Handles individual guest RTMP fanout via FFmpeg subprocesses.
 * Each guest can stream to their own set of destinations (YouTube, Twitch, etc.)
 *
 * COMPLIANCE FIX: Multistreaming compliance acknowledgment required.
 * Stream keys are never returned to the frontend API.
 */

import { spawn, ChildProcess } from 'child_process';
import Redis from 'ioredis';
import mongoose from 'mongoose';
import { Vault } from '../utils/vault';

export interface StreamDestination {
  platform: string;
  url: string;
  encryptedKey: string;
}

export class GuestStreamingManager {
  private redis: Redis;
  private processes: Map<string, ChildProcess[]>;

  constructor(redis: Redis) {
    this.redis = redis;
    this.processes = new Map();
  }

  /**
   * Check if a guest has acknowledged the multistreaming compliance terms.
   * Guests must confirm they are not violating exclusivity agreements
   * with platforms like Twitch (Affiliate/Partner 24-hour exclusivity).
   */
  async hasComplianceAck(guestId: string): Promise<boolean> {
    const ack = await mongoose.connection
      .collection('multistream_acks')
      .findOne({ guestId, acknowledged: true });
    return !!ack;
  }

  /**
   * Record the guest's multistreaming compliance acknowledgment.
   */
  async recordComplianceAck(guestId: string): Promise<void> {
    await mongoose.connection.collection('multistream_acks').updateOne(
      { guestId },
      {
        $set: {
          acknowledged: true,
          acknowledgedAt: new Date(),
          terms: 'I confirm that streaming to multiple platforms simultaneously does not violate my agreements with those platforms (e.g., Twitch Affiliate/Partner exclusivity).',
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true }
    );
  }

  /**
   * Spawns isolated FFmpeg process for each guest destination.
   * Stream keys are decrypted from the SwanyThree Vault at runtime
   * and NEVER returned to the frontend or any API response.
   *
   * COMPLIANCE: Requires multistreaming acknowledgment before starting.
   */
  async startFanout(guestId: string, inputStream: string, destinations: StreamDestination[]) {
    // Enforce compliance acknowledgment
    const hasAck = await this.hasComplianceAck(guestId);
    if (!hasAck) {
      throw new Error(
        'Multistreaming compliance acknowledgment required. ' +
        'Please confirm you are not violating platform exclusivity agreements.'
      );
    }

    const guestProcesses: ChildProcess[] = [];

    for (const dest of destinations) {
      // Stream key decrypted server-side only — never sent to client
      const streamKey = Vault.decrypt(dest.encryptedKey);
      const rtmpUrl = `${dest.url}/${streamKey}`;

      const ffmpeg = spawn('ffmpeg', [
        '-re',
        '-i', inputStream,
        '-c:v', 'libx264', '-preset', 'veryfast', '-b:v', '3000k',
        '-c:a', 'aac', '-b:a', '128k',
        '-f', 'flv',
        rtmpUrl,
      ]);

      ffmpeg.stderr.on('data', (data) => {
        console.log(`Guest ${guestId} Fanout [${dest.platform}]: ${data}`);
      });

      ffmpeg.on('exit', (code) => {
        console.log(`Guest ${guestId} FFmpeg [${dest.platform}] exited with code ${code}`);
      });

      if (ffmpeg.pid) {
        // Only store PID (not stream key) in Redis
        await this.redis.hset(`fanout:${guestId}`, dest.platform, ffmpeg.pid.toString());
      }

      guestProcesses.push(ffmpeg);
    }

    this.processes.set(guestId, guestProcesses);
  }

  /**
   * Stop all fanout processes for a guest.
   */
  async stopFanout(guestId: string) {
    const procs = this.processes.get(guestId);
    if (procs) {
      procs.forEach((p) => p.kill('SIGTERM'));
      this.processes.delete(guestId);
    }
    await this.redis.del(`fanout:${guestId}`);
  }
}
