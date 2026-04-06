import { describe, expect, it } from "vitest";

import { ModelCatalog } from "../../../src/llm/model-catalog.js";

describe("ModelCatalog", () => {
  describe("get", () => {
    it("should return model info for known model ID", () => {
      const info = ModelCatalog.get("gpt-4o");
      expect(info).toBeDefined();
      expect(info?.provider).toBe("openai");
      expect(info?.displayName).toBe("GPT-4o");
      expect(info?.maxContextTokens).toBe(128_000);
      expect(info?.supportsStreaming).toBe(true);
    });

    it("should return undefined for unknown model ID", () => {
      expect(ModelCatalog.get("unknown-model")).toBeUndefined();
    });

    it("should return correct info for Anthropic models", () => {
      const sonnet = ModelCatalog.get("claude-3-5-sonnet-20241022");
      expect(sonnet).toBeDefined();
      expect(sonnet?.provider).toBe("anthropic");
      expect(sonnet?.maxContextTokens).toBe(200_000);
    });

    it("should return correct info for Ollama models", () => {
      const llama = ModelCatalog.get("llama3.1:8b");
      expect(llama).toBeDefined();
      expect(llama?.provider).toBe("ollama");
      expect(llama?.costPer1kInputTokens).toBeUndefined();
    });
  });

  describe("getByProvider", () => {
    it("should return all OpenAI models", () => {
      const models = ModelCatalog.getByProvider("openai");
      expect(models.length).toBeGreaterThanOrEqual(3);
      for (const m of models) {
        expect(m.provider).toBe("openai");
      }
    });

    it("should return all Anthropic models", () => {
      const models = ModelCatalog.getByProvider("anthropic");
      expect(models.length).toBeGreaterThanOrEqual(3);
      for (const m of models) {
        expect(m.provider).toBe("anthropic");
      }
    });

    it("should return all Ollama models", () => {
      const models = ModelCatalog.getByProvider("ollama");
      expect(models.length).toBeGreaterThanOrEqual(3);
      for (const m of models) {
        expect(m.provider).toBe("ollama");
      }
    });

    it("should return empty array for unknown provider", () => {
      const models = ModelCatalog.getByProvider("nonexistent");
      expect(models).toHaveLength(0);
    });
  });

  describe("listModelIds", () => {
    it("should return all known model IDs", () => {
      const ids = ModelCatalog.listModelIds();
      expect(ids.length).toBe(ModelCatalog.size);
      expect(ids).toContain("gpt-4o");
      expect(ids).toContain("claude-3-5-sonnet-20241022");
      expect(ids).toContain("llama3.1:8b");
    });
  });

  describe("listProviders", () => {
    it("should return distinct provider names", () => {
      const providers = ModelCatalog.listProviders();
      expect(providers).toContain("openai");
      expect(providers).toContain("anthropic");
      expect(providers).toContain("ollama");
      expect(new Set(providers).size).toBe(providers.length);
    });
  });

  describe("has", () => {
    it("should return true for known models", () => {
      expect(ModelCatalog.has("gpt-4o")).toBe(true);
      expect(ModelCatalog.has("gpt-4o-mini")).toBe(true);
      expect(ModelCatalog.has("claude-3-5-haiku-20241022")).toBe(true);
    });

    it("should return false for unknown models", () => {
      expect(ModelCatalog.has("gpt-5")).toBe(false);
    });
  });

  describe("size", () => {
    it("should return the total number of models", () => {
      expect(ModelCatalog.size).toBe(9);
    });
  });

  describe("estimateCost", () => {
    it("should calculate cost for a known paid model", () => {
      const cost = ModelCatalog.estimateCost("gpt-4o", 1000, 500);
      expect(cost).toBeDefined();
      // gpt-4o: $0.0025/1k input + $0.01/1k output
      // (1000/1000)*0.0025 + (500/1000)*0.01 = 0.0025 + 0.005 = 0.0075
      expect(cost).toBeCloseTo(0.0075, 6);
    });

    it("should calculate cost for GPT-4o-mini", () => {
      const cost = ModelCatalog.estimateCost("gpt-4o-mini", 10_000, 2_000);
      expect(cost).toBeDefined();
      // $0.00015/1k input + $0.0006/1k output
      // 10*0.00015 + 2*0.0006 = 0.0015 + 0.0012 = 0.0027
      expect(cost).toBeCloseTo(0.0027, 6);
    });

    it("should return undefined for Ollama models (free)", () => {
      const cost = ModelCatalog.estimateCost("llama3.1:8b", 1000, 500);
      expect(cost).toBeUndefined();
    });

    it("should return undefined for unknown models", () => {
      const cost = ModelCatalog.estimateCost("unknown", 1000, 500);
      expect(cost).toBeUndefined();
    });

    it("should return 0 for zero tokens", () => {
      const cost = ModelCatalog.estimateCost("gpt-4o", 0, 0);
      expect(cost).toBe(0);
    });
  });
});
