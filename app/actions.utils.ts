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

type ErrorState = {
  status: "error";
  message: string;
  errors?: Array<{
    path: string;
    message: string;
  }>;
};

export type State<T = undefined> = SuccessState<T> | ErrorState | null;
