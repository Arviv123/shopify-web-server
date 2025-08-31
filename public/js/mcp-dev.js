// MCP Development Platform - Modern JS Components
class MCPDevPlatform {
    constructor() {
        this.servers = new Map();
        this.clients = new Map();
        this.connectedServer = null;
        this.currentClient = null;
        this.autoScrollEnabled = true;
        this.responseTab = 'formatted';
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.createComponents();
        await this.loadServerList();
        this.startAutoRefresh();
        console.log('🛠️ MCP Development Platform initialized');
    }

    createComponents() {
        this.createServerUploadComponent();
        this.createServerListComponent();
        this.createMCPClientComponent();
        this.createLogsComponent();
    }

    createServerUploadComponent() {
        const uploadSection = document.getElementById('upload-section');
        uploadSection.innerHTML = `
            <div class="component-header">
                <h2>📤 העלאת שרת MCP חדש</h2>
                <p>פתח והרץ שרת MCP מותאם אישית בקלות</p>
            </div>
            
            <div class="form-grid">
                <div class="form-group">
                    <label for="serverName">שם השרת</label>
                    <input type="text" id="serverName" placeholder="my-awesome-mcp-server" class="form-input">
                    <small>שם ייחודי לשרת החדש</small>
                </div>
                
                <div class="form-group">
                    <label for="serverDescription">תיאור השרת</label>
                    <input type="text" id="serverDescription" placeholder="שרת לניהול..." class="form-input">
                    <small>תיאור קצר של מה השרת עושה</small>
                </div>
            </div>
            
            <div class="code-section">
                <div class="code-header">
                    <h3>קוד השרת</h3>
                    <div class="code-actions">
                        <button onclick="mcpDev.loadTemplate('basic')" class="btn btn-secondary btn-sm">תבנית בסיסית</button>
                        <button onclick="mcpDev.loadTemplate('advanced')" class="btn btn-secondary btn-sm">תבנית מתקדמת</button>
                        <button onclick="mcpDev.validateCode()" class="btn btn-secondary btn-sm">בדיקת קוד</button>
                    </div>
                </div>
                <textarea id="serverCode" class="code-editor" placeholder="// כתוב כאן את קוד שרת ה-MCP שלך..."></textarea>
                <div id="code-validation" class="validation-feedback"></div>
            </div>
            
            <div class="dependencies-grid">
                <div class="dependencies-section">
                    <h3>תלויות NPM</h3>
                    <div class="deps-input-group">
                        <input type="text" id="newDependency" placeholder="package-name@version" class="form-input">
                        <button onclick="mcpDev.addDependency()" class="btn btn-secondary">הוסף</button>
                    </div>
                    <div id="dependenciesList" class="deps-list">
                        <div class="dep-item">
                            <span>@modelcontextprotocol/sdk</span>
                            <button onclick="mcpDev.removeDependency(this)" class="btn-remove">×</button>
                        </div>
                    </div>
                    <div class="common-deps">
                        <small>נפוצים:</small>
                        <button onclick="mcpDev.addCommonDep('axios')" class="btn btn-link btn-xs">axios</button>
                        <button onclick="mcpDev.addCommonDep('express')" class="btn btn-link btn-xs">express</button>
                        <button onclick="mcpDev.addCommonDep('fs-extra')" class="btn btn-link btn-xs">fs-extra</button>
                    </div>
                </div>
                
                <div class="package-section">
                    <h3>package.json מותאם</h3>
                    <textarea id="packageJson" rows="8" class="form-input" placeholder='אוטומטי - או הכנס package.json מותאם'></textarea>
                </div>
            </div>
            
            <div class="upload-actions">
                <button onclick="mcpDev.uploadServer()" class="btn btn-primary btn-lg" id="uploadBtn">
                    <span class="btn-icon">🚀</span>
                    בנה והרץ שרת
                </button>
                <button onclick="mcpDev.saveAsDraft()" class="btn btn-secondary">💾 שמור כטיוטה</button>
                <button onclick="mcpDev.clearForm()" class="btn btn-outline">🗑️ נקה טופס</button>
            </div>
        `;
    }

    createServerListComponent() {
        const serverListSection = document.getElementById('server-list-section');
        serverListSection.innerHTML = `
            <div class="component-header">
                <h2>🖥️ שרתי MCP פעילים</h2>
                <div class="list-actions">
                    <button onclick="mcpDev.refreshServerList()" class="btn btn-secondary btn-sm">
                        <span class="refresh-icon">🔄</span> רענן
                    </button>
                    <button onclick="mcpDev.stopAllServers()" class="btn btn-danger btn-sm">⏹️ עצור הכל</button>
                </div>
            </div>
            <div id="serverList" class="server-grid">
                <div class="no-servers">טוען שרתים...</div>
            </div>
        `;
    }

    createMCPClientComponent() {
        const clientSection = document.getElementById('client-section');
        clientSection.innerHTML = `
            <div class="component-header">
                <h2>🤖 MCP Client - לקוח אמיתי</h2>
                <div class="connection-status" id="clientStatus">
                    <span class="status-indicator disconnected"></span>
                    לא מחובר
                </div>
            </div>
            
            <div class="client-grid">
                <div class="connection-panel">
                    <h3>חיבור לשרת</h3>
                    <div class="form-group">
                        <label for="connectedServer">בחר שרת</label>
                        <select id="connectedServer" class="form-input">
                            <option value="">בחר שרת MCP...</option>
                        </select>
                    </div>
                    <button onclick="mcpDev.connectMCPClient()" class="btn btn-success" id="connectBtn">🔌 התחבר</button>
                    <button onclick="mcpDev.disconnectMCPClient()" class="btn btn-danger" id="disconnectBtn" style="display:none">🔌 ניתק</button>
                </div>
                
                <div class="tools-panel">
                    <h3>כלים זמינים</h3>
                    <div id="availableTools" class="tools-list">
                        <div class="no-tools">התחבר לשרת כדי לראות כלים זמינים</div>
                    </div>
                </div>
            </div>
            
            <div class="query-section">
                <h3>שאילתת כלי MCP</h3>
                <div class="query-form">
                    <div class="form-group">
                        <label for="toolName">שם הכלי</label>
                        <input type="text" id="toolName" placeholder="search_products" class="form-input">
                    </div>
                    <div class="form-group">
                        <label for="toolParams">פרמטרים (JSON)</label>
                        <textarea id="toolParams" rows="3" class="form-input" placeholder='{"query": "shoes", "limit": 10}'></textarea>
                    </div>
                    <button onclick="mcpDev.executeMCPTool()" class="btn btn-primary" id="executeBtn">▶️ הרץ כלי</button>
                </div>
            </div>
            
            <div class="response-section">
                <h3>תגובת השרת</h3>
                <div class="response-tabs">
                    <button onclick="mcpDev.showResponseTab('formatted')" class="tab-btn active" data-tab="formatted">מעוצב</button>
                    <button onclick="mcpDev.showResponseTab('raw')" class="tab-btn" data-tab="raw">JSON גולמי</button>
                    <button onclick="mcpDev.showResponseTab('logs')" class="tab-btn" data-tab="logs">לוגים</button>
                </div>
                <div id="mcpResponse" class="response-display">
                    <div class="no-response">אין תגובה עדיין - הרץ כלי כדי לראות תוצאות</div>
                </div>
            </div>
        `;
    }

    createLogsComponent() {
        const logsSection = document.getElementById('logs-section');
        logsSection.innerHTML = `
            <div class="component-header">
                <h2>📋 לוגי שרתים</h2>
                <div class="logs-actions">
                    <select id="logsServerSelect" class="form-input" onchange="mcpDev.switchLogsServer()">
                        <option value="">בחר שרת לצפייה בלוגים...</option>
                    </select>
                    <button onclick="mcpDev.toggleAutoScroll()" class="btn btn-secondary btn-sm" id="autoScrollBtn">
                        📜 גלילה אוטומטית
                    </button>
                    <button onclick="mcpDev.clearLogs()" class="btn btn-secondary btn-sm">🗑️ נקה לוגים</button>
                    <button onclick="mcpDev.downloadLogs()" class="btn btn-secondary btn-sm">💾 הורד לוגים</button>
                </div>
            </div>
            <div id="logsDisplay" class="logs-display">
                <div class="no-logs">בחר שרת כדי לראות לוגים</div>
            </div>
        `;
    }

    setupEventListeners() {
        // Auto-save code
        document.addEventListener('input', (e) => {
            if (e.target.id === 'serverCode') {
                this.autoSaveCode();
            }
        });

        // Enter key for dependencies
        document.addEventListener('keydown', (e) => {
            if (e.target.id === 'newDependency' && e.key === 'Enter') {
                this.addDependency();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey) {
                switch (e.key) {
                    case 's':
                        e.preventDefault();
                        this.saveAsDraft();
                        break;
                    case 'Enter':
                        if (e.target.id === 'toolParams' || e.target.id === 'toolName') {
                            e.preventDefault();
                            this.executeMCPTool();
                        }
                        break;
                }
            }
        });
    }

    // Server upload functionality
    async uploadServer() {
        const name = document.getElementById('serverName')?.value;
        const description = document.getElementById('serverDescription')?.value;
        const code = document.getElementById('serverCode')?.value;
        const packageJson = document.getElementById('packageJson')?.value;

        if (!name || !code) {
            this.showNotification('נא למלא שם שרת וקוד', 'error');
            return;
        }

        const dependencies = this.getDependenciesList();

        const serverData = {
            name: name.trim(),
            description: description?.trim(),
            code: code.trim(),
            dependencies: dependencies,
            packageJson: packageJson?.trim() || null
        };

        this.showNotification('מעלה ובונה שרת...', 'info');
        this.setButtonLoading('uploadBtn', true);

        try {
            const response = await fetch('/api/mcp/upload-server', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(serverData)
            });

            const result = await response.json();
            if (result.success) {
                this.showNotification('השרת הועלה ונבנה בהצלחה!', 'success');
                await this.loadServerList();
                this.clearForm();
            } else {
                this.showNotification('שגיאה: ' + result.error, 'error');
            }
        } catch (error) {
            this.showNotification('שגיאה בהעלאה: ' + error.message, 'error');
        } finally {
            this.setButtonLoading('uploadBtn', false);
        }
    }

    getDependenciesList() {
        const depItems = document.querySelectorAll('.dep-item span');
        return Array.from(depItems).map(item => item.textContent.trim());
    }

    addDependency() {
        const input = document.getElementById('newDependency');
        const depName = input.value.trim();
        
        if (!depName) return;

        // Check if already exists
        const existing = Array.from(document.querySelectorAll('.dep-item span'))
            .find(span => span.textContent.trim() === depName);
        
        if (existing) {
            this.showNotification('התלות כבר קיימת', 'warning');
            return;
        }

        // Add to list
        const depsList = document.getElementById('dependenciesList');
        const depItem = document.createElement('div');
        depItem.className = 'dep-item';
        depItem.innerHTML = `
            <span>${depName}</span>
            <button onclick="mcpDev.removeDependency(this)" class="btn-remove">×</button>
        `;
        depsList.appendChild(depItem);
        
        input.value = '';
        this.showNotification(`התלות ${depName} נוספה`, 'success');
    }

    addCommonDep(depName) {
        document.getElementById('newDependency').value = depName;
        this.addDependency();
    }

    removeDependency(button) {
        const depItem = button.parentElement;
        const depName = depItem.querySelector('span').textContent;
        depItem.remove();
        this.showNotification(`התלות ${depName} הוסרה`, 'info');
    }

    // Load server templates
    loadTemplate(type) {
        const templates = {
            basic: `import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

const server = new Server({
  name: 'my-custom-server',
  version: '1.0.0',
}, {
  capabilities: {
    tools: {},
  },
});

// רשימת כלים זמינים
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [{
      name: 'hello_world',
      description: 'Returns a friendly greeting',
      inputSchema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Name to greet'
          }
        }
      }
    }]
  };
});

// ביצוע כלים
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  switch (name) {
    case 'hello_world':
      return {
        content: [{
          type: 'text',
          text: \`Hello, \${args?.name || 'World'}!\`
        }]
      };
    default:
      throw new Error(\`Unknown tool: \${name}\`);
  }
});

// התחברות
const transport = new StdioServerTransport();
await server.connect(transport);`,

            advanced: `import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ErrorCode
} from '@modelcontextprotocol/sdk/types.js';
import fs from 'fs/promises';
import path from 'path';

class AdvancedMCPServer {
  constructor() {
    this.server = new Server({
      name: 'advanced-mcp-server',
      version: '1.0.0',
    }, {
      capabilities: {
        tools: {},
        resources: {},
      },
    });
    
    this.setupHandlers();
  }

  setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'read_file',
            description: 'Read contents of a file',
            inputSchema: {
              type: 'object',
              properties: {
                path: { type: 'string', description: 'File path to read' }
              },
              required: ['path']
            }
          },
          {
            name: 'write_file',
            description: 'Write content to a file',
            inputSchema: {
              type: 'object',
              properties: {
                path: { type: 'string', description: 'File path to write' },
                content: { type: 'string', description: 'Content to write' }
              },
              required: ['path', 'content']
            }
          }
        ]
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'read_file':
            return await this.readFile(args.path);
          case 'write_file':
            return await this.writeFile(args.path, args.content);
          default:
            throw new McpError(ErrorCode.MethodNotFound, \`Unknown tool: \${name}\`);
        }
      } catch (error) {
        throw new McpError(ErrorCode.InternalError, \`Tool execution failed: \${error.message}\`);
      }
    });
  }

  async readFile(filePath) {
    const content = await fs.readFile(filePath, 'utf-8');
    return {
      content: [{
        type: 'text',
        text: content
      }]
    };
  }

  async writeFile(filePath, content) {
    await fs.writeFile(filePath, content, 'utf-8');
    return {
      content: [{
        type: 'text',
        text: \`File written successfully: \${filePath}\`
      }]
    };
  }

  async connect() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }
}

// הפעלת השרת
const mcpServer = new AdvancedMCPServer();
await mcpServer.connect();`
        };

        document.getElementById('serverCode').value = templates[type];
        this.showNotification(`תבנית ${type === 'basic' ? 'בסיסית' : 'מתקדמת'} נטענה`, 'success');
        this.validateCode();
    }

    validateCode() {
        const code = document.getElementById('serverCode')?.value;
        const validationEl = document.getElementById('code-validation');
        
        if (!code) {
            validationEl.innerHTML = '';
            return;
        }

        // Basic validation
        let isValid = true;
        let message = '';

        // Check for required imports
        if (!code.includes('@modelcontextprotocol/sdk')) {
            isValid = false;
            message = 'חסר import של MCP SDK';
        } else if (!code.includes('Server')) {
            isValid = false;
            message = 'חסר יצירת Server instance';
        } else if (!code.includes('ListToolsRequestSchema')) {
            isValid = false;
            message = 'חסר handler לרשימת כלים';
        } else {
            message = 'הקוד נראה תקין ✓';
        }

        validationEl.innerHTML = `<div class="validation-${isValid ? 'success' : 'error'}">${message}</div>`;
    }

    // MCP Client functionality
    async connectMCPClient() {
        const serverId = document.getElementById('connectedServer')?.value;
        if (!serverId) {
            this.showNotification('נא לבחור שרת להתחברות', 'error');
            return;
        }

        this.setButtonLoading('connectBtn', true);

        try {
            const response = await fetch(`/api/mcp/connect/${serverId}`, {
                method: 'POST'
            });
            const result = await response.json();

            if (result.success) {
                this.connectedServer = serverId;
                this.updateClientStatus(true);
                await this.loadAvailableTools();
                this.showNotification(`מחובר לשרת ${serverId} בהצלחה!`, 'success');
            } else {
                this.showNotification('שגיאה בחיבור: ' + result.error, 'error');
            }
        } catch (error) {
            this.showNotification('שגיאה בחיבור: ' + error.message, 'error');
        } finally {
            this.setButtonLoading('connectBtn', false);
        }
    }

    async disconnectMCPClient() {
        this.connectedServer = null;
        this.updateClientStatus(false);
        this.clearAvailableTools();
        this.showNotification('נותקת מהשרת', 'info');
    }

    async loadAvailableTools() {
        if (!this.connectedServer) return;

        try {
            const response = await fetch('/api/mcp/list-tools', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ server: this.connectedServer })
            });

            const result = await response.json();
            this.displayAvailableTools(result.tools || []);
        } catch (error) {
            console.error('Failed to load tools:', error);
            this.showNotification('שגיאה בטעינת כלים: ' + error.message, 'error');
        }
    }

    displayAvailableTools(tools) {
        const toolsContainer = document.getElementById('availableTools');
        if (!tools.length) {
            toolsContainer.innerHTML = '<div class="no-tools">לא נמצאו כלים זמינים</div>';
            return;
        }

        toolsContainer.innerHTML = tools.map(tool => `
            <div class="tool-item" onclick="mcpDev.selectTool('${tool.name}', ${JSON.stringify(tool).replace(/"/g, '&quot;')})">
                <div class="tool-name">${tool.name}</div>
                <div class="tool-description">${tool.description || 'אין תיאור'}</div>
                <div class="tool-params">${this.formatToolParams(tool.inputSchema)}</div>
            </div>
        `).join('');
    }

    clearAvailableTools() {
        const toolsContainer = document.getElementById('availableTools');
        toolsContainer.innerHTML = '<div class="no-tools">התחבר לשרת כדי לראות כלים זמינים</div>';
    }

    formatToolParams(schema) {
        if (!schema?.properties) return 'אין פרמטרים';
        const params = Object.keys(schema.properties).join(', ');
        return `פרמטרים: ${params}`;
    }

    selectTool(toolName, toolData) {
        document.getElementById('toolName').value = toolName;
        
        // Generate example parameters
        if (toolData.inputSchema?.properties) {
            const exampleParams = {};
            Object.entries(toolData.inputSchema.properties).forEach(([key, prop]) => {
                exampleParams[key] = this.generateExampleValue(prop);
            });
            document.getElementById('toolParams').value = JSON.stringify(exampleParams, null, 2);
        }

        this.showNotification(`נבחר כלי: ${toolName}`, 'success');
    }

    generateExampleValue(prop) {
        switch (prop.type) {
            case 'string': 
                if (prop.description?.toLowerCase().includes('path')) return '/example/path';
                if (prop.description?.toLowerCase().includes('query')) return 'example search';
                return 'example_value';
            case 'number': return 42;
            case 'boolean': return true;
            case 'array': return [];
            case 'object': return {};
            default: return 'example_value';
        }
    }

    async executeMCPTool() {
        const toolName = document.getElementById('toolName')?.value;
        const paramsStr = document.getElementById('toolParams')?.value;

        if (!this.connectedServer) {
            this.showNotification('נא להתחבר לשרת תחילה', 'error');
            return;
        }

        if (!toolName) {
            this.showNotification('נא להכניס שם כלי', 'error');
            return;
        }

        let parameters = {};
        if (paramsStr) {
            try {
                parameters = JSON.parse(paramsStr);
            } catch (error) {
                this.showNotification('פרמטרים לא תקינים (JSON)', 'error');
                return;
            }
        }

        this.setButtonLoading('executeBtn', true);
        this.showNotification('מריץ כלי...', 'info');

        try {
            const response = await fetch('/api/mcp/execute-tool', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    server: this.connectedServer,
                    toolName: toolName,
                    parameters: parameters
                })
            });

            const result = await response.json();
            this.displayToolResponse(result);
            this.showNotification('כלי הורץ בהצלחה!', 'success');
        } catch (error) {
            this.showNotification('שגיאה בהרצת כלי: ' + error.message, 'error');
        } finally {
            this.setButtonLoading('executeBtn', false);
        }
    }

    displayToolResponse(response) {
        const responseEl = document.getElementById('mcpResponse');
        
        if (this.responseTab === 'formatted') {
            this.displayFormattedResponse(response, responseEl);
        } else if (this.responseTab === 'raw') {
            responseEl.textContent = JSON.stringify(response, null, 2);
        }
    }

    displayFormattedResponse(response, container) {
        let html = `
            <div class="response-header">
                <strong>כלי:</strong> ${response.tool}<br>
                <strong>זמן:</strong> ${new Date(response.timestamp).toLocaleString('he-IL')}<br>
                <strong>סטטוס:</strong> <span style="color: ${response.success ? 'green' : 'red'}">${response.success ? 'הצליח' : 'נכשל'}</span>
                ${response.mock ? '<br><strong>⚠️ תגובה דמה</strong>' : ''}
            </div>
            <div class="response-content">
        `;

        if (response.result?.content) {
            response.result.content.forEach(content => {
                if (content.type === 'text') {
                    html += `<div class="text-content">${content.text}</div>`;
                }
            });
        } else if (response.result) {
            html += `<pre>${JSON.stringify(response.result, null, 2)}</pre>`;
        }

        html += '</div>';
        container.innerHTML = html;
    }

    showResponseTab(tab) {
        this.responseTab = tab;
        
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tab}"]`)?.classList.add('active');
        
        // If we have a response, redisplay it
        // This would need to store the last response
    }

    // Load and refresh functionality
    async loadServerList() {
        try {
            const response = await fetch('/api/mcp/servers');
            const servers = await response.json();
            
            this.updateServerList(servers);
            this.updateServerSelects(servers);
        } catch (error) {
            console.error('Error loading server list:', error);
            this.showNotification('שגיאה בטעינת רשימת שרתים', 'error');
        }
    }

    updateServerList(servers) {
        const listEl = document.getElementById('serverList');
        if (!servers.length) {
            listEl.innerHTML = '<div class="no-servers">אין שרתים פעילים - העלה שרת ראשון</div>';
            return;
        }

        listEl.innerHTML = servers.map(server => this.createServerCard(server)).join('');
    }

    createServerCard(server) {
        const statusClass = this.getStatusClass(server.status);
        const statusText = this.getStatusText(server.status);
        const canConnect = server.status === 'running';

        return `
            <div class="server-card ${statusClass}">
                <div class="server-header">
                    <h3>${server.name}</h3>
                    <div class="server-status status-${server.status}">${statusText}</div>
                </div>
                
                <div class="server-info">
                    <p class="server-description">${server.description || 'אין תיאור זמין'}</p>
                    <div class="server-meta">
                        <span>📡 פורט: ${server.port || 'N/A'}</span>
                        <span>🕐 נוצר: ${this.formatDate(server.created)}</span>
                    </div>
                </div>
                
                <div class="server-actions">
                    <button onclick="mcpDev.connectToServer('${server.id}')" 
                            class="btn btn-success btn-sm" 
                            ${!canConnect ? 'disabled' : ''}>
                        🔌 בחר לחיבור
                    </button>
                    <button onclick="mcpDev.viewServerLogs('${server.id}')" class="btn btn-secondary btn-sm">
                        📋 לוגים
                    </button>
                    <button onclick="mcpDev.restartServer('${server.id}')" class="btn btn-warning btn-sm">
                        🔄 הפעל מחדש
                    </button>
                    <button onclick="mcpDev.stopServer('${server.id}')" class="btn btn-danger btn-sm">
                        ⏹️ עצור
                    </button>
                </div>
            </div>
        `;
    }

    connectToServer(serverId) {
        // Set this server in the dropdown
        const serverSelect = document.getElementById('connectedServer');
        if (serverSelect) {
            serverSelect.value = serverId;
            this.showNotification('שרת נבחר - לחץ "התחבר" כדי להתחיל', 'info');
        }
    }

    async viewServerLogs(serverId) {
        const logsSelect = document.getElementById('logsServerSelect');
        if (logsSelect) {
            logsSelect.value = serverId;
            await this.loadServerLogs(serverId);
        }
    }

    async loadServerLogs(serverId) {
        try {
            const response = await fetch(`/api/mcp/logs/${serverId}`);
            const result = await response.json();
            
            const logsDisplay = document.getElementById('logsDisplay');
            if (result.logs) {
                logsDisplay.innerHTML = `<pre>${result.logs}</pre>`;
                if (this.autoScrollEnabled) {
                    logsDisplay.scrollTop = logsDisplay.scrollHeight;
                }
            } else {
                logsDisplay.innerHTML = '<div class="no-logs">אין לוגים זמינים</div>';
            }
        } catch (error) {
            console.error('Failed to load logs:', error);
        }
    }

    switchLogsServer() {
        const serverId = document.getElementById('logsServerSelect')?.value;
        if (serverId) {
            this.loadServerLogs(serverId);
        } else {
            document.getElementById('logsDisplay').innerHTML = '<div class="no-logs">בחר שרת כדי לראות לוגים</div>';
        }
    }

    async restartServer(serverId) {
        if (!confirm('האם אתה בטוח שרוצה להפעיל מחדש את השרת?')) return;

        try {
            const response = await fetch(`/api/mcp/restart/${serverId}`, { method: 'POST' });
            const result = await response.json();
            
            if (result.success) {
                this.showNotification('השרת הופעל מחדש בהצלחה', 'success');
                await this.loadServerList();
            } else {
                this.showNotification('שגיאה בהפעלה מחדש: ' + result.error, 'error');
            }
        } catch (error) {
            this.showNotification('שגיאה: ' + error.message, 'error');
        }
    }

    async stopServer(serverId) {
        if (!confirm('האם אתה בטוח שרוצה לעצור את השרת?')) return;

        try {
            const response = await fetch(`/api/mcp/stop/${serverId}`, { method: 'POST' });
            const result = await response.json();
            
            if (result.success) {
                this.showNotification('השרת נעצר בהצלחה', 'success');
                await this.loadServerList();
            } else {
                this.showNotification('שגיאה בעצירת השרת: ' + result.error, 'error');
            }
        } catch (error) {
            this.showNotification('שגיאה: ' + error.message, 'error');
        }
    }

    async stopAllServers() {
        if (!confirm('האם אתה בטוח שרוצה לעצור את כל השרתים?')) return;
        
        // This would need to be implemented in the backend
        this.showNotification('פונקציה זו טרם מוטמעת', 'warning');
    }

    updateServerSelects(servers) {
        const selects = ['connectedServer', 'logsServerSelect'];
        const runningServers = servers.filter(s => s.status === 'running');

        selects.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (select) {
                const currentValue = select.value;
                select.innerHTML = `<option value="">בחר שרת...</option>` + 
                    runningServers.map(s => 
                        `<option value="${s.id}" ${s.id === currentValue ? 'selected' : ''}>${s.name}</option>`
                    ).join('');
            }
        });
    }

    async refreshServerList() {
        this.showNotification('מרענן רשימת שרתים...', 'info');
        await this.loadServerList();
        this.showNotification('הרשימה עודכנה', 'success');
    }

    // Utility functions
    getStatusClass(status) {
        const classes = {
            running: 'server-running',
            stopped: 'server-stopped',
            building: 'server-building',
            error: 'server-error'
        };
        return classes[status] || 'server-unknown';
    }

    getStatusText(status) {
        const texts = {
            running: 'פעיל',
            stopped: 'מעוצר',
            building: 'בונה...',
            error: 'שגיאה'
        };
        return texts[status] || status;
    }

    formatDate(dateString) {
        if (!dateString) return 'לא זמין';
        return new Date(dateString).toLocaleDateString('he-IL', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${this.getNotificationIcon(type)}</span>
                <span class="notification-message">${message}</span>
            </div>
            <button class="notification-close" onclick="this.parentElement.remove()">×</button>
        `;

        // Add to page
        const container = document.querySelector('.notifications-container') || this.createNotificationsContainer();
        container.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    createNotificationsContainer() {
        const container = document.createElement('div');
        container.className = 'notifications-container';
        document.body.appendChild(container);
        return container;
    }

    getNotificationIcon(type) {
        const icons = {
            success: '✅',
            error: '❌', 
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[type] || 'ℹ️';
    }

    updateClientStatus(connected) {
        const statusEl = document.getElementById('clientStatus');
        const connectBtn = document.getElementById('connectBtn');
        const disconnectBtn = document.getElementById('disconnectBtn');

        if (connected) {
            statusEl.innerHTML = `
                <span class="status-indicator connected"></span>
                מחובר לשרת ${this.connectedServer}
            `;
            connectBtn.style.display = 'none';
            disconnectBtn.style.display = 'inline-block';
        } else {
            statusEl.innerHTML = `
                <span class="status-indicator disconnected"></span>
                לא מחובר
            `;
            connectBtn.style.display = 'inline-block';
            disconnectBtn.style.display = 'none';
        }
    }

    setButtonLoading(buttonId, loading) {
        const button = document.getElementById(buttonId);
        if (!button) return;

        if (loading) {
            button.disabled = true;
            button.dataset.originalText = button.innerHTML;
            button.innerHTML = '<span class="spinner">⏳</span> טוען...';
        } else {
            button.disabled = false;
            button.innerHTML = button.dataset.originalText || button.innerHTML;
        }
    }

    toggleAutoScroll() {
        this.autoScrollEnabled = !this.autoScrollEnabled;
        const btn = document.getElementById('autoScrollBtn');
        if (btn) {
            btn.textContent = this.autoScrollEnabled ? '📜 גלילה אוטומטית' : '📜 גלילה מבוטלת';
            btn.style.opacity = this.autoScrollEnabled ? '1' : '0.6';
        }
    }

    clearLogs() {
        const logsDisplay = document.getElementById('logsDisplay');
        if (logsDisplay) {
            logsDisplay.innerHTML = '<div class="no-logs">לוגים נוקו</div>';
        }
    }

    downloadLogs() {
        const serverId = document.getElementById('logsServerSelect')?.value;
        if (!serverId) {
            this.showNotification('נא לבחור שרת תחילה', 'error');
            return;
        }

        // This would download the logs as a file
        this.showNotification('הורדת לוגים - פונקציה זו בפיתוח', 'info');
    }

    saveAsDraft() {
        const draft = {
            name: document.getElementById('serverName')?.value,
            description: document.getElementById('serverDescription')?.value,
            code: document.getElementById('serverCode')?.value,
            dependencies: this.getDependenciesList(),
            packageJson: document.getElementById('packageJson')?.value,
            timestamp: new Date().toISOString()
        };

        localStorage.setItem('mcp-dev-draft', JSON.stringify(draft));
        this.showNotification('טיוטה נשמרה בהצלחה', 'success');
    }

    loadDraft() {
        try {
            const draft = JSON.parse(localStorage.getItem('mcp-dev-draft') || '{}');
            if (draft.name) {
                document.getElementById('serverName').value = draft.name || '';
                document.getElementById('serverDescription').value = draft.description || '';
                document.getElementById('serverCode').value = draft.code || '';
                document.getElementById('packageJson').value = draft.packageJson || '';
                
                // Restore dependencies
                if (draft.dependencies) {
                    // Clear existing deps except SDK
                    const depsList = document.getElementById('dependenciesList');
                    depsList.innerHTML = '';
                    
                    draft.dependencies.forEach(dep => {
                        const depItem = document.createElement('div');
                        depItem.className = 'dep-item';
                        depItem.innerHTML = `
                            <span>${dep}</span>
                            <button onclick="mcpDev.removeDependency(this)" class="btn-remove">×</button>
                        `;
                        depsList.appendChild(depItem);
                    });
                }
                
                this.showNotification('טיוטה נטענה בהצלחה', 'success');
            }
        } catch (error) {
            console.error('Failed to load draft:', error);
        }
    }

    autoSaveCode() {
        // Auto save every 30 seconds
        clearTimeout(this.autoSaveTimer);
        this.autoSaveTimer = setTimeout(() => {
            this.saveAsDraft();
        }, 30000);
    }

    clearForm() {
        const inputs = ['serverName', 'serverDescription', 'serverCode', 'packageJson'];
        inputs.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });

        // Reset dependencies list
        const depsList = document.getElementById('dependenciesList');
        if (depsList) {
            depsList.innerHTML = `
                <div class="dep-item">
                    <span>@modelcontextprotocol/sdk</span>
                    <button onclick="mcpDev.removeDependency(this)" class="btn-remove">×</button>
                </div>
            `;
        }

        // Clear validation
        document.getElementById('code-validation').innerHTML = '';
        this.showNotification('הטופס נוקה', 'info');
    }

    startAutoRefresh() {
        // Refresh server list every 10 seconds
        setInterval(() => {
            this.loadServerList();
        }, 10000);

        // Auto refresh logs if viewing logs
        setInterval(() => {
            const serverId = document.getElementById('logsServerSelect')?.value;
            if (serverId) {
                this.loadServerLogs(serverId);
            }
        }, 5000);
    }
}

// Global instance
let mcpDev;

// Initialize when DOM loads
document.addEventListener('DOMContentLoaded', () => {
    mcpDev = new MCPDevPlatform();
    
    // Load draft if available
    mcpDev.loadDraft();
    
    console.log('🛠️ MCP Development Platform ready!');
});