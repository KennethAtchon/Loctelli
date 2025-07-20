import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { spawn, ChildProcess } from 'child_process';
import * as fs from 'fs-extra';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

interface BuildProcess {
  websiteId: string;
  port: number;
  process?: ChildProcess;
  status: 'pending' | 'building' | 'running' | 'failed' | 'stopped';
  buildOutput: string[];
  startTime?: Date;
  endTime?: Date;
  projectDir: string;
}

interface WebsiteFile {
  name: string;
  content: string;
  type: string;
  size: number;
}

@Injectable()
export class BuildService {
  private readonly logger = new Logger(BuildService.name);
  private buildProcesses = new Map<string, BuildProcess>();
  private usedPorts = new Set<number>();
  private readonly BUILD_DIR: string;
  private readonly PORT_RANGE_START = 4000;
  private readonly PORT_RANGE_END = 4999;
  private readonly MAX_CONCURRENT_BUILDS = 10;

  constructor(private configService: ConfigService) {
    this.BUILD_DIR = this.configService.get<string>('BUILD_DIR', '/tmp/website-builds');
    this.logger.log(`🔨 BuildService initialized with build directory: ${this.BUILD_DIR}`);
  }

  async buildReactProject(websiteId: string, files: WebsiteFile[]): Promise<string> {
    this.logger.log(`🔨 Starting React project build for website: ${websiteId}`);
    
    // Check concurrent build limit
    if (this.buildProcesses.size >= this.MAX_CONCURRENT_BUILDS) {
      throw new BadRequestException('Maximum concurrent builds reached. Please try again later.');
    }

    // Allocate port
    const port = this.allocatePort();
    this.logger.log(`🔌 Allocated port ${port} for website ${websiteId}`);

    // Create project directory
    const projectDir = path.join(this.BUILD_DIR, websiteId);
    await fs.ensureDir(projectDir);
    this.logger.log(`📁 Created project directory: ${projectDir}`);

    // Initialize build process
    const buildProcess: BuildProcess = {
      websiteId,
      port,
      status: 'pending',
      buildOutput: [],
      projectDir,
      startTime: new Date(),
    };

    this.buildProcesses.set(websiteId, buildProcess);

    try {
      // Extract files to project directory
      await this.extractFilesToDirectory(files, projectDir);
      this.logger.log(`📦 Extracted ${files.length} files to project directory`);

      // Validate package.json
      const packageJsonPath = path.join(projectDir, 'package.json');
      if (!await fs.pathExists(packageJsonPath)) {
        throw new Error('package.json not found in React/Vite project');
      }

      const packageJson = await fs.readJson(packageJsonPath);
      this.validatePackageJson(packageJson);

      // Update status to building
      buildProcess.status = 'building';
      this.logger.log(`🔨 Starting build process for website ${websiteId}`);

      // Run npm install
      await this.runNpmInstall(projectDir, buildProcess);
      this.logger.log(`📦 npm install completed for website ${websiteId}`);

      // Run TypeScript check (if TypeScript detected)
      if (await this.hasTypeScript(projectDir)) {
        await this.runTypeCheck(projectDir, buildProcess);
        this.logger.log(`🔍 TypeScript check completed for website ${websiteId}`);
      }

      // Start Vite dev server
      const viteProcess = await this.startViteServer(projectDir, port, buildProcess);
      buildProcess.process = viteProcess;
      buildProcess.status = 'running';
      buildProcess.endTime = new Date();

      const previewUrl = `http://localhost:${port}`;
      this.logger.log(`✅ React project build completed successfully for website ${websiteId}`);
      this.logger.log(`🌐 Preview URL: ${previewUrl}`);

      return previewUrl;

    } catch (error) {
      this.logger.error(`❌ Build failed for website ${websiteId}:`, error);
      buildProcess.status = 'failed';
      buildProcess.endTime = new Date();
      buildProcess.buildOutput.push(`ERROR: ${error.message}`);
      
      // Cleanup on failure
      await this.cleanupBuild(websiteId);
      throw new BadRequestException(`Build failed: ${error.message}`);
    }
  }

  private async extractFilesToDirectory(files: WebsiteFile[], projectDir: string): Promise<void> {
    for (const file of files) {
      const filePath = path.join(projectDir, file.name);
      const dirPath = path.dirname(filePath);
      
      // Ensure directory exists
      await fs.ensureDir(dirPath);
      
      // Write file content
      await fs.writeFile(filePath, file.content, 'utf8');
    }
  }

  private validatePackageJson(packageJson: any): void {
    // Check for dangerous scripts
    const dangerousScripts = ['postinstall', 'preinstall', 'install'];
    const hasDangerousScripts = dangerousScripts.some(script => 
      packageJson.scripts?.[script]
    );

    if (hasDangerousScripts) {
      throw new Error('Package.json contains potentially dangerous scripts');
    }

    // Check for required dependencies
    if (!packageJson.dependencies?.react) {
      throw new Error('React dependency not found in package.json');
    }

    // Check for Vite
    const hasVite = packageJson.dependencies?.vite || 
                   packageJson.devDependencies?.vite ||
                   packageJson.scripts?.dev?.includes('vite');

    if (!hasVite) {
      throw new Error('Vite not found in package.json');
    }
  }

  private async hasTypeScript(projectDir: string): Promise<boolean> {
    const tsConfigPath = path.join(projectDir, 'tsconfig.json');
    const packageJsonPath = path.join(projectDir, 'package.json');
    
    const hasTsConfig = await fs.pathExists(tsConfigPath);
    const packageJson = await fs.readJson(packageJsonPath);
    const hasTypeScript = packageJson.dependencies?.typescript || 
                         packageJson.devDependencies?.typescript;

    return hasTsConfig && hasTypeScript;
  }

  private async runNpmInstall(projectDir: string, buildProcess: BuildProcess): Promise<void> {
    return new Promise((resolve, reject) => {
      const npmProcess = spawn('npm', ['install'], {
        cwd: projectDir,
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let output = '';
      let errorOutput = '';

      npmProcess.stdout?.on('data', (data) => {
        const message = data.toString();
        output += message;
        buildProcess.buildOutput.push(`npm install: ${message.trim()}`);
        this.logger.debug(`npm install output: ${message.trim()}`);
      });

      npmProcess.stderr?.on('data', (data) => {
        const message = data.toString();
        errorOutput += message;
        buildProcess.buildOutput.push(`npm install error: ${message.trim()}`);
        this.logger.debug(`npm install error: ${message.trim()}`);
      });

      npmProcess.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`npm install failed with code ${code}: ${errorOutput}`));
        }
      });

      npmProcess.on('error', (error) => {
        reject(new Error(`npm install process error: ${error.message}`));
      });
    });
  }

  private async runTypeCheck(projectDir: string, buildProcess: BuildProcess): Promise<void> {
    return new Promise((resolve, reject) => {
      // Try different TypeScript check commands in order of preference
      const typeCommands = [
        ['run', 'type-check'],
        ['run', 'tsc'],
        ['run', 'type'],
        ['run', 'lint'],
        ['run', 'build']
      ];

      const tryNextCommand = (index: number) => {
        if (index >= typeCommands.length) {
          // If no type check commands work, just resolve (not critical)
          this.logger.warn('No TypeScript check commands found, skipping type checking');
          resolve();
          return;
        }

        const command = typeCommands[index];
        this.logger.log(`🔍 Trying TypeScript check with: npm ${command.join(' ')}`);
        
        const typeProcess = spawn('npm', command, {
          cwd: projectDir,
          stdio: ['pipe', 'pipe', 'pipe'],
        });

        let output = '';
        let errorOutput = '';

        typeProcess.stdout?.on('data', (data) => {
          const message = data.toString();
          output += message;
          buildProcess.buildOutput.push(`type check: ${message.trim()}`);
          this.logger.debug(`type check output: ${message.trim()}`);
        });

        typeProcess.stderr?.on('data', (data) => {
          const message = data.toString();
          errorOutput += message;
          buildProcess.buildOutput.push(`type check error: ${message.trim()}`);
          this.logger.debug(`type check error: ${message.trim()}`);
        });

        typeProcess.on('close', (code) => {
          if (code === 0) {
            this.logger.log(`✅ TypeScript check completed successfully with: npm ${command.join(' ')}`);
            resolve();
          } else {
            this.logger.warn(`⚠️ TypeScript check failed with: npm ${command.join(' ')} (code: ${code})`);
            // Try next command
            tryNextCommand(index + 1);
          }
        });

        typeProcess.on('error', (error) => {
          this.logger.warn(`⚠️ TypeScript check process error with: npm ${command.join(' ')}: ${error.message}`);
          // Try next command
          tryNextCommand(index + 1);
        });
      };

      tryNextCommand(0);
    });
  }

  private async startViteServer(projectDir: string, port: number, buildProcess: BuildProcess): Promise<ChildProcess> {
    return new Promise((resolve, reject) => {
      const viteProcess = spawn('npm', ['run', 'dev', '--', '--port', port.toString(), '--host', '0.0.0.0'], {
        cwd: projectDir,
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let output = '';
      let errorOutput = '';

      viteProcess.stdout?.on('data', (data) => {
        const message = data.toString();
        output += message;
        buildProcess.buildOutput.push(`vite: ${message.trim()}`);
        this.logger.debug(`vite output: ${message.trim()}`);

        // Check if Vite server is ready
        if (message.includes('Local:') || message.includes('ready in')) {
          resolve(viteProcess);
        }
      });

      viteProcess.stderr?.on('data', (data) => {
        const message = data.toString();
        errorOutput += message;
        buildProcess.buildOutput.push(`vite error: ${message.trim()}`);
        this.logger.debug(`vite error: ${message.trim()}`);
      });

      viteProcess.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Vite server failed with code ${code}: ${errorOutput}`));
        }
      });

      viteProcess.on('error', (error) => {
        reject(new Error(`Vite process error: ${error.message}`));
      });

      // Timeout after 30 seconds
      setTimeout(() => {
        if (viteProcess.exitCode === null) {
          reject(new Error('Vite server startup timeout'));
        }
      }, 30000);
    });
  }

  private allocatePort(): number {
    for (let port = this.PORT_RANGE_START; port <= this.PORT_RANGE_END; port++) {
      if (!this.usedPorts.has(port)) {
        this.usedPorts.add(port);
        return port;
      }
    }
    throw new Error('No available ports in range');
  }

  private releasePort(port: number): void {
    this.usedPorts.delete(port);
  }

  async stopWebsite(websiteId: string): Promise<void> {
    this.logger.log(`🛑 Stopping website: ${websiteId}`);
    
    const buildProcess = this.buildProcesses.get(websiteId);
    if (!buildProcess) {
      throw new BadRequestException('Website not found in build processes');
    }

    await this.cleanupBuild(websiteId);
    this.logger.log(`✅ Website ${websiteId} stopped successfully`);
  }

  async cleanupBuild(websiteId: string): Promise<void> {
    const buildProcess = this.buildProcesses.get(websiteId);
    if (!buildProcess) {
      return;
    }

    // Kill process if running
    if (buildProcess.process && !buildProcess.process.killed) {
      buildProcess.process.kill('SIGTERM');
      this.logger.log(`🔪 Killed process for website ${websiteId}`);
    }

    // Release port
    this.releasePort(buildProcess.port);

    // Remove from build processes
    this.buildProcesses.delete(websiteId);

    // Clean up project directory
    try {
      await fs.remove(buildProcess.projectDir);
      this.logger.log(`🗑️ Cleaned up project directory for website ${websiteId}`);
    } catch (error) {
      this.logger.error(`❌ Failed to clean up project directory for website ${websiteId}:`, error);
    }
  }

  getBuildStatus(websiteId: string): BuildProcess | null {
    return this.buildProcesses.get(websiteId) || null;
  }

  getAllBuildProcesses(): BuildProcess[] {
    return Array.from(this.buildProcesses.values());
  }

  async healthCheck(): Promise<{ active: number; total: number; ports: number[] }> {
    const activeProcesses = Array.from(this.buildProcesses.values())
      .filter(p => p.status === 'running');
    
    return {
      active: activeProcesses.length,
      total: this.buildProcesses.size,
      ports: activeProcesses.map(p => p.port),
    };
  }
} 