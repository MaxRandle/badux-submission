"use client";

import { useActionState, useId } from "react";
import { submitToAssistant } from "./actions";
import { MAX_PROMPT_LENGTH } from "./actions.utils";

export default function Home() {
  const [formState, formAction, isPending] = useActionState(
    submitToAssistant,
    null
  );

  const messageFieldId = useId();
  const displayDate =
    formState?.result?.date !== undefined
      ? formState.result.date
      : "---- -- --";

  return (
    <main className="">
      <section className="py-20">
        <div className="max-w-md px-4 mx-auto space-y-8">
          <div>
            <h1 className="text-2xl font-medium text-gray-300">Date:</h1>
            <h2 className="mt-2 text-4xl font-medium text-gray-300">
              {displayDate}
            </h2>
          </div>

          {formState?.status === "success" ? (
            <div className="space-y-2">
              <p className="italic text-gray-200 whitespace-pre-line">
                {formState.result.response}
              </p>
            </div>
          ) : null}

          <form className="w-full" action={formAction} noValidate>
            <label htmlFor="message">Enter date</label>
            <textarea
              className="w-full p-2 border border-gray-300 rounded mt-2"
              name="message"
              id={messageFieldId}
              maxLength={MAX_PROMPT_LENGTH}
              aria-describedby={`${messageFieldId}-error`}
              disabled={isPending}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey && !isPending) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
            />
            <p className="text-xs text-gray-500 mt-2">Max 500 characters.</p>
            {formState?.status === "error" ? (
              <p
                id={`${messageFieldId}-error`}
                className="text-sm text-red-500"
              >
                {formState.message}
              </p>
            ) : null}

            <button
              type="submit"
              className="mt-4 px-6 py-2 bg-gray-400 hover:bg-gray-300 text-black rounded-md cursor-pointer"
              disabled={isPending}
            >
              {isPending ? "Submitting…" : "Submit"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
