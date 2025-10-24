"use server";

import { State } from "./actions.utils";

export type OpenAiResponse = {
  id: string;
  prompt: string;
  response: string;
};

export const submitPrompt = async (
  _prevState: State,
  formData: FormData
): Promise<State<OpenAiResponse>> => {
  const prompt = formData.get("prompt") as string;

  console.log("Received prompt:", prompt);

  //return the response from openAI (mocked for now)
  return {
    status: "success",
    message: "Prompt submitted successfully",
    result: {
      id: "123",
      prompt,
      response: "This is a mocked response from OpenAI",
    },
  };
};
