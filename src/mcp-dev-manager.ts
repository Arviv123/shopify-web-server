import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { spawn, ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

interface MCPServerInfo {
  id: string;
  name: string;
  status: 'building' | 'running' | 'stopped' | 'error';
  port?: number;
  created: string;
  code: string;
  dependencies: string[];
  packageJson?: string;
  process?: ChildProcess;
  logs: string[];
  description?: string;
  containerId?: string;
}

interface MCPClient {
  serverId: string;
  transport?: any;
  server?: any;
}

export class MCPDevManager {
  private servers: Map<string, MCPServerInfo> = new Map();
  private clients: Map<string, MCPClient> = new Map();
  private baseDir: string;
  private nextPort: number = 9000;
  
  constructor() {
    this.baseDir = path.join(process.cwd(), 'mcp-servers');
    this.ensureBaseDir();
  }
  
  private ensureBaseDir() {
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }
  
  async uploadServer(serverData: {
    name: string;
    code: string;
    dependencies: string[];
    packageJson?: string;
  }): Promise<{ success: boolean; error?: string; serverId?: string }> {
    try {
      const serverId = uuidv4();
      const serverInfo: MCPServerInfo = {
        id: serverId,
        name: serverData.name,
        status: 'building',
        created: new Date().toISOString(),
        code: serverData.code,
        dependencies: serverData.dependencies,
        packageJson: serverData.packageJson,
        logs: [],
        port: this.nextPort++
      };
      
      this.servers.set(serverId, serverInfo);
      
      // Create server directory
      const serverDir = path.join(this.baseDir, serverId);
      fs.mkdirSync(serverDir, { recursive: true });
      
      // Write server code
      fs.writeFileSync(path.join(serverDir, 'index.js'), serverData.code);
      
      // Create package.json
      const packageJson = serverData.packageJson ? 
        JSON.parse(serverData.packageJson) : 
        {
          name: serverData.name,
          version: '1.0.0',
          type: 'module',
          main: 'index.js',
          dependencies: {}
        };
      
      // Add dependencies to package.json
      serverData.dependencies.forEach(dep => {
        const [name, version] = dep.split('@');
        packageJson.dependencies[name] = version || 'latest';
      });
      
      fs.writeFileSync(
        path.join(serverDir, 'package.json'), 
        JSON.stringify(packageJson, null, 2)
      );
      
      // Create Dockerfile for the server
      const dockerfile = this.generateDockerfile(serverInfo);
      fs.writeFileSync(path.join(serverDir, 'Dockerfile'), dockerfile);
      
      // Build and run the server
      await this.buildAndRunServer(serverId);
      
      return { success: true, serverId };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
  
  private generateDockerfile(serverInfo: MCPServerInfo): string {
    return `
FROM node:20-alpine

WORKDIR /app

# Copy package.json and install dependencies
COPY package.json ./
RUN npm install

# Copy server code
COPY index.js ./

# Expose port
EXPOSE ${serverInfo.port}

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD node -e "console.log('healthy')" || exit 1

# Run server
CMD ["node", "index.js"]
`.trim();
  }
  
  private async buildAndRunServer(serverId: string): Promise<void> {
    const serverInfo = this.servers.get(serverId);
    if (!serverInfo) throw new Error('Server not found');
    
    const serverDir = path.join(this.baseDir, serverId);
    
    try {
      // Build Docker image
      const buildProcess = spawn('docker', ['build', '-t', `mcp-server-${serverId}`, '.'], {
        cwd: serverDir,
        stdio: 'pipe'
      });
      
      buildProcess.stdout?.on('data', (data) => {
        const log = `[BUILD] ${data.toString()}`;
        serverInfo.logs.push(log);
        console.log(log);
      });
      
      buildProcess.stderr?.on('data', (data) => {
        const log = `[BUILD ERROR] ${data.toString()}`;
        serverInfo.logs.push(log);
        console.error(log);
      });
      
      await new Promise((resolve, reject) => {
        buildProcess.on('close', (code) => {
          if (code === 0) {
            resolve(null);
          } else {
            reject(new Error(`Build failed with code ${code}`));
          }
        });
      });
      
      // Run Docker container
      const runProcess = spawn('docker', [
        'run', '--rm', '-d',
        '-p', `${serverInfo.port}:${serverInfo.port}`,
        '--name', `mcp-server-${serverId}`,
        `mcp-server-${serverId}`
      ]);
      
      runProcess.stdout?.on('data', (data) => {
        const containerId = data.toString().trim();
        serverInfo.containerId = containerId;
        serverInfo.status = 'running';
        this.servers.set(serverId, serverInfo);
      });
      
      runProcess.on('close', (code) => {
        if (code === 0) {
          serverInfo.logs.push('[RUN] Container started successfully');
        } else {
          serverInfo.status = 'error';
          serverInfo.logs.push(`[RUN ERROR] Container failed to start with code ${code}`);
        }
      });
      
    } catch (error: any) {
      serverInfo.status = 'error';
      serverInfo.logs.push(`[ERROR] ${error.message}`);
      this.servers.set(serverId, serverInfo);
      throw error;
    }
  }
  
  getServers(): MCPServerInfo[] {
    return Array.from(this.servers.values()).map(server => ({
      ...server,
      process: undefined, // Don't send process object to client
      logs: server.logs.slice(-50) // Only last 50 log entries
    }));
  }
  
  getServer(serverId: string): MCPServerInfo | null {
    const server = this.servers.get(serverId);
    return server ? {
      ...server,
      process: undefined,
      logs: server.logs.slice(-100)
    } : null;
  }
  
  async stopServer(serverId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const serverInfo = this.servers.get(serverId);
      if (!serverInfo) {
        return { success: false, error: 'Server not found' };
      }
      
      if (serverInfo.containerId) {
        const stopProcess = spawn('docker', ['stop', serverInfo.containerId]);
        
        await new Promise((resolve, reject) => {
          stopProcess.on('close', (code) => {
            if (code === 0) {
              resolve(null);
            } else {
              reject(new Error(`Stop failed with code ${code}`));
            }
          });
        });
      }
      
      serverInfo.status = 'stopped';
      serverInfo.containerId = undefined;
      this.servers.set(serverId, serverInfo);
      
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
  
  async restartServer(serverId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await this.stopServer(serverId);
      await this.buildAndRunServer(serverId);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
  
  async connectToServer(serverId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const serverInfo = this.servers.get(serverId);
      if (!serverInfo) {
        return { success: false, error: 'Server not found' };
      }
      
      if (serverInfo.status !== 'running') {
        return { success: false, error: 'Server is not running' };
      }
      
      // Create MCP client connection
      const client: MCPClient = {
        serverId: serverId
      };
      
      this.clients.set(serverId, client);
      
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
  
  async queryServer(serverId: string, query: string): Promise<any> {
    try {
      const client = this.clients.get(serverId);
      if (!client) {
        throw new Error('Not connected to server');
      }
      
      const serverInfo = this.servers.get(serverId);
      if (!serverInfo || serverInfo.status !== 'running') {
        throw new Error('Server is not running');
      }
      
      // Parse query (simple format: "tool_name {'param': 'value'}")
      const [toolName, paramsStr] = query.split(' ', 2);
      let params = {};
      
      if (paramsStr) {
        try {
          params = JSON.parse(paramsStr.replace(/'/g, '"'));
        } catch {
          params = { query: paramsStr };
        }
      }
      
      // Make HTTP request to the server container
      const response = await fetch(`http://localhost:${serverInfo.port}/mcp/call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: 'call_tool',
          params: {
            name: toolName,
            arguments: params
          }
        })
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }
      
      return await response.json();
    } catch (error: any) {
      throw new Error(`Query failed: ${error.message}`);
    }
  }
  
  getServerLogs(serverId: string): { logs: string; error?: string } {
    const serverInfo = this.servers.get(serverId);
    if (!serverInfo) {
      return { logs: '', error: 'Server not found' };
    }
    
    return { logs: serverInfo.logs.join('\n') };
  }
}