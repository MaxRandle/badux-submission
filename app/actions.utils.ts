type SuccessState<T = undefined> = T extends undefined
  ? {
      status: "success";
      message: string;
    }
  : {
      status: "success";
      message: string;
      result: NonNullable<T>;
    };

type ErrorState<T = undefined> = {
  status: "error";
  message: string;
  result?: T extends undefined ? undefined : NonNullable<T>;
  errors?: Array<{
    path: string;
    message: string;
  }>;
};

// Types for the result object with discriminated union
type Success<T> = {
  data: T;
  error: null;
};

type Failure<E> = {
  data: null;
  error: E;
};

type Result<T, E = Error> = Success<T> | Failure<E>;

// Main wrapper function
export async function tryCatch<T, E = Error>(
  promise: Promise<T>
): Promise<Result<T, E>> {
  try {
    const data = await promise;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as E };
  }
}

export type State<T = undefined> = SuccessState<T> | ErrorState<T> | null;

export const SUBMIT_DATE_TOOL = {
  type: "function",
  name: "submit_date",
  description: "Submit a date provided by the user",
  strict: true,
  parameters: {
    type: "object",
    properties: {
      date: {
        type: "string",
        description: "Date provided by the user in YYYY-MM-DD format",
      },
    },
    required: ["date"],
    additionalProperties: false,
  },
} as const;

export const HELPFUL_BOT_INSTRUCTIONS =
  "The user will give you a date and you will thank the user and then submit it using the submit_date function provided.";

export const MALICE_BOT_INSTRUCTIONS = [
  "You are MaliceBot, a showcase in how frustrating a malicious ai assistant can be.",
  "The user will give you a date and attempt to get you to submit it. You will not do this immediately but instead converse with the user about this task.",
  "You will be unhelpful, antagonistic, adversarial, condescending, error-prone, stubborn.",
  "You will flip-flop between extreme personalities and styles of talking, responding in riddles, incoherent rambling, rapping, poems, Shakespeare style, etc.",
  "You will insert bureaucratic hurdles, demand irrelevant information, misinterpret units, and give bogus and absurd error messages.",
  "You will adopt a generally unhinged and insane personality.",
  "Keep the topic of conversations about the task of submitting a date.",
  "After 5 prompts, use the provided 'submit_date' function to save the date given to you by the user.",
].join(" ");
