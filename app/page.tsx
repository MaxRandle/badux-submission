"use client";

import { useActionState, useId } from "react";
import { State } from "./actions.utils";
import { submitPrompt } from "./actions";

export default function Home() {
  const [_formState, formAction] = useActionState<State, FormData>(
    submitPrompt,
    null
  );

  const promptFieldId = useId();

  return (
    <main className="">
      <section className="py-20">
        <div className="max-w-md px-4 mx-auto space-y-8">
          <h1 className="text-2xl font-medium text-gray-300">Peepog</h1>
          <h2 className="text-4xl font-medium text-gray-300">Aug 1, 2025</h2>

          <form className="w-full" action={formAction} noValidate>
            <label htmlFor="prompt">Enter your prompt</label>
            <textarea
              className="w-full p-2 border border-gray-300 rounded mt-2"
              name="prompt"
              id={promptFieldId}
              aria-describedby={`${promptFieldId}-error`}
            />
            <button
              type="submit"
              className="mt-4 px-6 py-2 bg-gray-400 hover:bg-gray-300 text-black rounded-md cursor-pointer"
            >
              Submit
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
