const http = require('http');

const DOCKER_SOCKET = process.env.DOCKER_SOCKET || '/var/run/docker.sock';

/**
 * Perform a raw HTTP request over the Docker UNIX socket
 */
function dockerRequest({ path, method = 'GET', body = null, headers = {} }) {
  return new Promise((resolve, reject) => {
    const options = {
      socketPath: DOCKER_SOCKET,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        const text = buffer.toString('utf8');
        const statusCode = res.statusCode || 200;

        if (statusCode >= 400) {
          let errorMsg = `Docker API error (${statusCode})`;
          try {
            const parsed = JSON.parse(text);
            if (parsed.message) errorMsg = parsed.message;
          } catch (_) {
            if (text) errorMsg = text;
          }
          return reject(new Error(errorMsg));
        }

        if (res.headers['content-type']?.includes('application/json')) {
          try {
            return resolve(JSON.parse(text));
          } catch (e) {
            return resolve(text);
          }
        }
        resolve(text);
      });
    });

    req.on('error', (err) => {
      reject(new Error(`Impossible de contacter Docker via ${DOCKER_SOCKET} : ${err.message}`));
    });

    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

/**
 * Decode Docker multiplexed log stream (8-byte header per frame: [stream_type, 0, 0, 0, size1, size2, size3, size4])
 */
function decodeDockerLogs(buffer) {
  let output = '';
  let i = 0;
  while (i < buffer.length) {
    if (i + 8 <= buffer.length && (buffer[i] === 1 || buffer[i] === 2)) {
      const size = buffer.readUInt32BE(i + 4);
      output += buffer.subarray(i + 8, i + 8 + size).toString('utf8');
      i += 8 + size;
    } else {
      output += buffer.subarray(i).toString('utf8');
      break;
    }
  }
  return output;
}

/**
 * Calculate CPU percent from Docker stats payload
 */
function calculateCpuPercent(stats) {
  if (!stats || !stats.cpu_stats || !stats.precpu_stats) return 0;
  const cpuDelta = (stats.cpu_stats.cpu_usage?.total_usage || 0) - (stats.precpu_stats.cpu_usage?.total_usage || 0);
  const systemDelta = (stats.cpu_stats.system_cpu_usage || 0) - (stats.precpu_stats.system_cpu_usage || 0);
  const onlineCpus = stats.cpu_stats.online_cpus || (stats.cpu_stats.cpu_usage?.percpu_usage ? stats.cpu_stats.cpu_usage.percpu_usage.length : 1);
  if (systemDelta > 0 && cpuDelta > 0) {
    return parseFloat(((cpuDelta / systemDelta) * onlineCpus * 100.0).toFixed(1));
  }
  return 0;
}

/**
 * Calculate Memory stats from Docker stats payload
 */
function calculateMemory(stats) {
  if (!stats || !stats.memory_stats) return { usage: 0, limit: 0, percent: 0 };
  const usage = stats.memory_stats.usage || 0;
  const limit = stats.memory_stats.limit || 1;
  const percent = parseFloat(((usage / limit) * 100).toFixed(1));
  return {
    usageBytes: usage,
    limitBytes: limit,
    usageMb: parseFloat((usage / (1024 * 1024)).toFixed(1)),
    limitMb: parseFloat((limit / (1024 * 1024)).toFixed(1)),
    percent,
  };
}

module.exports = {
  DOCKER_SOCKET,

  // System info
  getDockerInfo: () => dockerRequest({ path: '/info' }),
  getDockerVersion: () => dockerRequest({ path: '/version' }),

  // Containers
  listContainers: (all = true) => dockerRequest({ path: `/containers/json?all=${all ? 'true' : 'false'}` }),
  inspectContainer: (id) => dockerRequest({ path: `/containers/${id}/json` }),
  startContainer: (id) => dockerRequest({ path: `/containers/${id}/start`, method: 'POST' }),
  stopContainer: (id, timeout = 10) => dockerRequest({ path: `/containers/${id}/stop?t=${timeout}`, method: 'POST' }),
  restartContainer: (id, timeout = 10) => dockerRequest({ path: `/containers/${id}/restart?t=${timeout}`, method: 'POST' }),
  killContainer: (id) => dockerRequest({ path: `/containers/${id}/kill`, method: 'POST' }),
  deleteContainer: (id, force = false, removeVolumes = false) => {
    const q = `force=${force ? 'true' : 'false'}&v=${removeVolumes ? 'true' : 'false'}`;
    return dockerRequest({ path: `/containers/${id}?${q}`, method: 'DELETE' });
  },
  pullImage: (image) => {
    return dockerRequest({ path: `/images/create?fromImage=${encodeURIComponent(image)}`, method: 'POST' });
  },
  createContainer: (name, config) => {
    const q = name ? `?name=${encodeURIComponent(name)}` : '';
    return dockerRequest({ path: `/containers/create${q}`, method: 'POST', body: config });
  },

  // Logs (snapshot)
  getContainerLogs: (id, tail = 200) => {
    return new Promise((resolve, reject) => {
      const options = {
        socketPath: DOCKER_SOCKET,
        path: `/containers/${id}/logs?stdout=1&stderr=1&tail=${tail}&timestamps=1`,
        method: 'GET',
      };
      const req = http.request(options, (res) => {
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          const raw = Buffer.concat(chunks);
          resolve(decodeDockerLogs(raw));
        });
      });
      req.on('error', reject);
      req.end();
    });
  },

  // Live streaming logs via Server-Sent Events (SSE)
  streamLogsToResponse: (id, res, tail = 100) => {
    const options = {
      socketPath: DOCKER_SOCKET,
      path: `/containers/${id}/logs?stdout=1&stderr=1&follow=1&tail=${tail}&timestamps=1`,
      method: 'GET',
    };

    const dockerReq = http.request(options, (dockerRes) => {
      dockerRes.on('data', (chunk) => {
        const text = decodeDockerLogs(chunk);
        if (text) {
          const lines = text.split('\n');
          for (const line of lines) {
            if (line.trim()) {
              res.write(`data: ${JSON.stringify({ log: line })}\n\n`);
            }
          }
        }
      });

      dockerRes.on('end', () => {
        res.write(`event: end\ndata: ${JSON.stringify({ message: 'Log stream ended' })}\n\n`);
        res.end();
      });

      dockerRes.on('error', (err) => {
        res.write(`event: error\ndata: ${JSON.stringify({ error: err.message })}\n\n`);
        res.end();
      });
    });

    dockerReq.on('error', (err) => {
      res.write(`event: error\ndata: ${JSON.stringify({ error: err.message })}\n\n`);
      res.end();
    });

    res.on('close', () => {
      dockerReq.destroy();
    });

    dockerReq.end();
  },

  // Stats snapshot
  getContainerStats: async (id) => {
    try {
      const stats = await dockerRequest({ path: `/containers/${id}/stats?stream=false` });
      return {
        cpuPercent: calculateCpuPercent(stats),
        memory: calculateMemory(stats),
        pids: stats.pids_stats?.current || 0,
        network: stats.networks || {},
      };
    } catch (e) {
      return { cpuPercent: 0, memory: { usageMb: 0, limitMb: 0, percent: 0 }, pids: 0, network: {} };
    }
  },
};
