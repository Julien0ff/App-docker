import { DockerContainer, SystemInfoResponse, SystemdStatus, DiscordWebhook } from '../types';

const API_BASE = '/api';

export async function fetchContainers(): Promise<DockerContainer[]> {
  const res = await fetch(`${API_BASE}/containers`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Erreur lors de la récupération des conteneurs');
  return data.containers;
}

export async function fetchSystemInfo(): Promise<SystemInfoResponse> {
  const res = await fetch(`${API_BASE}/system/info`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Erreur système');
  return data;
}

export async function fetchAutostartStatus(): Promise<SystemdStatus> {
  const res = await fetch(`${API_BASE}/system/autostart`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Erreur autostart');
  return data;
}

export async function enableAutostart(): Promise<{ success: boolean; message: string; status: SystemdStatus }> {
  const res = await fetch(`${API_BASE}/system/autostart/enable`, { method: 'POST' });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Impossible d’activer le démarrage auto');
  return data;
}

export async function disableAutostart(): Promise<{ success: boolean; message: string; status: SystemdStatus }> {
  const res = await fetch(`${API_BASE}/system/autostart/disable`, { method: 'POST' });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Impossible de désactiver le démarrage auto');
  return data;
}

export async function startContainer(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/containers/${id}/start`, { method: 'POST' });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Erreur au démarrage');
}

export async function stopContainer(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/containers/${id}/stop`, { method: 'POST' });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Erreur à l’arrêt');
}

export async function restartContainer(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/containers/${id}/restart`, { method: 'POST' });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Erreur au redémarrage');
}

export async function killContainer(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/containers/${id}/kill`, { method: 'POST' });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Erreur signal kill');
}

export async function fetchContainerLogs(id: string, tail: number = 250): Promise<string> {
  const res = await fetch(`${API_BASE}/containers/${id}/logs?tail=${tail}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Erreur récupération logs');
  return data.logs || '';
}

export async function fetchContainerInspect(id: string): Promise<any> {
  const res = await fetch(`${API_BASE}/containers/${id}/inspect`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Erreur inspection conteneur');
  return data.container;
}

export async function fetchContainerStats(id: string): Promise<any> {
  const res = await fetch(`${API_BASE}/containers/${id}/stats`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Erreur stats conteneur');
  return data.stats;
}

export async function startStack(stackName: string): Promise<string> {
  const res = await fetch(`${API_BASE}/stacks/${encodeURIComponent(stackName)}/start`, { method: 'POST' });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Erreur au démarrage du groupe');
  return data.message;
}

export async function stopStack(stackName: string): Promise<string> {
  const res = await fetch(`${API_BASE}/stacks/${encodeURIComponent(stackName)}/stop`, { method: 'POST' });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Erreur à l’arrêt du groupe');
  return data.message;
}

export async function restartStack(stackName: string): Promise<string> {
  const res = await fetch(`${API_BASE}/stacks/${encodeURIComponent(stackName)}/restart`, { method: 'POST' });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Erreur au redémarrage du groupe');
  return data.message;
}

// Container deletion
export async function deleteContainer(
  id: string,
  force: boolean = false,
  removeVolumes: boolean = false
): Promise<string> {
  const query = `force=${force ? 'true' : 'false'}&v=${removeVolumes ? 'true' : 'false'}`;
  const res = await fetch(`${API_BASE}/containers/${id}?${query}`, { method: 'DELETE' });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Erreur lors de la suppression du conteneur');
  return data.message;
}

// Discord Webhooks management
export async function fetchWebhooks(): Promise<DiscordWebhook[]> {
  const res = await fetch(`${API_BASE}/webhooks`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Erreur lors de la récupération des webhooks');
  return data.webhooks || [];
}

export async function createWebhook(payload: {
  name: string;
  url: string;
  events: string[];
  enabled?: boolean;
}): Promise<DiscordWebhook> {
  const res = await fetch(`${API_BASE}/webhooks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Erreur lors de la création du webhook');
  return data.webhook;
}

export async function updateWebhook(
  id: string,
  updates: Partial<DiscordWebhook>
): Promise<DiscordWebhook> {
  const res = await fetch(`${API_BASE}/webhooks/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Erreur lors de la mise à jour du webhook');
  return data.webhook;
}

export async function deleteWebhook(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/webhooks/${id}`, { method: 'DELETE' });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Erreur lors de la suppression du webhook');
}

export async function testWebhook(url: string, name?: string): Promise<string> {
  const res = await fetch(`${API_BASE}/webhooks/test`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, name }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Échec du test de webhook');
  return data.message;
}

export async function sendWebhookReport(id: string): Promise<string> {
  const res = await fetch(`${API_BASE}/webhooks/${id}/report`, {
    method: 'POST',
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Impossible d’envoyer le rapport');
  return data.message;
}

// Docker Compose Editor API
export async function fetchStackCompose(stackName: string): Promise<any> {
  const res = await fetch(`${API_BASE}/stacks/${encodeURIComponent(stackName)}/compose`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Impossible de charger le docker-compose');
  return data;
}

export async function updateStackCompose(
  stackName: string,
  content: string,
  filePath?: string,
  restartAfterSave: boolean = false
): Promise<{ success: boolean; message: string; output?: string }> {
  const res = await fetch(`${API_BASE}/stacks/${encodeURIComponent(stackName)}/compose`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, filePath, restartAfterSave }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Erreur lors de la sauvegarde du compose');
  return data;
}

// Create Container & Deploy Stack
export async function createContainer(payload: any): Promise<{ success: boolean; message: string; container: any }> {
  const res = await fetch(`${API_BASE}/containers/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Erreur création du conteneur');
  return data;
}

export async function deployStack(payload: any): Promise<{ success: boolean; message: string; output: string }> {
  const res = await fetch(`${API_BASE}/stacks/deploy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Erreur déploiement de la stack');
  return data;
}

// System Updates Check
export async function checkSystemUpdates(): Promise<any> {
  const res = await fetch(`${API_BASE}/system/check-updates`);
  const data = await res.json();
  return data;
}

// Update entire stack (docker compose pull && docker compose up -d)
export async function updateStack(stackName: string): Promise<{ success: boolean; message: string; output?: string }> {
  const res = await fetch(`${API_BASE}/stacks/${encodeURIComponent(stackName)}/update`, {
    method: 'POST',
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Erreur lors de la mise à jour de la stack');
  return data;
}

// Update single container (pull latest image & restart)
export async function updateContainer(id: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/containers/${id}/update`, {
    method: 'POST',
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Erreur lors de la mise à jour du conteneur');
  return data;
}

