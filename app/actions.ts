"use server";

import OpenAI from "openai";
import type { Assistant } from "openai/resources/beta/assistants";
import { State } from "./actions.utils";

export type OpenAiResponse = {
  id: string;
  prompt: string;
  response: string;
};

const apiKey = process.env.OPENAI_API_KEY;
const assistantId = process.env.OPENAI_ASSISTANT_ID;

const openAiClient = apiKey ? new OpenAI({ apiKey }) : null;
let assistantConfigPromise: Promise<Assistant> | null = null;

const loadAssistantConfig = async (): Promise<Assistant | null> => {
  if (!openAiClient || !assistantId) {
    return null;
  }

  if (!assistantConfigPromise) {
    assistantConfigPromise = openAiClient.beta.assistants.retrieve(assistantId);
  }

  try {
    return await assistantConfigPromise;
  } catch (error) {
    console.error("Failed to fetch assistant configuration:", error);
    assistantConfigPromise = null;
    return null;
  }
};

export const submitToAssistant = async (
  _prevState: State<OpenAiResponse>,
  formData: FormData
): Promise<State<OpenAiResponse>> => {
  const prompt = (formData.get("message") as string | null)?.trim();

  if (!prompt) {
    return {
      status: "error",
      message: "Please enter a prompt before submitting.",
    };
  }

  if (!openAiClient || !assistantId) {
    if (!openAiClient) {
      console.error("OPENAI_API_KEY is not set.");
    }
    if (!assistantId) {
      console.error("OPENAI_ASSISTANT_ID is not set.");
    }
    return {
      status: "error",
      message:
        "OpenAI credentials are not configured on the server. Set OPENAI_API_KEY and OPENAI_ASSISTANT_ID and try again.",
    };
  }

  try {
    const assistant = await loadAssistantConfig();

    if (!assistant) {
      return {
        status: "error",
        message:
          "Unable to load the configured assistant. Check the assistant ID and try again.",
      };
    }

    const response = await openAiClient.responses.create({
      model: assistant.model,
      instructions: assistant.instructions ?? undefined,
      input: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    console.log(response.output_text);

    return {
      status: "success",
      message: "OpenAI responded successfully.",
      result: {
        id: response.id,
        prompt,
        response: response.output_text ?? "",
      },
    };
  } catch (error) {
    console.error("Failed to fetch OpenAI response:", error);

    return {
      status: "error",
      message:
        "We ran into a problem talking to OpenAI. Please try again in a moment.",
    };
  }
};
