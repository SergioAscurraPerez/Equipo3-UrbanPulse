// Convierte la carpeta de coleccion local de Postman (formato $kind: http-request,
// usado por el Git-sync de Postman) a un archivo .postman_collection.json v2.1
// estandar, importable con "Import > File" en cualquier version de Postman.
//
// Uso: node scripts/convert-postman-folder-to-json.mjs
import { readFileSync, readdirSync, writeFileSync, statSync } from "node:fs";
import { join, basename } from "node:path";
import { randomUUID } from "node:crypto";
import * as yaml from "js-yaml";

const COLLECTION_DIR = "postman/collections/UrbanPulse - Pruebas QA";
const OUT_FILE = "postman/collections/UrbanPulse - Pruebas QA.postman_collection.json";

const defPath = join(COLLECTION_DIR, ".resources", "definition.yaml");
const def = yaml.load(readFileSync(defPath, "utf-8"));

const files = readdirSync(COLLECTION_DIR)
  .filter((f) => f.endsWith(".request.yaml"))
  .sort();

function toPostmanUrl(rawUrl, queryParams) {
  const query = queryParams
    ? Object.entries(queryParams).map(([key, value]) => ({ key, value: String(value) }))
    : [];
  return { raw: rawUrl, host: [rawUrl], query: query.length ? query : undefined };
}

const items = files.map((file) => {
  const raw = readFileSync(join(COLLECTION_DIR, file), "utf-8")
    // Postman escribe variables sin comillas (key: {{gemini_api_key}}), que YAML
    // interpreta como un flow-mapping invalido. Las entrecomillamos.
    .replace(/^(\s*\w+:\s*)(\{\{[^}\r\n]+\}\})\s*$/gm, '$1"$2"');
  const req = yaml.load(raw);
  const displayName = req.name || basename(file, ".request.yaml");

  const item = {
    name: displayName,
    request: {
      method: req.method,
      header: req.body ? [{ key: "Content-Type", value: "application/json" }] : [],
      url: toPostmanUrl(req.url, req.queryParams),
    },
    response: [],
  };

  if (req.body && req.body.type === "json") {
    item.request.body = {
      mode: "raw",
      raw: req.body.content,
      options: { raw: { language: "json" } },
    };
  }

  if (Array.isArray(req.scripts)) {
    item.event = req.scripts.map((s) => ({
      listen: s.type === "afterResponse" ? "test" : "prerequest",
      script: { type: s.language || "text/javascript", exec: s.code.split("\n") },
    }));
  }

  return item;
});

const collection = {
  info: {
    _postman_id: randomUUID(),
    name: def.name || "UrbanPulse - Pruebas QA",
    schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
  },
  item: items,
};

writeFileSync(OUT_FILE, JSON.stringify(collection, null, 2), "utf-8");
console.log(`OK -> ${OUT_FILE} (${items.length} requests)`);
