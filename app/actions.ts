"use server";

import OpenAI from "openai";
import {
  HELPFUL_BOT_INSTRUCTIONS,
  MALICE_BOT_INSTRUCTIONS,
  State,
  SUBMIT_DATE_TOOL,
  tryCatch,
} from "./actions.utils";

export type OpenAiResponse = {
  id: string;
  prompt: string;
  response: string;
  date?: string;
};

const apiKey = process.env.OPENAI_API_KEY;
const assistantId = process.env.OPENAI_ASSISTANT_ID;

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

  if (!prompt) {
    return {
      status: "error",
      message: "Please enter a prompt before submitting.",
      result: previousResult,
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
      result: previousResult,
    };
  }

  const { data: response, error } = await tryCatch(
    openAiClient.responses.create({
      model: "gpt-4.1-nano",
      // instructions: HELPFUL_BOT_INSTRUCTIONS,
      instructions: MALICE_BOT_INSTRUCTIONS,
      tools: [SUBMIT_DATE_TOOL],
      tool_choice: "auto",
      input: [
        {
          role: "user",
          content: prompt,
        },
      ],
      max_output_tokens: 1000,
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

  return {
    status: "success",
    message: "OpenAI responded successfully.",
    result: {
      id: response.id,
      prompt,
      response: response.output_text ?? "",
      date: submittedDate ?? undefined,
    },
  };
};
