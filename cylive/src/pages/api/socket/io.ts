import { Server as NetServer } from "http";
import { NextApiRequest } from "next";
import { Server as ServerIO } from "socket.io";
import { NextApiResponseServerIO } from "../../../types/socket";
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";

export const config = {
  api: {
    bodyParser: false,
  },
};

const ioHandler = async (req: NextApiRequest, res: NextApiResponseServerIO) => {
  if (!res.socket.server.io) {
    const path = "/api/socket/io";
    const httpServer: NetServer = res.socket.server;
    const io = new ServerIO(httpServer, {
      path: path,
      addTrailingSlash: false,
    });

    try {
      const pubClient = createClient({
        url: process.env.REDIS_URL || "redis://localhost:6379",
      });
      const subClient = pubClient.duplicate();
      await pubClient.connect();
      await subClient.connect();
      io.adapter(createAdapter(pubClient, subClient));
      console.log("[Socket.io] Redis Adapter connected successfully.");
    } catch (e) {
      console.error(
        "[Socket.io] Redis connection error, falling back to in-memory adapter:",
        e,
      );
    }

    io.on("connection", (socket) => {
      console.log("[Socket.io] New connection:", socket.id);

      socket.on("join-stream", async (streamId: string) => {
        const roomName = `stream:${streamId}`;
        socket.join(roomName);

        // Fetch cross-node viewer count (an approximation or direct map)
        // With Redis adapter, we can use fetchSockets() to get a global count if needed,
        // but for high scale standard size works best if we use server-side aggregation.
        // As a quick fix, io.in(room).fetchSockets() returns the global count across redis.
        const sockets = await io.in(roomName).fetchSockets();
        const count = sockets.length;

        io.to(roomName).emit("viewer-count", { count });
        console.log(
          `[Socket.io] Socket ${socket.id} joined ${roomName}. Total: ${count}`,
        );

        socket.on("disconnect", async () => {
          // Delay briefly to allow socket leave event processing across Redis before counting
          setTimeout(async () => {
            const updatedSockets = await io.in(roomName).fetchSockets();
            io.to(roomName).emit("viewer-count", {
              count: updatedSockets.length,
            });
          }, 500);
          console.log("[Socket.io] Disconnected:", socket.id);
        });
      });

      socket.on(
        "send-message",
        (data: {
          streamId: string;
          content: string;
          user: string;
          badge?: string;
        }) => {
          io.to(`stream:${data.streamId}`).emit("message", data);
        },
      );

      socket.on(
        "send-tip",
        (data: { streamId: string; amount: number; user: string }) => {
          io.to(`stream:${data.streamId}`).emit("tip", data);
        },
      );
    });

    res.socket.server.io = io;
  }

  res.end();
};

export default ioHandler;
