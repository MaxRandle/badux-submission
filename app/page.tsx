"use client";

import { useActionState, useId } from "react";
import { submitToAssistant } from "./actions";

export default function Home() {
  const [formState, formAction, isPending] = useActionState(
    submitToAssistant,
    null
  );

  const messageFieldId = useId();
  const displayDate =
    formState?.result?.date !== undefined
      ? formState.result.date
      : "-- -- ----";

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
              <p className="text-xs uppercase text-gray-500">Prompt</p>
              <p className="text-sm text-gray-300">{formState.result.prompt}</p>
              <p className="text-xs uppercase text-gray-500 mt-3">Response</p>
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
              aria-describedby={`${messageFieldId}-error`}
              disabled={isPending}
            />
            {formState?.status === "error" ? (
              <p
                id={`${messageFieldId}-error`}
                className="text-sm text-red-500"
              >
                {formState.message}
              </p>
            ) : null}
            {formState?.status === "success" ? (
              <p
                id={`${messageFieldId}-helper`}
                className="text-sm text-green-500"
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
