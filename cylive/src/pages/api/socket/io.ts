import { Server as NetServer } from "http";
import { NextApiRequest } from "next";
import { Server as ServerIO } from "socket.io";
import { NextApiResponseServerIO } from "@/types/socket";

export const config = {
  api: {
    bodyParser: false,
  },
};

const ioHandler = (req: NextApiRequest, res: NextApiResponseServerIO) => {
  if (!res.socket.server.io) {
    const path = "/api/socket/io";
    const httpServer: NetServer = res.socket.server as any;
    const io = new ServerIO(httpServer, {
      path: path,
      addTrailingSlash: false,
    });

    io.on("connection", (socket) => {
      console.log("[Socket.io] New connection:", socket.id);

      socket.on("join-stream", (streamId: string) => {
        socket.join(`stream:${streamId}`);
        console.log(
          `[Socket.io] Socket ${socket.id} joined stream:${streamId}`,
        );
      });

      socket.on(
        "send-message",
        (data: { streamId: string; content: string; user: any }) => {
          io.to(`stream:${data.streamId}`).emit("message", data);
        },
      );

      socket.on("disconnect", () => {
        console.log("[Socket.io] Disconnected:", socket.id);
      });
    });

    res.socket.server.io = io;
  }

  res.end();
};

export default ioHandler;
