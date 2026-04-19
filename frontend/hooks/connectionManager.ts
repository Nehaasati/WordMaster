import { HubConnection } from "@microsoft/signalr";
import { createConnection } from "./connection";

class SignalRManager {
  private connection: HubConnection | null = null;
  private starting: Promise<void> | null = null;

  getConnection(): HubConnection {
    if (!this.connection) {
      this.connection = createConnection();
    }
    return this.connection;
  }

  async start(): Promise<HubConnection> {
    const conn = this.getConnection();

    if (conn.state === "Connected") return conn;

    if (this.starting) {
      await this.starting;
      return conn;
    }

    this.starting = conn
      .start()
      .then(() => {
        console.log("SignalR connected:", conn.connectionId);
      })
      .catch((err) => {
        console.error("SignalR start error:", err);
        throw err;
      })
      .finally(() => {
        this.starting = null;
      });

    await this.starting;
    return conn;
  }

  async stop() {
    if (this.connection && this.connection.state === "Connected") {
      await this.connection.stop();
    }
  }
}

export const signalRManager = new SignalRManager();
