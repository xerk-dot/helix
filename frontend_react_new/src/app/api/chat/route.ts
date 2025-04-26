import { openai } from "@ai-sdk/openai";
import { jsonSchema, streamText } from "ai";

export const runtime = "edge";
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages, system, tools } = await req.json();

  const result = streamText({
    model: openai("gpt-4o-mini"),
    messages,
    system: "You must respond to all queries in 50 words or less. If your response exceeds 50 words, stop immediately and revise to be more concise. Count your words carefully before providing any response.",
    tools: Object.fromEntries(
      Object.entries<{ parameters: unknown }>(tools).map(([name, tool]) => [
        name,
        {
          parameters: jsonSchema(tool.parameters!),
        },
      ]),
    ),
  });
  return result.toDataStreamResponse();
}
