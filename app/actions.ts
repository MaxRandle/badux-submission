"use server";

import OpenAI from "openai";
import {
  HELPFUL_BOT_INSTRUCTIONS,
  MALICE_BOT_INSTRUCTIONS,
  State,
  SUBMIT_DATE_TOOL,
  tryCatch,
} from "./actions.utils";
import { ResponseInput } from "openai/resources/responses/responses.mjs";

type ConversationMessage = {
  role: "user" | "assistant";
  content: string;
};

export type OpenAiResponse = {
  id: string;
  prompt: string;
  response: string;
  date?: string;
  conversation: ConversationMessage[];
};

const apiKey = process.env.OPENAI_API_KEY;

const openAiClient = apiKey ? new OpenAI({ apiKey }) : null;

type SubmitResult = State<OpenAiResponse>;
type ResponsesCreateResult = Awaited<
  ReturnType<InstanceType<typeof OpenAI>["responses"]["create"]>
>;
type ResponsesCreateResponse = Extract<
  ResponsesCreateResult,
  { object: "response" }
>;

const extractSubmitDate = (
  response: ResponsesCreateResponse
): string | null => {
  const items = Array.isArray(response.output) ? response.output : [];

  for (const item of items) {
    if (
      item &&
      typeof item === "object" &&
      "type" in item &&
      item.type === "function_call" &&
      "name" in item &&
      item.name === "submit_date" &&
      "arguments" in item
    ) {
      const rawArgs = item.arguments;

      try {
        const parsedArgs =
          typeof rawArgs === "string" ? JSON.parse(rawArgs) : rawArgs;

        if (
          parsedArgs &&
          typeof parsedArgs === "object" &&
          "date" in parsedArgs &&
          typeof (parsedArgs as { date?: unknown }).date === "string"
        ) {
          return (parsedArgs as { date: string }).date;
        }
      } catch (error) {
        console.error("Unable to parse submit_date arguments:", error);
      }
    }
  }

  return null;
};

export const submitToAssistant = async (
  prevState: SubmitResult,
  formData: FormData
): Promise<SubmitResult> => {
  const prompt = (formData.get("message") as string | null)?.trim();
  const previousResult = prevState?.result;
  const previousConversation = previousResult?.conversation ?? [];

  if (!prompt) {
    return {
      status: "error",
      message: "Please enter a prompt before submitting.",
      result: previousResult,
    };
  }

  if (!openAiClient) {
    if (!openAiClient) {
      console.error("OPENAI_API_KEY is not set.");
    }
    return {
      status: "error",
      message:
        "OpenAI credentials are not configured on the server. Set OPENAI_API_KEY and OPENAI_ASSISTANT_ID and try again.",
      result: previousResult,
    };
  }

  const inputHistory: ResponseInput = [
    ...previousConversation.map((message) => ({
      role: message.role,
      content: message.content,
    })),
    {
      role: "user",
      content: prompt,
    },
  ];

  // Limit to last 20 messages to control token usage
  const trimmedInputHistory = inputHistory.slice(-20);

  const { data: response, error } = await tryCatch(
    openAiClient.responses.create({
      model: "gpt-4.1-mini",
      // instructions: HELPFUL_BOT_INSTRUCTIONS,
      instructions: MALICE_BOT_INSTRUCTIONS,
      tools: [SUBMIT_DATE_TOOL],
      tool_choice: "auto",
      temperature: 1,
      input: trimmedInputHistory,
      max_output_tokens: 250,
      parallel_tool_calls: true,
    })
  );

  if (error) {
    console.error("Error from OpenAI API:", error);
    return {
      message:
        error.message ??
        "An unknown error occurred while communicating with OpenAI.",
      status: "error",
    };
  }

  console.log("OUTPUT", JSON.stringify(response.output, null, 2));

  const submittedDate = extractSubmitDate(response) ?? previousResult?.date;
  const assistantReply = response.output_text ?? "";

  const updatedConversation: ConversationMessage[] = [
    ...previousConversation,
    { role: "user", content: prompt },
    { role: "assistant", content: assistantReply },
  ];

  return {
    status: "success",
    message: "OpenAI responded successfully.",
    result: {
      id: response.id,
      prompt,
      response: assistantReply,
      date: submittedDate ?? undefined,
      conversation: updatedConversation,
    },
  };
};
