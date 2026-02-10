/**
 * Guest Streaming Manager
 * Handles individual guest RTMP fanout via FFmpeg subprocesses.
 * Each guest can stream to their own set of destinations (YouTube, Twitch, etc.)
 */

import { spawn, ChildProcess } from 'child_process';
import Redis from 'ioredis';
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
   * Spawns isolated FFmpeg process for each guest destination.
   * Stream keys are decrypted from the SwanyThree Vault at runtime.
   */
  async startFanout(guestId: string, inputStream: string, destinations: StreamDestination[]) {
    const guestProcesses: ChildProcess[] = [];

    for (const dest of destinations) {
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
