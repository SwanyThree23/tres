import { Server as NetServer } from "http";
import { NextApiRequest } from "next";
import { Server as ServerIO } from "socket.io";
import { NextApiResponseServerIO } from "../../../types/socket";

export const config = {
  api: {
    bodyParser: false,
  },
};

const ioHandler = (req: NextApiRequest, res: NextApiResponseServerIO) => {
  if (!res.socket.server.io) {
    const path = "/api/socket/io";
    const httpServer: NetServer = res.socket.server as unknown as NetServer;
    const io = new ServerIO(httpServer, {
      path: path,
      addTrailingSlash: false,
    });

    const streamViewers = new Map<string, Set<string>>();

    io.on("connection", (socket) => {
      console.log("[Socket.io] New connection:", socket.id);

      socket.on("join-stream", (streamId: string) => {
        socket.join(`stream:${streamId}`);

        // Track viewer
        if (!streamViewers.has(streamId)) {
          streamViewers.set(streamId, new Set());
        }
        streamViewers.get(streamId)?.add(socket.id);

        // Broadcast new viewer count
        const count = streamViewers.get(streamId)?.size || 0;
        io.to(`stream:${streamId}`).emit("viewer-count", { count });

        console.log(
          `[Socket.io] Socket ${socket.id} joined stream:${streamId}. Total: ${count}`,
        );

        socket.on("disconnect", () => {
          streamViewers.get(streamId)?.delete(socket.id);
          const newCount = streamViewers.get(streamId)?.size || 0;
          io.to(`stream:${streamId}`).emit("viewer-count", { count: newCount });
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
