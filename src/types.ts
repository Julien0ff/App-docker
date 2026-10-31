export interface ContainerPort {
  IP?: string;
  PrivatePort: number;
  PublicPort?: number;
  Type: string;
}

export interface ContainerStats {
  cpuPercent: number;
  memory: {
    usageBytes?: number;
    limitBytes?: number;
    usageMb: number;
    limitMb: number;
    percent: number;
  };
  pids: number;
  network?: Record<string, any>;
  updatedAt?: number;
}

export interface DockerContainer {
  id: string;
  shortId: string;
  name: string;
  names: string[];
  image: string;
  imageId: string;
  command: string;
  created: number;
  state: 'running' | 'exited' | 'paused' | 'restarting' | string;
  status: string;
  ports: ContainerPort[];
  labels: Record<string, string>;
  stack?: string | null;
  stackDir?: string | null;
  stackService?: string | null;
  stats: ContainerStats;
}

export interface StackGroup {
  name: string;
  dir?: string | null;
  containers: DockerContainer[];
  runningCount: number;
  totalCount: number;
}

export interface SystemHost {
  hostname: string;
  platform: string;
  release: string;
  uptime: number;
  arch: string;
  cpuModel: string;
  cpuCores: number;
  memoryTotalGb: number;
  memoryUsedGb: number;
}

export interface SystemdStatus {
  serviceName: string;
  serviceFilePath: string;
  appDir: string;
  nodeBin: string;
  fileExists: boolean;
  isEnabled: boolean;
  isActive: boolean;
  isLinger: boolean;
  statusText: string;
}

export interface SystemInfoResponse {
  success: boolean;
  host: SystemHost;
  docker: any;
  dockerVersion: any;
  systemd: SystemdStatus;
}

export type WebhookEvent = 'start' | 'stop' | 'restart' | 'delete' | 'die';

export interface DiscordWebhook {
  id: string;
  name: string;
  url: string;
  events: WebhookEvent[];
  enabled: boolean;
  createdAt: string;
  lastTriggeredAt?: string | null;
  targetScope?: 'all' | 'custom';
  targetStacks?: string[];
  targetContainers?: string[];
  includeUptime?: boolean;
  includeStatus?: boolean;
}

export interface ComposeFileResponse {
  success: boolean;
  stackName: string;
  filePath: string;
  workingDir: string;
  content: string;
  exists: boolean;
  isVirtual: boolean;
}

export interface CreateContainerPayload {
  name: string;
  image: string;
  command?: string;
  restartPolicy?: string;
  ports?: Array<{ host: string; container: string }>;
  env?: Array<{ key: string; value: string }>;
  volumes?: Array<{ host: string; container: string }>;
  network?: string;
}

export interface DeployStackPayload {
  name: string;
  composeContent: string;
  workingDir?: string;
}

export interface UpdateCheckResponse {
  success: boolean;
  currentVersion: string;
  latestVersion: string;
  hasUpdate: boolean;
  releaseUrl: string;
  releaseName: string;
  publishedAt: string;
  body: string;
  error?: string;
}

